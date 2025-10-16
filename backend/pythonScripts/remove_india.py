from screener.models import Stock
removed, _ = Stock.objects.filter(country__iexact="India").delete()
print(f"Removed {removed} India stocks")
