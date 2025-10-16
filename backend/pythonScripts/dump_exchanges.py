from screener.models import Exchange
with open('exchanges_dump.txt','w',encoding='utf-8') as fh:
    for exch in Exchange.objects.order_by('code'):
        fh.write(f"{exch.code}|{exch.name}|{exch.country}\n")
