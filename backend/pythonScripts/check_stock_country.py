from screener.models import Stock
remaining = Stock.objects.filter(country__iexact="india_mid_cap").count()
print(f"Stocks w/ india_mid_cap country: {remaining}")
