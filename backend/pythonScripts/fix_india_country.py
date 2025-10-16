from screener.models import Exchange
updated = 0
for exch in Exchange.objects.filter(country__iexact="india_mid_cap"):
    exch.country = "India"
    exch.save()
    updated += 1
print(f"Updated {updated} exchanges")
