const DEFAULT_API_BASE_URL = 'http://localhost:8000/api';

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

export const PRICE_FILTER_OPTIONS = [
  'Any', 'Under $1', 'Under $2', 'Under $3', 'Under $4', 'Under $5',
  'Under $7', 'Under $10', 'Under $15', 'Under $20', 'Under $30',
  'Under $40', 'Under $50', 'Under $100', 'Under $200', 'Under $400',
  'Over $1', 'Over $2', 'Over $3', 'Over $5', 'Over $10', 'Over $20',
  'Over $50', 'Over $100', 'Over $200', 'Over $400'
];

export const ORDERING_OPTIONS = [
  { value: 'ticker', label: 'Ticker (A-Z)' },
  { value: '-ticker', label: 'Ticker (Z-A)' },
  { value: 'company_name', label: 'Company (A-Z)' },
  { value: '-company_name', label: 'Company (Z-A)' },
  { value: 'price', label: 'Price (Low-High)' },
  { value: '-price', label: 'Price (High-Low)' },
  { value: 'market_cap', label: 'Market Cap (Low-High)' },
  { value: '-market_cap', label: 'Market Cap (High-Low)' }
];

export const VIEW_TYPES = {
  SECTORS: 'sectors',
  SECTOR_DETAIL: 'sector-detail',
  INDUSTRY_DETAIL: 'industry-detail'
};

export const SORT_OPTIONS = {
  INDUSTRIES: [
    { value: 'count-desc', label: 'Most Companies' },
    { value: 'count-asc', label: 'Least Companies' },
    { value: 'total_market_cap-desc', label: 'Highest Market Cap' },
    { value: 'total_market_cap-asc', label: 'Lowest Market Cap' },
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' }
  ]
};

export const MARKET_CAP_UNITS = [
  { value: 'M', label: 'M' },
  { value: 'B', label: 'B' }
];
