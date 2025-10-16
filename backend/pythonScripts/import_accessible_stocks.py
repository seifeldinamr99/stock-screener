import os
import sys
import csv
from decimal import Decimal, InvalidOperation


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
for path in (BASE_DIR, PROJECT_ROOT):
    if path not in sys.path:
        sys.path.insert(0, path)

import django
from django.db import transaction


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "stock_screener.settings")
django.setup()

from screener.models import (  # noqa: E402  # pylint: disable=wrong-import-position
    AccessibleExchange,
    AccessibleSector,
    AccessibleIndustry,
    AccessibleStock,
)


CSV_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "Tickers",
    "AccessibleStocks.csv",
)


def to_decimal(value):
    if value is None:
        return None
    value = str(value).strip()
    if not value:
        return None
    try:
        return Decimal(value)
    except InvalidOperation:
        try:
            return Decimal(value.replace(",", ""))
        except Exception:
            return None


def to_int(value):
    if value is None:
        return None
    value = str(value).strip()
    if not value:
        return None
    try:
        return int(float(value))
    except Exception:
        return None


def import_accessible_stocks():
    created = 0
    updated = 0

    with open(CSV_PATH, newline="", encoding="utf-8-sig") as csvfile:
        reader = csv.reader(csvfile)
        fieldnames = next(reader)

        # Build custom DictReader to handle duplicate headers
        def row_to_dict(values):
            data = {}
            for idx, key in enumerate(fieldnames):
                if key in data:
                    # store duplicates with suffix index for later reference
                    dup_key = f"{key}__{idx}"
                    data[dup_key] = values[idx]
                else:
                    data[key] = values[idx]
            return data

        for values in reader:
            row = row_to_dict(values)

            ticker = (row.get("ticker") or "").strip()
            if not ticker:
                continue

            exchange_code = (row.get("exchange_code") or "").strip() or "UNKNOWN"
            exchange_name = exchange_code
            exchange_country = (
                (row.get("exchange_country") or row.get("country") or "").strip()
                or "Unknown"
            )

            sector_name = (row.get("sector_name") or "").strip() or "Unknown"
            industry_name = (row.get("industry_name") or "").strip() or "Unknown"

            price = to_decimal(row.get("price"))
            previous_close = to_decimal(row.get("previous_close"))
            if price is not None and previous_close is not None and previous_close != 0:
                price_change = price - previous_close
                price_change_percent = (price_change / previous_close) * Decimal("100")
            else:
                price_change = None
                price_change_percent = None

            # pick first occurrence of market_cap if duplicated
            if "market_cap" in row:
                market_cap_value = row["market_cap"]
            else:
                market_cap_value = row.get("market_cap__9")

            with transaction.atomic():
                exchange, _ = AccessibleExchange.objects.get_or_create(
                    code=exchange_code,
                    defaults={"name": exchange_name, "country": exchange_country},
                )
                if exchange.name == exchange.code:
                    exchange.name = exchange_name
                if exchange.country in ("", "Unknown") and exchange_country:
                    exchange.country = exchange_country
                exchange.save(update_fields=["name", "country"])

                sector, _ = AccessibleSector.objects.get_or_create(name=sector_name)
                industry, created_industry = AccessibleIndustry.objects.get_or_create(
                    name=industry_name,
                    defaults={"sector": sector},
                )
                if not created_industry and industry.sector != sector:
                    industry.sector = sector
                    industry.save(update_fields=["sector"])

                defaults = {
                    "company_name": row.get("company_name") or ticker,
                    "full_ticker": None,
                    "sector": sector,
                    "industry": industry,
                    "country": (row.get("country") or "").strip()
                    or exchange_country
                    or "Unknown",
                    "operating_country": None,
                    "operating_country_iso": None,
                    "exchange_long_name": exchange.name,
                    "exchange_short_name": exchange.code,
                    "market_cap": to_decimal(market_cap_value),
                    "price": price,
                    "price_target": None,
                    "pe_ratio": to_decimal(row.get("pe_ratio")),
                    "dividend_yield": to_decimal(row.get("dividend_yield")),
                    "dividend_per_share": to_decimal(row.get("dividend_rate")),
                    "price_to_book": to_decimal(row.get("price_to_book")),
                    "price_to_sales": to_decimal(row.get("price_to_sales")),
                    "enterprise_value": to_decimal(row.get("enterprise_value")),
                    "total_debt_to_total_capital": None,
                    "float_shares_to_outstanding": None,
                    "volume": to_int(row.get("volume")),
                    "average_volume": to_int(row.get("average_volume")),
                    "relative_volume": to_decimal(row.get("relative_volume")),
                    "relative_strength_index": to_decimal(
                        row.get("relative_strength_index")
                    ),
                    "price_change": price_change,
                    "price_change_percent": price_change_percent,
                    "peg_ratio": to_decimal(row.get("peg_ratio")),
                    "fair_value": to_decimal(row.get("fair_value")),
                    "fair_value_upside": to_decimal(row.get("fair_value_upside")),
                    "fair_value_label": row.get("fair_value_label") or None,
                    "analyst_target": to_decimal(row.get("analyst_target")),
                    "analyst_upside": to_decimal(row.get("analyst_upside")),
                    "analyst_target_label": row.get("analyst_target_label") or None,
                    "health_label": row.get("health_label") or None,
                }

                stock, was_created = AccessibleStock.objects.update_or_create(
                    ticker=ticker,
                    exchange=exchange,
                    defaults=defaults,
                )
                if was_created:
                    created += 1
                else:
                    updated += 1

    total = AccessibleStock.objects.count()
    return created, updated, total


if __name__ == "__main__":
    created_count, updated_count, total_count = import_accessible_stocks()
    print(
        f"Accessible Stocks import complete. "
        f"Created: {created_count}, Updated: {updated_count}, Total: {total_count}"
    )
