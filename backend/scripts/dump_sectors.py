import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = BASE_DIR.parent
for candidate in (str(BASE_DIR), str(ROOT_DIR)):
    if candidate not in sys.path:
        sys.path.insert(0, candidate)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "stock_screener.settings")

import django

django.setup()

from collections import defaultdict
from screener.models import Industry

sector_map = defaultdict(list)
for industry in Industry.objects.select_related("sector").order_by("sector__name", "name"):
    sector_name = industry.sector.name if industry.sector else "Unassigned"
    sector_map[sector_name].append(industry.name)

with open("sector_industries.json", "w", encoding="utf-8") as fh:
    import json
    json.dump(sector_map, fh, ensure_ascii=False, indent=4)

print(f"Exported {len(sector_map)} sectors")
