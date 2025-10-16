import os
import re
import sys
from pathlib import Path

import django

BASE_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = BASE_DIR.parent

for candidate in (str(BASE_DIR), str(ROOT_DIR)):
    if candidate not in sys.path:
        sys.path.insert(0, candidate)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "stock_screener.settings")
django.setup()

from screener.management.commands.import_tickers import COUNTRY_ALIASES, _normalize_country  # noqa: E402
from screener.models import Exchange, Stock  # noqa: E402


def normalize(value):
    return _normalize_country(value)


def main():
    updated_exchanges = 0
    for exchange in Exchange.objects.all():
        normalized = normalize(exchange.country)
        if normalized and normalized != exchange.country:
            exchange.country = normalized
            exchange.save()
            updated_exchanges += 1

    updated_stocks = 0
    for stock in Stock.objects.all():
        changed = False
        normalized = normalize(stock.country)
        if normalized and normalized != stock.country:
            stock.country = normalized
            changed = True
        operating_country = normalize(stock.operating_country)
        if operating_country and operating_country != stock.operating_country:
            stock.operating_country = operating_country
            changed = True
        if changed:
            Stock.objects.filter(pk=stock.pk).update(
                country=stock.country,
                operating_country=stock.operating_country,
            )
            updated_stocks += 1

    print(f"Normalized exchanges: {updated_exchanges}")
    print(f"Normalized stock records: {updated_stocks}")


if __name__ == "__main__":
    main()
