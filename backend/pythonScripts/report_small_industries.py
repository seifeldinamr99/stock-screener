"""Export industries with fewer than N associated stocks."""

from __future__ import annotations

from pathlib import Path

import pandas as pd
from django.db.models import Count

from screener.models import Industry, Stock


def generate(threshold: int = 20, output_path: str | None = None) -> str | None:
    """Create an Excel report of industries with fewer than `threshold` stocks."""
    industries = (
        Industry.objects.annotate(stock_count=Count("stock"))
        .filter(stock_count__lt=threshold)
        .order_by("name")
    )

    if not industries.exists():
        print(f"No industries found with fewer than {threshold} stocks.")
        return None

    industry_ids = [industry.id for industry in industries]
    stocks = (
        Stock.objects.filter(industry_id__in=industry_ids)
        .select_related("industry", "exchange")
        .order_by("industry__name", "company_name")
    )

    rows = []
    stock_counts = {industry.id: industry.stock_count for industry in industries}
    industries_with_members = set()

    for stock in stocks:
        industries_with_members.add(stock.industry_id)
        rows.append(
            {
                "industry": stock.industry.name if stock.industry else None,
                "industry_stock_count": stock_counts.get(stock.industry_id, 0),
                "company_name": stock.company_name,
                "ticker": stock.ticker,
                "exchange_code": stock.exchange.code if stock.exchange else None,
                "exchange_name": stock.exchange.name if stock.exchange else None,
                "country": stock.country,
            }
        )

    # Include placeholder rows for industries without any stocks.
    for industry in industries:
        if industry.id in industries_with_members:
            continue
        rows.append(
            {
                "industry": industry.name,
                "industry_stock_count": industry.stock_count,
                "company_name": None,
                "ticker": None,
                "exchange_code": None,
                "exchange_name": None,
                "country": None,
            }
        )

    reports_dir = Path(__file__).resolve().parents[1] / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    out_path = Path(output_path) if output_path else reports_dir / f"industries_under_{threshold}.xlsx"

    df = pd.DataFrame(rows)
    df.to_excel(out_path, index=False)
    print(f"Wrote {len(df)} rows covering {len(stock_counts)} industries to {out_path}")
    return str(out_path)


if __name__ == "__main__":
    generate()
