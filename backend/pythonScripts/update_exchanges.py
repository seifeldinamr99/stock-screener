mapping = {
    "AMSTERDAM": ("Euronext Amsterdam", "Netherlands"),
    "BRUSSELS": ("Euronext Brussels", "Belgium"),
    "BSE": ("Bombay Stock Exchange", "India"),
    "CANADA": ("Toronto Stock Exchange", "Canada"),
    "CSE": ("Canadian Securities Exchange", "Canada"),
    "EURONEXT25": ("Euronext Amsterdam", "Netherlands"),
    "HONGKONG": ("Hong Kong Stock Exchange", "Hong Kong"),
    "LISBON": ("Euronext Lisbon", "Portugal"),
    "LONDON": ("London Stock Exchange", "United Kingdom"),
    "LONDONSTOC": ("London Stock Exchange", "United Kingdom"),
    "NASDAQ": ("Nasdaq Global Market", "United States"),
    "NSE": ("National Stock Exchange of India", "India"),
    "NYSE": ("NYSE Arca", "United States"),
    "OTCMARKETS": ("OTC Markets", "United States"),
    "PARIS": ("Euronext Paris", "France"),
    "SHANGHAI": ("Shanghai Stock Exchange", "China"),
    "SHANGHAIST": ("Shanghai Stock Exchange", "China"),
    "SHENZHEN": ("Shenzhen Stock Exchange", "China"),
    "SHENZHENST": ("Shenzhen Stock Exchange", "China"),
    "THESTOCKEX": ("Hong Kong Stock Exchange", "Hong Kong"),
    "TOKYO": ("Tokyo Stock Exchange", "Japan"),
    "TORONTO": ("Toronto Stock Exchange", "Canada"),
    "TSXV": ("TSX Venture Exchange", "Canada"),
    "USA": ("OTC Markets", "United States"),
}

from screener.models import Exchange

updated = 0
for code, (name, country) in mapping.items():
    try:
        exch = Exchange.objects.get(code=code)
    except Exchange.DoesNotExist:
        continue
    changed = False
    if exch.name != name:
        exch.name = name
        changed = True
    if exch.country != country:
        exch.country = country
        changed = True
    if changed:
        exch.save()
        updated += 1
print(f"Updated {updated} exchanges")
