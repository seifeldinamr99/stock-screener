from screener.models import Stock
with open('india_exchanges.txt','w',encoding='utf-8') as fh:
    for row in Stock.objects.filter(country__iexact="India").values_list("exchange__code","exchange__name","exchange_short_name","exchange_long_name").distinct():
        fh.write(str(row)+'\n')
