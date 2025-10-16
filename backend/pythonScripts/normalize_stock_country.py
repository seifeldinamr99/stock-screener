from screener.models import Stock
count = Stock.objects.filter(country__iexact="india_mid_cap").update(country="India")
print(f"Normalized country for {count} stocks")
