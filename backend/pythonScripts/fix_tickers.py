from screener.models import Stock
from django.db import transaction
with transaction.atomic():
    qs = Stock.objects.filter(ticker__regex=r'^\d+\.0+$')
    deleted = qs.count()
    qs.delete()
print(f"Removed {deleted} decimal-formatted tickers")
