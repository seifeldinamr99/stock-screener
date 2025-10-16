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


def fix_unknowns():
    with transaction.atomic():
        unknown_sector, _ = AccessibleSector.objects.get_or_create(name='Unknown')
        unknown_industry, _ = AccessibleIndustry.objects.get_or_create(
            name='Unknown', defaults={'sector': unknown_sector}
        )
        if unknown_industry.sector_id != unknown_sector.id:
            unknown_industry.sector = unknown_sector
            unknown_industry.save(update_fields=['sector'])

        qs = AccessibleStock.objects.filter(industry__name__iexact='Unknown')
        qs = qs.select_related('sector', 'industry')
        for stock in qs:
            updates = []
            if stock.sector_id != unknown_sector.id:
                stock.sector = unknown_sector
                updates.append('sector')
            if stock.industry_id != unknown_industry.id:
                stock.industry = unknown_industry
                updates.append('industry')
            if updates:
                stock.save(update_fields=updates)


if __name__ == '__main__':
    fix_unknowns()
