import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = BASE_DIR.parent
sys.path.extend([str(BASE_DIR), str(ROOT_DIR)])
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "stock_screener.settings")

import django

django.setup()

from screener.models import Stock, Exchange
from django.db import transaction

consolidation = {
    "TORONTO": "CANADA",
    "USA": "OTCMARKETS",
    "EURONEXT25": "AMSTERDAM",
    "LONDONSTOC": "LONDON",
    "THESTOCKEX": "HONGKONG",
    "SHANGHAIST": "SHANGHAI",
    "SHENZHENST": "SHENZHEN",
}

final_exchanges = {
    "CANADA": ("Toronto Stock Exchange", "Canada"),
    "CSE": ("Canadian Securities Exchange", "Canada"),
    "TSXV": ("TSX Venture Exchange", "Canada"),
    "NASDAQ": ("Nasdaq Global Market", "United States"),
    "NYSE": ("NYSE Arca", "United States"),
    "OTCMARKETS": ("OTC Markets", "United States"),
    "AMSTERDAM": ("Euronext Amsterdam", "Netherlands"),
    "BRUSSELS": ("Euronext Brussels", "Belgium"),
    "PARIS": ("Euronext Paris", "France"),
    "LISBON": ("Euronext Lisbon", "Portugal"),
    "LONDON": ("London Stock Exchange", "United Kingdom"),
    "NSE": ("National Stock Exchange of India", "India"),
    "BSE": ("Bombay Stock Exchange", "India"),
    "HONGKONG": ("Hong Kong Stock Exchange", "Hong Kong"),
    "SHANGHAI": ("Shanghai Stock Exchange", "China"),
    "SHENZHEN": ("Shenzhen Stock Exchange", "China"),
    "TOKYO": ("Tokyo Stock Exchange", "Japan"),
}

with transaction.atomic():
    reassigned = 0
    for old_code, new_code in consolidation.items():
        try:
            target = Exchange.objects.get(code=new_code)
        except Exchange.DoesNotExist:
            print(f"Missing target exchange {new_code}; skipping {old_code}")
            continue
        affected = Stock.objects.filter(exchange__code=old_code).update(exchange=target)
        reassigned += affected
        Exchange.objects.filter(code=old_code).delete()

    normalized = 0
    for code, (name, country) in final_exchanges.items():
        exch, created = Exchange.objects.get_or_create(code=code, defaults={"name": name, "country": country})
        if not created:
            changed = False
            if exch.name != name:
                exch.name = name
                changed = True
            if exch.country != country:
                exch.country = country
                changed = True
            if changed:
                exch.save()
                normalized += 1

print(f"Reassigned {reassigned} stock rows")
print(f"Updated {normalized} exchanges")
