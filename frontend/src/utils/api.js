import { API_BASE_URL } from './constants';

export const fetchFilterOptions = async () => {
  const response = await fetch(`${API_BASE_URL}/stocks/filter_options/`);
  if (!response.ok) throw new Error('Failed to fetch filter options');
  return response.json();
};

export const fetchStocks = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/stocks/?${queryString}`);
  if (!response.ok) throw new Error('Failed to fetch stocks');
  return response.json();
};

export const fetchChartData = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/filtered-stats/?${queryString}`);
  if (!response.ok) throw new Error('Failed to fetch chart data');
  return response.json();
};

export const fetchSectorIndustryCounts = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/stocks/sector-industry-counts/?${queryString}`);
  if (!response.ok) throw new Error('Failed to fetch sector data');
  return response.json();
};