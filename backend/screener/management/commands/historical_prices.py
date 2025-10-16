import logging
from datetime import date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP

import pandas as pd
import yfinance as yf
from django.core.management.base import BaseCommand, CommandError
from django.db import models, transaction
from django.utils import timezone

from screener.models import HistoricalPrice, Stock

YF_SUFFIX_MAP = {
    "LSE": ".L",
    "HKEX": ".HK",
    "TSX": ".TO",
    "TSXV": ".V",
    "ASX": ".AX",
    "BSE": ".BO",
    "NSE": ".NS",
    "FWB": ".F",
    "SWX": ".SW",
    "KRX": ".KS",
    "KOSDAQ": ".KQ",
    "SGX": ".SI",
    "TSE": ".T",   # Tokyo
    "SSE": ".SS",  # Shanghai
    "SZSE": ".SZ",  # Shenzhen
    "JPX": ".T",
    "EURONEXT": ".PA",  # default to Paris when unspecified
}


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Fetch daily historical prices from yfinance and upsert them into HistoricalPrice."

    def add_arguments(self, parser):
        parser.add_argument(
            "--tickers",
            nargs="+",
            help="Limit the sync to the provided tickers (symbol matches Stock.ticker or Stock.full_ticker).",
        )
        parser.add_argument(
            "--start",
            type=str,
            help="Override the start date (YYYY-MM-DD). Defaults to 5 years ago or last synced date per stock.",
        )
        parser.add_argument(
            "--end",
            type=str,
            help="Override the end date (YYYY-MM-DD). Defaults to today.",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=100,
            help="Number of stocks to process per batch (default: 100).",
        )
        parser.add_argument(
            "--max-stocks",
            type=int,
            help="Stop after processing this many stocks.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Fetch data but do not write to the database.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Ignore prices_last_synced_at and refetch from the provided/default start date.",
        )

    def handle(self, *args, **options):
        start_override = self._parse_date_option(options.get("start"), "start")
        end_override = self._parse_date_option(options.get("end"), "end")
        if end_override and start_override and start_override > end_override:
            raise CommandError("Start date cannot be after end date.")

        tickers = options.get("tickers")
        batch_size = options["batch_size"]
        max_stocks = options.get("max_stocks")
        dry_run = options["dry_run"]
        force = options["force"]

        queryset = Stock.objects.all().order_by("id")
        if tickers:
            queryset = queryset.filter(
                models.Q(ticker__in=tickers) | models.Q(full_ticker__in=tickers)
            )

        total = queryset.count()
        if not total:
            self.stdout.write(self.style.WARNING("No stocks matched the selection criteria."))
            return

        processed = 0
        created_rows = 0
        updated_rows = 0
        failures = []
        end_date = end_override or date.today()

        iterator = queryset.iterator(chunk_size=batch_size)
        for stock in iterator:
            if max_stocks and processed >= max_stocks:
                break

            processed += 1
            symbol = self._resolve_symbol(stock)
            start_date = self._determine_start_date(stock, start_override, force)

            if start_date and start_date > end_date:
                self.stdout.write(
                    self.style.WARNING(
                        f"[SKIP] {symbol}: start_date {start_date} is after end_date {end_date}. Nothing to fetch."
                    )
                )
                continue

            range_label = f"{start_date}" if start_date else "max"
            self.stdout.write(f"[{processed}/{total}] Fetching {symbol} ({range_label} -> {end_date})...")
            try:
                df = self._download_prices(symbol, start_date, end_date)
            except Exception as exc:  # noqa: BLE001 - capture all errors to keep the loop going
                message = f"[FAIL] {symbol}: {exc}"
                failures.append(message)
                logger.exception("Error downloading prices for %s", symbol)
                self.stdout.write(self.style.ERROR(message))
                continue

            if df.empty:
                self.stdout.write(self.style.WARNING(f"[SKIP] {symbol}: no data returned."))
                continue

            if dry_run:
                self.stdout.write(self.style.HTTP_INFO(f"[DRY RUN] {symbol}: {len(df)} rows fetched."))
                continue

            try:
                created, updated = self._upsert_prices(stock, df)
            except Exception as exc:  # noqa: BLE001
                message = f"[FAIL] {symbol}: upsert failed ({exc})"
                failures.append(message)
                logger.exception("Error upserting prices for %s", symbol)
                self.stdout.write(self.style.ERROR(message))
                continue

            created_rows += created
            updated_rows += updated
            latest_close = self._latest_close_price(df)
            now = timezone.now()
            update_kwargs = {
                "prices_last_synced_at": now,
                "updated_at": now,
            }
            if latest_close is not None:
                update_kwargs["price"] = latest_close
            Stock.objects.filter(pk=stock.pk).update(**update_kwargs)
            self.stdout.write(
                self.style.SUCCESS(
                    f"[OK] {symbol}: {created} inserted, {updated} updated (total {len(df)} rows)."
                )
            )

        self.stdout.write(self.style.NOTICE(f"Processed stocks: {processed}"))
        self.stdout.write(self.style.NOTICE(f"Inserted rows: {created_rows}, Updated rows: {updated_rows}"))

        if failures:
            self.stdout.write(self.style.WARNING("Failures encountered:"))
            for failure in failures:
                self.stdout.write(self.style.WARNING(f"  - {failure}"))
        else:
            self.stdout.write(self.style.SUCCESS("Historical price sync completed without failures."))

    @staticmethod
    def _parse_date_option(value: str | None, label: str) -> date | None:
        if not value:
            return None
        try:
            return datetime.strptime(value, "%Y-%m-%d").date()
        except ValueError as exc:
            raise CommandError(f"Invalid {label} date '{value}'. Expected format YYYY-MM-DD.") from exc

    @staticmethod
    def _determine_start_date(stock: Stock, override: date | None, force: bool) -> date | None:
        if override:
            return override
        if not force:
            latest_price = (
                stock.historical_prices.order_by("-date").values_list("date", flat=True).first()
            )
            if latest_price:
                return latest_price + timedelta(days=1)
            if stock.prices_last_synced_at:
                return stock.prices_last_synced_at.date()
        # None signals full history ("max") fetch.
        return None

    @staticmethod
    def _download_prices(symbol: str, start_date: date | None, end_date: date) -> pd.DataFrame:
        if start_date:
            df = yf.download(
                tickers=symbol,
                start=start_date.isoformat(),
                end=(end_date + timedelta(days=1)).isoformat(),
                interval="1d",
                auto_adjust=False,
                progress=False,
                threads=False,
            )
        else:
            df = yf.download(
                tickers=symbol,
                period="max",
                end=(end_date + timedelta(days=1)).isoformat(),
                interval="1d",
                auto_adjust=False,
                progress=False,
                threads=False,
            )
        if df is None or df.empty:
            return pd.DataFrame()
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        df = df.rename(
            columns={
                "Open": "open_price",
                "High": "high_price",
                "Low": "low_price",
                "Close": "close_price",
                "Adj Close": "adjusted_close",
                "Volume": "volume",
            }
        )
        df.index = df.index.tz_localize(None)
        return df[["open_price", "high_price", "low_price", "close_price", "adjusted_close", "volume"]]

    def _upsert_prices(self, stock: Stock, df: pd.DataFrame) -> tuple[int, int]:
        records = []
        dates = []
        for idx, row in df.iterrows():
            price_date = idx.date() if isinstance(idx, datetime) else idx
            dates.append(price_date)
            records.append(
                HistoricalPrice(
                    stock=stock,
                    date=price_date,
                    open_price=self._to_decimal(row.get("open_price")),
                    high_price=self._to_decimal(row.get("high_price")),
                    low_price=self._to_decimal(row.get("low_price")),
                    close_price=self._to_decimal(row.get("close_price")),
                    adjusted_close=self._to_decimal(row.get("adjusted_close")),
                    volume=self._to_int(row.get("volume")),
                )
            )

        existing_dates = set(
            HistoricalPrice.objects.filter(stock=stock, date__in=dates).values_list("date", flat=True)
        )

        with transaction.atomic():
            HistoricalPrice.objects.bulk_create(
                records,
                update_conflicts=True,
                unique_fields=["stock", "date"],
                update_fields=["open_price", "high_price", "low_price", "close_price", "adjusted_close", "volume", "updated_at"],
            )

        created_count = len(dates) - len(existing_dates)
        updated_count = len(existing_dates)
        return created_count, updated_count

    @staticmethod
    def _latest_close_price(df: pd.DataFrame) -> Decimal | None:
        if "close_price" not in df.columns or df.empty:
            return None
        series = df["close_price"].dropna()
        if series.empty:
            return None
        value = Decimal(str(series.iloc[-1]))
        return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @staticmethod
    def _to_decimal(value) -> Decimal | None:
        if value is None or pd.isna(value):
            return None
        return Decimal(str(round(float(value), 4)))

    @staticmethod
    def _to_int(value):
        if value is None or pd.isna(value):
            return None
        return int(value)

    def _resolve_symbol(self, stock: Stock) -> str:
        """
        Convert stored ticker metadata into a yfinance-compatible symbol.
        Defaults to plain ticker for US listings, applies exchange suffix mapping otherwise.
        """
        raw_symbol = stock.ticker
        if stock.full_ticker and ":" in stock.full_ticker:
            _, candidate = stock.full_ticker.split(":", 1)
            raw_symbol = candidate or stock.ticker

        exchange_code = (stock.exchange.code or "").upper()

        # Normalize Hong Kong tickers to 4 digits to match yfinance convention.
        if exchange_code == "HKEX" and raw_symbol.isdigit():
            raw_symbol = raw_symbol.zfill(4)

        suffix = YF_SUFFIX_MAP.get(exchange_code, "")

        # Some exchanges in yfinance use custom suffixes per market segment (e.g., NASDAQGS).
        # If the full ticker prefix carries that detail and the exchange suffix map lacks an entry,
        # fall back to analyzing the prefix directly.
        if not suffix and stock.full_ticker and ":" in stock.full_ticker:
            prefix = stock.full_ticker.split(":", 1)[0].upper()
            suffix = YF_SUFFIX_MAP.get(prefix, "")

        return f"{raw_symbol}{suffix}"
