import argparse
import os
import sys
from pathlib import Path

import pandas as pd

import django


BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BASE_DIR
ROOT = PROJECT_ROOT.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "stock_screener.settings")
django.setup()

from screener.models import Industry, Sector, Stock  # noqa: E402


DEFAULT_CLASSIFIED_PATH = BASE_DIR.parent / "Tickers" / "20_Classified.xlsx"

COLUMN_ALIASES = {
    "company_name": ["Company Name", "company_name", "Name"],
    "sector": ["Sector", "sector"],
    "industry": ["Industry", "industry"],
    "market_cap": ["Market Cap (Adjusted)", "market_cap_adjusted", "MarketCap"],
    "exchange_name": ["Stock Exchange Name", "exchange_name", "Exchange Name"],
    "exchange_code": ["Exchange", "exchange_code", "Exchange Code"],
    "operating_country": ["Operating Country", "operating_country", "country"],
}


def normalize(text):
    if text is None:
        return None
    return str(text).strip()


def normalize_name(text):
    normalized = normalize(text)
    return normalized.lower() if normalized else None


def resolve_columns(df):
    column_map = {}
    for key, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in df.columns:
                column_map[key] = alias
                break
    return column_map


def update_from_workbook(workbook_path: Path):
    if not workbook_path.exists():
        print(f"Classification workbook not found: {workbook_path}")
        return

    df = pd.read_excel(workbook_path)
    column_map = resolve_columns(df)
    required_keys = ["company_name", "industry", "sector"]
    for key in required_keys:
        if key not in column_map:
            print(f"Missing required column for '{key}'. Tried: {COLUMN_ALIASES[key]}")
            return

    unmatched = []
    updated = 0

    name_map = {}
    for _, row in df.iterrows():
        key = normalize_name(row.get(column_map["company_name"]))
        if key:
            name_map[key] = row

    for stock in Stock.objects.all():
        key = normalize_name(stock.company_name)
        if not key:
            continue
        row = name_map.get(key)
        if row is None:
            continue
        sector_name = normalize(row.get(column_map["sector"]))
        industry_name = normalize(row.get(column_map["industry"]))

        sector_obj = None
        industry_obj = None

        if sector_name:
            sector_obj, _ = Sector.objects.get_or_create(name=sector_name)

        if industry_name:
            defaults = {"sector": sector_obj} if sector_obj else {}
            industry_obj, _ = Industry.objects.get_or_create(name=industry_name, defaults=defaults)
            if sector_obj and industry_obj.sector != sector_obj:
                industry_obj.sector = sector_obj
                industry_obj.save()

        if sector_obj:
            stock.sector = sector_obj
        if industry_obj:
            stock.industry = industry_obj

        market_cap_column = column_map.get("market_cap")
        market_cap = row.get(market_cap_column) if market_cap_column else None
        if pd.notna(market_cap):
            stock.market_cap = market_cap

        exchange_name_column = column_map.get("exchange_name")
        exchange_name = normalize(row.get(exchange_name_column)) if exchange_name_column else None
        if exchange_name:
            stock.exchange_long_name = exchange_name
        exchange_short_column = column_map.get("exchange_code")
        exchange_short = normalize(row.get(exchange_short_column)) if exchange_short_column else None
        if exchange_short:
            stock.exchange_short_name = exchange_short

        operating_country_column = column_map.get("operating_country")
        operating_country = normalize(row.get(operating_country_column)) if operating_country_column else None
        if operating_country:
            stock.operating_country = operating_country

        stock.save()
        updated += 1

    for key, row in name_map.items():
        name_value = row.get(column_map["company_name"])
        if key and not Stock.objects.filter(company_name__iexact=name_value).exists():
            unmatched.append(str(name_value))

    print(f"Updated {updated} stocks from classification workbook '{workbook_path.name}'.")
    if unmatched:
        unmatched_path = workbook_path.parent / f"{workbook_path.stem}_unmatched.txt"
        unmatched_path.write_text("\n".join(unmatched), encoding="utf-8")
        print(f"{len(unmatched)} companies from classification file were not found. See {unmatched_path}")


def main():
    parser = argparse.ArgumentParser(description="Update stock sectors/industries from a classification workbook.")
    parser.add_argument(
        "--workbook",
        "-w",
        type=str,
        default=str(DEFAULT_CLASSIFIED_PATH),
        help="Path to classification Excel workbook (default: %(default)s)",
    )
    args = parser.parse_args()
    update_from_workbook(Path(args.workbook))


if __name__ == "__main__":
    main()
