from screener.models import Stock
from django.db.models import Count
core = Stock.objects.values('ticker').annotate(c=Count('id')).filter(c__gt=1)
print(f"Found {core.count()} duplicate tickers")
for entry in core[:20]:
    print(entry['ticker'], entry['c'])
