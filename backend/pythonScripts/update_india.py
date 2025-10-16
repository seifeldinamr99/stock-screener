from screener.models import Stock, Exchange
from django.db.models import Q
indian_exchanges = Exchange.objects.filter(country__iexact="India_mid_cap")
updated_exchanges = 0
for exch in indian_exchanges:
    exch.country = "India"
    exch.save()
    updated_exchanges += 1
stock_qs = Stock.objects.filter(Q(exchange__country__iexact="India") | Q(exchange__code__in=["NSE","BSE"]))
count = stock_qs.update(market_cap=None)
print(f"Updated market cap for {count} stocks; exchanges updated: {updated_exchanges}")
