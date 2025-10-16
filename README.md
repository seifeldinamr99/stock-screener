# Stock Screener

Full-stack project combining a Django REST backend and React frontend for stock screening and accessible-stock analysis.

## Structure

- ackend/ – Django project (stock_screener) with REST API in the screener app
- rontend/ – React single-page application
- Tickers/ – data imports (ignored by git by default)
- ackend/pythonScripts/ – helper scripts (imports, fixes, etc.)

## Getting Started

### Backend

`ash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # fill in env vars
python pythonScripts/manage.py migrate
python pythonScripts/manage.py runserver
`

### Frontend

`ash
cd frontend
npm install
cp .env.example .env  # set REACT_APP_API_BASE_URL
npm start
`

## Deployment
- Backend: deploy to Railway (see docs/AccessibleStocks.md and notes)
- Frontend: deploy via Railway Static or Netlify/Vercel

## Scripts
- pythonScripts/import_accessible_stocks.py
- pythonScripts/update_accessible_market_cap.py
- pythonScripts/update_accessible_specifics.py
- pythonScripts/fix_accessible_unknowns.py

## Environment Variables
Document all required vars in .env.example (backend/frontend).


