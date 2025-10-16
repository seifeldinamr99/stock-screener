"""Export duplicate stocks grouped by company name."""

from __future__ import annotations

from pathlib import Path

import pandas as pd
from django.db.models import Count
from django.db.models.functions import Lower

from screener.models import Stock


def generate(output_path: str | None = None) -> str | None:
    """Build an Excel report for stocks sharing the same company name (case-insensitive)."""
    duplicates = (
        Stock.objects.exclude(company_name__isnull=True)
        .annotate(name_lower=Lower("company_name"))
        .values("name_lower")
        .annotate(total=Count("id"))
        .filter(total__gt=1)
    )

    if not duplicates:
        print("No duplicate company names found.")
        return None

    duplicate_names = {item["name_lower"] for item in duplicates}
    stocks = (
        Stock.objects.filter(company_name__isnull=False)
        .annotate(name_lower=Lower("company_name"))
        .filter(name_lower__in=duplicate_names)
        .select_related("exchange")
        .order_by("name_lower", "ticker")
    )

    rows = []
    for stock in stocks:
        rows.append(
            {
                "name_lower": stock.company_name.lower(),
                "company_name": stock.company_name,
                "ticker": stock.ticker,
                "exchange_code": stock.exchange.code if stock.exchange else None,
                "exchange_name": stock.exchange.name if stock.exchange else None,
                "country": stock.country,
                "created_at": stock.created_at.isoformat(),
                "updated_at": stock.updated_at.isoformat(),
                "stock_id": stock.id,
            }
        )

    reports_dir = Path(__file__).resolve().parents[1] / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    out_path = Path(output_path) if output_path else reports_dir / "duplicate_stocks_by_name.xlsx"
    pd.DataFrame(rows).to_excel(out_path, index=False)
    print(f"Wrote {len(rows)} rows covering {len(duplicate_names)} duplicate company names to {out_path}")
    return str(out_path)


if __name__ == "__main__":
    generate()
