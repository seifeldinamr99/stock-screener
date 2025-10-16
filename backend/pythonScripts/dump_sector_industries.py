from screener.models import Sector, Industry
from collections import defaultdict
result = defaultdict(list)
for industry in Industry.objects.select_related("sector").order_by("sector__name","name"):
    if industry.sector:
        result[industry.sector.name].append(industry.name)
    else:
        result["Unassigned"].append(industry.name)
with open('sector_industries.txt','w',encoding='utf-8') as fh:
    for sector, industries in sorted(result.items()):
        fh.write(sector + "\n")
        for name in industries:
            fh.write("  - " + name + "\n")
