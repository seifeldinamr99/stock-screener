from screener.models import Exchange
print(sorted(list(Exchange.objects.values_list("code", flat=True))))
