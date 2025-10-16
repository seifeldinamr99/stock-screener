import os
import sys
from pathlib import Path

project_root = Path(__file__).resolve().parents[1]
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "stock_screener.settings")

import django  # noqa: E402

django.setup()

from django.db.models import Count  # noqa: E402
from screener.models import Industry, Stock  # noqa: E402

try:
    import pandas as pd  # noqa: E402
except ImportError as exc:
    raise SystemExit(
        "pandas is required to run this script. Install it in the backend virtualenv."
    ) from exc


def main() -> None:
    industries = (
        Industry.objects.annotate(
            industry_stock_count=Count("stock", distinct=True)
        )
        .filter(industry_stock_count__lt=20, industry_stock_count__gt=0)
        .order_by("name")
    )

    rows: list[dict[str, str | int]] = []

    for industry in industries:
        stocks = (
            Stock.objects.filter(industry=industry)
            .select_related("exchange", "sector", "industry__sector")
            .order_by("company_name")
        )

        for stock in stocks:
            rows.append(
                {
                    "Industry": industry.name,
                    "Sector": industry.sector.name if industry.sector_id else "",
                    "company_name": stock.company_name,
                    "ticker": stock.ticker,
                    "exchange_code": stock.exchange.code if stock.exchange_id else "",
                    "exchange_name": stock.exchange.name if stock.exchange_id else "",
                    "country": stock.country,
                    "industry_stock_count": industry.industry_stock_count,
                    "Original_Industry": industry.name,
                }
            )

    if not rows:
        print("No industries found with less than 20 companies.")
        return

    columns = [
        "Industry",
        "Sector",
        "company_name",
        "ticker",
        "exchange_code",
        "exchange_name",
        "country",
        "industry_stock_count",
        "Original_Industry",
    ]
    df = pd.DataFrame(rows, columns=columns)
    output_dir = project_root.parent / "reports"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "industries_with_less_than_20_companies.xlsx"

    df.to_excel(output_path, index=False)

    print(f"Wrote {len(df)} rows to {output_path}")


if __name__ == "__main__":
    main()
