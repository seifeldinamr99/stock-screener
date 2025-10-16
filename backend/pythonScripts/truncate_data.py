from screener.models import Stock, Industry, Sector, Exchange
Stock.objects.all().delete()
Industry.objects.all().delete()
Sector.objects.all().delete()
Exchange.objects.all().delete()
print('Cleared stocks/industries/sectors/exchanges')
