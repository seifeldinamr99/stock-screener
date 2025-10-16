import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
for path in (BASE_DIR, PROJECT_ROOT):
    if path not in sys.path:
        sys.path.insert(0, path)

import django
from django.db import transaction

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'stock_screener.settings')
django.setup()

from screener.models import AccessibleStock, AccessibleSector, AccessibleIndustry  # noqa: E402

UPDATES = [
    ("2AR", "ARMOUR Residential REIT, Inc.", "REIT - Mortgage", "Real Estate"),
    ("WHSMY", "WH Smith PLC (ADR)", "Specialty Retail", "Consumer Cyclical"),
    ("GROW", "Molten Ventures Plc", "Asset Management", "Financial Services"),
    ("SHIGAN", "Shigan Quantum Technologies Ltd", "Auto Parts", "Industrials"),
    ("WKOF", "Weiss Korea Opportunity Ord", "Asset Management", "Financial Services"),
    ("ACRM", "Acuity RM Group Plc", "Software - Application", "Technology"),
]


def apply_updates():
    results = []
    with transaction.atomic():
        for ticker, name, industry_name, sector_name in UPDATES:
            sector, _ = AccessibleSector.objects.get_or_create(name=sector_name)
            industry, created = AccessibleIndustry.objects.get_or_create(
                name=industry_name,
                defaults={'sector': sector}
            )
            if not created and industry.sector_id != sector.id:
                industry.sector = sector
                industry.save(update_fields=['sector'])

            try:
                stock = AccessibleStock.objects.get(ticker=ticker)
            except AccessibleStock.DoesNotExist:
                results.append((ticker, 'missing'))
                continue

            updates_needed = []
            if stock.company_name != name:
                stock.company_name = name
                updates_needed.append('company_name')
            if stock.sector_id != sector.id:
                stock.sector = sector
                updates_needed.append('sector')
            if stock.industry_id != industry.id:
                stock.industry = industry
                updates_needed.append('industry')

            if updates_needed:
                stock.save(update_fields=updates_needed)
                results.append((ticker, 'updated', updates_needed))
            else:
                results.append((ticker, 'unchanged'))
    return results


if __name__ == '__main__':
    for entry in apply_updates():
        print(entry)
