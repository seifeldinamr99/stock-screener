"""Generate a report of recent database changes."""

from __future__ import annotations

from datetime import timedelta
from pathlib import Path
from typing import Iterable

import pandas as pd
from django.db.models import Q
from django.utils import timezone

from screener.models import Stock


def _serialize_stocks(stocks: Iterable[Stock], cutoff):
    rows = []
    tz = timezone.get_current_timezone()
    for stock in stocks:
        created_at = stock.created_at.astimezone(tz)
        updated_at = stock.updated_at.astimezone(tz)
        is_created = created_at >= cutoff.astimezone(tz) and abs((updated_at - created_at).total_seconds()) < 1
        change_type = "Created" if is_created else "Updated"
        rows.append(
            {
                "id": stock.id,
                "ticker": stock.ticker,
                "company_name": stock.company_name,
                "exchange_code": stock.exchange.code if stock.exchange else None,
                "exchange_name": stock.exchange.name if stock.exchange else None,
                "country": stock.country,
                "created_at": created_at.isoformat(),
                "updated_at": updated_at.isoformat(),
                "change_type": change_type,
            }
        )
    return rows


def generate(hours: int = 5, output_path: str | None = None) -> str | None:
    """Export recent Stock changes to an Excel file and return the output path."""
    cutoff = timezone.now() - timedelta(hours=hours)
    qs = (
        Stock.objects.filter(Q(created_at__gte=cutoff) | Q(updated_at__gte=cutoff))
        .select_related("exchange")
        .order_by("updated_at")
    )
    rows = _serialize_stocks(qs, cutoff)

    if not rows:
        print(f"No stock changes detected in the last {hours} hours.")
        return None

    if output_path is None:
        reports_dir = Path(__file__).resolve().parents[1] / "reports"
        reports_dir.mkdir(parents=True, exist_ok=True)
        output_path = reports_dir / f"db_changes_last{hours}h.xlsx"
    else:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

    df = pd.DataFrame(rows)
    df.to_excel(output_path, index=False)
    print(f"Wrote {len(df)} rows to {output_path}")
    return str(output_path)


if __name__ == "__main__":
    generate()
