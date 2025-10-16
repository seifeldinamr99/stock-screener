# Accessible Stocks Feature Overview

## Intent
Provide a duplicate experience of the existing **Classifiers** page under the new title **Accessible Stocks**, while keeping its data isolated. The page should render the same UI but pull from an empty dataset so that future accessible‑specific information can be populated independently of the main classifier universe.

---

## Backend Updates

- Added a parallel set of models (`AccessibleExchange`, `AccessibleSector`, `AccessibleIndustry`, `AccessibleStock`, `AccessibleHistoricalPrice`) with migrations so Accessible data is stored separately from the primary classifiers tables.
- Introduced dataset routing helpers inside `backend/screener/views.py`. Endpoints now inspect a `dataset` query parameter (`classifier` by default, `accessible` to switch) and dynamically bind to the correct models, serializers, filter sets, and querysets.
- Updated supporting endpoints (`stocks/filter_options`, `stocks/sector-industry-counts`, `filtered-stats`, `database_stats`, `sectors/<sector>/industries/`) to honor the dataset selection.
- Serializer layer mirrors the additional models (`Accessible*Serializer` classes) so response payloads stay consistent across datasets.

**Migration:** `backend/screener/migrations/0007_accessibleexchange_accessiblesector_and_more.py`

---

## Frontend Updates

- `useClassifierData` hook now accepts a `datasetKey` argument (defaults to `classifier`) and forwards it through every API request.
- `ClassifiersPage` component takes `datasetKey`, `sectorsTitle`, and `sectorsEmptyMessage` props so downstream pages can reuse the layout with custom copy.
- `SectorsView` supports configurable title and empty state message strings.
- New page component `AccessibleStocksPage` wraps `ClassifiersPage` with `datasetKey="accessible"` and tailored copy.
- Navigation (`App.js`) adds an **Accessible Stocks** button and renders the new page when selected.

### How It Was Made

- The backend now has a parallel model hierarchy (`AccessibleExchange`, `AccessibleSector`, `AccessibleIndustry`, `AccessibleStock`, `AccessibleHistoricalPrice`) with serializers and a migration, ensuring accessible data lives in its own tables.
- View logic resolves a `dataset` query parameter so every affected endpoint (filter options, sector/industry counts, filtered stats, database stats, sector industries, and stock profiles/history) dynamically targets either the classifier or accessible tables.
- On the frontend, `useClassifierData` forwards a `datasetKey` to every fetch, and `ClassifiersPage`/`SectorsView` accept customizable props. A new `AccessibleStocksPage` component wires those pieces together and is surfaced via an additional navigation tab in `App.js`.

---

## How to Use

### Backend
- Migrations already generated and applied. Run `python pythonScripts/manage.py migrate` if needed in another environment.
- Supply `dataset=accessible` in query strings to interact with the accessible dataset; omit the param (or set `classifier`) for the original data.

### Frontend
- Navigate via the header button to load the Accessible Stocks UI.
- All filters and interactions behave identically to Classifiers but will show empty results until the new tables are populated.

---

## Testing Notes

- Existing backend test suite (`pythonScripts/manage.py test screener`) currently fails because the historical prices tests patch `screener.management.commands.historical_prices`, yet the module lookup fails during mocking. The failure predates these changes; follow-up required to adjust test imports or module resolutions.

---

## Next Steps

1. Populate the `Accessible*` tables with the appropriate dataset when ready.
2. Address the historical prices test patching issue to restore a clean test run.
3. Consider surfacing a more descriptive empty-state experience once data requirements are finalized.
