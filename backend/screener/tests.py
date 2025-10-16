from decimal import Decimal
from unittest import mock

import pandas as pd
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from screener.models import Exchange, HistoricalPrice, Sector, Stock


class HistoricalPricesCommandTests(TestCase):
    def setUp(self):
        self.exchange = Exchange.objects.create(code="NYSE", name="New York Stock Exchange", country="USA")
        self.sector = Sector.objects.create(name="Technology")

    def _create_stock(self, ticker: str, price: Decimal | None = None) -> Stock:
        return Stock.objects.create(
            ticker=ticker,
            company_name=f"{ticker} Corp",
            exchange=self.exchange,
            sector=self.sector,
            industry=None,
            country="USA",
            price=price,
        )

    @mock.patch("screener.management.commands.historical_prices.yf.download")
    def test_updates_stock_price_with_latest_close(self, mock_download):
        stock = self._create_stock("TST1")
        df = pd.DataFrame(
            {
                "Open": [10.0, 10.5],
                "High": [10.5, 11.0],
                "Low": [9.8, 10.2],
                "Close": [10.25, 10.87],
                "Adj Close": [10.20, 10.80],
                "Volume": [1000, 1500],
            },
            index=pd.to_datetime(["2024-01-01", "2024-01-02"]),
        )
        mock_download.return_value = df

        call_command("historical_prices", "--tickers", stock.ticker)

        stock.refresh_from_db()
        self.assertEqual(stock.price, Decimal("10.87").quantize(Decimal("0.01")))
        self.assertIsNotNone(stock.prices_last_synced_at)
        self.assertEqual(HistoricalPrice.objects.filter(stock=stock).count(), 2)

    @mock.patch("screener.management.commands.historical_prices.yf.download")
    def test_dry_run_does_not_update_price_or_insert_prices(self, mock_download):
        stock = self._create_stock("TST2")
        df = pd.DataFrame(
            {
                "Open": [10.0],
                "High": [10.5],
                "Low": [9.8],
                "Close": [10.25],
                "Adj Close": [10.20],
                "Volume": [1000],
            },
            index=pd.to_datetime(["2024-01-01"]),
        )
        mock_download.return_value = df

        call_command("historical_prices", "--tickers", stock.ticker, "--dry-run")

        stock.refresh_from_db()
        self.assertIsNone(stock.price)
        self.assertIsNone(stock.prices_last_synced_at)
        self.assertEqual(HistoricalPrice.objects.filter(stock=stock).count(), 0)

    @mock.patch("screener.management.commands.historical_prices.yf.download")
    def test_skips_price_update_when_close_missing(self, mock_download):
        current_price = Decimal("15.00")
        stock = self._create_stock("TST3", price=current_price)
        df = pd.DataFrame(
            {
                "Open": [10.0],
                "High": [10.5],
                "Low": [9.8],
                "Close": [float("nan")],
                "Adj Close": [10.20],
                "Volume": [1000],
            },
            index=pd.to_datetime(["2024-01-01"]),
        )
        mock_download.return_value = df
        before_sync = timezone.now()

        call_command("historical_prices", "--tickers", stock.ticker)

        stock.refresh_from_db()
        self.assertEqual(stock.price, current_price)
        self.assertIsNotNone(stock.prices_last_synced_at)
        self.assertGreaterEqual(stock.prices_last_synced_at, before_sync)
        self.assertEqual(HistoricalPrice.objects.filter(stock=stock).count(), 1)
