import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const stockApi = {
  getStocks: (params = {}) => {
    return apiClient.get('/stocks/', { params });
  },

  getFilterOptions: () => {
    return apiClient.get('/stocks/filter_options/');
  },

  getStockProfile: ({ ticker, exchange }) => {
    return apiClient.get('/stocks/profile/', {
      params: {
        ticker,
        exchange,
      },
    });
  },

  getStockHistory: ({ ticker, exchange, window = 'max', start, end, limit }) => {
    const params = { ticker, exchange };

    if (window) params.window = window;
    if (start) params.start = start;
    if (end) params.end = end;
    if (limit) params.limit = limit;

    return apiClient.get('/stocks/history/', { params });
  },
};

export default apiClient;
