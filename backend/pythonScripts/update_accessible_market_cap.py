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

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "stock_screener.settings")
django.setup()

from screener.models import AccessibleStock  # noqa: E402  # pylint: disable=wrong-import-position


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


def build_market_cap_lookup():
    lookup = {}
    with open(CSV_PATH, newline="", encoding="utf-8-sig") as csvfile:
        reader = csv.reader(csvfile)
        fieldnames = next(reader)

        def row_to_dict(values):
            data = {}
            for idx, key in enumerate(fieldnames):
                if key in data:
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

            if "market_cap" in row:
                market_cap_value = row["market_cap"]
            else:
                market_cap_value = row.get("market_cap__9")

            lookup[ticker] = to_decimal(market_cap_value)
    return lookup


def update_market_caps():
    lookup = build_market_cap_lookup()
    created = updated = skipped = 0

    for ticker, market_cap in lookup.items():
        if market_cap is None:
            skipped += 1
            continue

        try:
            stock = AccessibleStock.objects.get(ticker=ticker)
        except AccessibleStock.DoesNotExist:
            skipped += 1
            continue

        if stock.market_cap != market_cap:
            stock.market_cap = market_cap
            stock.save(update_fields=["market_cap"])
            updated += 1
        else:
            skipped += 1

    total = AccessibleStock.objects.count()
    return updated, total


if __name__ == "__main__":
    updated_count, total_count = update_market_caps()
    print(
        f"Accessible Stocks market_cap update complete. "
        f"Updated: {updated_count}, Total Stocks: {total_count}"
    )
