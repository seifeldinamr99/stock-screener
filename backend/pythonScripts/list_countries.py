from screener.models import Exchange
print(sorted({exch.country for exch in Exchange.objects.all()}))
