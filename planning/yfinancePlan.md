# yfinance Integration Plan

## Context Recap
- **Initial gap**: Database only stored static fundamentals (`backend/screener/models.py`) with no structure for daily OHLCV history.
- **Goal**: Power screener and industry detail popups with per-company time series (for fund construction per `simulationJourney.md` and `page4.md`), sourced from Yahoo Finance via `yfinance`.

## Completed Foundation
1. **Schema changes**
   - Added `prices_last_synced_at` tracker to `Stock` and enforced `unique_together (ticker, exchange)` for clean FK usage.
   - Introduced normalized `HistoricalPrice` model with daily OHLCV fields, `unique_together (stock, date)`, and indexes on `(stock, date)` + `date`.
   - Migrations: `0005_alter_stock_ticker_alter_stock_unique_together_and_more.py`, `0006_stock_prices_last_synced_at.py`.
2. **Ingestion tooling**
   - New management command `historical_prices` pulls batches of stocks from `yfinance`, normalizes data, upserts via `bulk_create(update_conflicts=True)`, logs per ticker, and updates `prices_last_synced_at`.
   - Supports partial runs (`--tickers`, `--max-stocks`), incremental syncs (`--force`, `--start`, `--end`), batching, and `--dry-run`.

## Remaining Work
1. **Ingestion rollout**
   - Install dependencies (`yfinance`, `pandas`), apply migrations, run initial backfill (5-year window) in controlled batches.
   - Schedule recurring job (e.g., nightly `historical_prices --force --start <yesterday>`), with monitoring + retry playbook.
2. **API extensions**
   - Update serializers/viewsets to supply:  
     - Company fundamentals + latest price snapshot.  
     - Historical series endpoints (configurable window/pagination) for UI charts and fund simulation.
   - Ensure consistent schema for screener modal and industry detail popup.
3. **Frontend integration**
   - Screener: on company click, fetch detail + history, render modal/chart.  
   - IndustryDetailView: reuse the modal/popup and cache series where possible.  
   - Prepare data pathways for fund construction steps described in `simulationJourney.md` & `page4.md`.
4. **Quality & ops**
   - Tests: model constraints, ingestion command (mocked `yfinance`), API contract + pagination.  
   - Documentation/runbook: deployment steps, sync/rollback instructions, handling data gaps or API failures.

## Next Steps
1. `python pythonScripts/manage.py migrate screener`
2. `pip install yfinance pandas` (backend env)
3. Seed data: `python pythonScripts/manage.py historical_prices --max-stocks 500`
4. Design API payloads for company detail & history; update frontend consumers.
5. Automate recurring sync + monitoring.
