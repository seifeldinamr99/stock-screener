// src/components/Screener/ScreenerPage.js
import React, { useState, useEffect } from 'react';
import FiltersSection from './FiltersSection';
import ChartsSection from './ChartsSection';
import StockTable from './StockTable';
import Pagination from './Pagination';
import { useFilters } from '../../hooks/useFilters';
import { usePagination } from '../../hooks/usePagination';
import { fetchFilterOptions, fetchStocks, fetchChartData } from '../../utils/api';
import { parsePriceFilter, parseMarketCapFilter } from '../../utils/formatters';

const ScreenerPage = ({ showAlert }) => {
  const [selectedStocks, setSelectedStocks] = useState(new Set());
  const [stocks, setStocks] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    exchanges: [],
    sectors: [],
    industries: [],
    countries: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [showCharts, setShowCharts] = useState(true);

  const { filters, handleFilterChange, resetFilters } = useFilters();
  const { pagination, setPagination, totalPages } = usePagination();

  // Fetch filter options on component mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Fetch stocks when filters change
  useEffect(() => {
    loadStocks();
    loadChartData();
  }, [filters, pagination.page, pagination.pageSize]);

  const loadFilterOptions = async () => {
    try {
      const data = await fetchFilterOptions();
      setFilterOptions(data);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  const loadChartData = async () => {
    setChartLoading(true);
    try {
      const params = buildApiParams();
      const data = await fetchChartData(params);
      setChartData(data);
    } catch (err) {
      console.error('Error fetching chart data:', err);
    } finally {
      setChartLoading(false);
    }
  };

  const buildApiParams = () => {
    const params = {};

    // Add filters
    if (filters.search) params.search = filters.search;
    if (filters.exchange) params.exchange = filters.exchange;
    if (filters.sector) params.sector = filters.sector;
    if (filters.industry) params.industry = filters.industry;
    if (filters.country) params.country = filters.country;

    // Add price filtering
    if (filters.priceFilter !== 'Any') {
      const { min, max } = parsePriceFilter(filters.priceFilter);
      if (min !== null) params.price_min = min.toString();
      if (max !== null) params.price_max = max.toString();
    }

    // Add market cap filtering
    const marketCapParams = parseMarketCapFilter(
      filters.marketCapMin, 
      filters.marketCapMax, 
      filters.marketCapMinUnit, 
      filters.marketCapMaxUnit
    );
    if (marketCapParams.market_cap_min) params.market_cap_min = marketCapParams.market_cap_min.toString();
    if (marketCapParams.market_cap_max) params.market_cap_max = marketCapParams.market_cap_max.toString();

    return params;
  };

  const loadStocks = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        ...buildApiParams(),
        page: pagination.page.toString(),
        page_size: pagination.pageSize.toString(),
        ordering: filters.ordering
      };

      const data = await fetchStocks(params);
      setStocks(data.results || []);
      setPagination(prev => ({ ...prev, count: data.count || 0 }));
    } catch (err) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError('Cannot connect to server. Please ensure Django server is running on port 8000 and CORS is configured.');
      } else {
        setError('Network error while fetching stocks');
      }
      console.error('Error fetching stocks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const orderingValue = direction === 'desc' ? `-${key}` : key;
    handleFilterChange('ordering', orderingValue);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const toggleSelectStock = (stockId) => {
    const newSelected = new Set(selectedStocks);
    if (newSelected.has(stockId)) {
      newSelected.delete(stockId);
    } else {
      newSelected.add(stockId);
    }
    setSelectedStocks(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStocks.size === stocks.length) {
      setSelectedStocks(new Set());
    } else {
      setSelectedStocks(new Set(stocks.map(stock => stock.id)));
    }
  };

  const savePortfolioAsExcel = async () => {
    if (selectedStocks.size === 0) {
      showAlert('Please select at least one stock to save to portfolio', 'warning');
      return;
    }

    try {
      const selectedStockData = stocks.filter(stock => selectedStocks.has(stock.id));

      const headers = [
        'Ticker', 'Company Name', 'Market Cap', 'Price', 'P/E Ratio', 'PEG Ratio',
        'Country', 'Exchange', 'Sector', 'Industry', 'Fair Value', 'Fair Value Label',
        'Fair Value Upside', 'Analyst Target', 'Analyst Upside', 'Health Label',
        'Price Change Percent', 'Dividend Yield'
      ];

      const csvContent = [
        headers.join(','),
        ...selectedStockData.map(stock => [
          stock.ticker,
          `"${stock.company_name}"`,
          stock.market_cap || 'N/A',
          stock.price || 'N/A',
          stock.pe_ratio || 'N/A',
          stock.peg_ratio || 'N/A',
          stock.country || 'N/A',
          stock.exchange_name || 'N/A',
          stock.sector_name || 'N/A',
          stock.industry_name || 'N/A',
          stock.fair_value || 'N/A',
          stock.fair_value_label || 'N/A',
          stock.fair_value_upside || 'N/A',
          stock.analyst_target || 'N/A',
          stock.analyst_upside || 'N/A',
          stock.health_label || 'N/A',
          stock.price_change_percent || 'N/A',
          stock.dividend_yield || 'N/A'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `portfolio_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showAlert(`Portfolio saved! ${selectedStocks.size} stocks exported to CSV`, 'success');
    } catch (error) {
      showAlert('Error saving portfolio: ' + error.message, 'error');
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    handleFilterChange('search', value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChangeWithReset = (filterName, value) => {
    handleFilterChange(filterName, value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    resetFilters();
    setSortConfig({ key: null, direction: 'asc' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div style={{ width: '100%' }}>
      <FiltersSection
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={handleFilterChangeWithReset}
        onSearchChange={handleSearchChange}
        onResetFilters={handleResetFilters}
      />

      <ChartsSection
        showCharts={showCharts}
        setShowCharts={setShowCharts}
        chartData={chartData}
        chartLoading={chartLoading}
      />

      {error && (
        <div style={{ backgroundColor: '#dc2626', color: 'white', padding: '12px 24px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <StockTable
        stocks={stocks}
        loading={loading}
        selectedStocks={selectedStocks}
        sortConfig={sortConfig}
        pagination={pagination}
        filters={filters}
        onSort={handleSort}
        onToggleSelect={toggleSelectStock}
        onSelectAll={handleSelectAll}
        onSavePortfolio={savePortfolioAsExcel}
        onPageSizeChange={(pageSize) => setPagination(prev => ({ ...prev, pageSize: parseInt(pageSize), page: 1 }))}
      />

      <Pagination
        pagination={pagination}
        totalPages={totalPages}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
      />
    </div>
  );
};

export default ScreenerPage;