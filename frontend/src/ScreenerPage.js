import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Filter, ChevronUp, AlertCircle, BarChart3 } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import CompanyDetailModal from './components/common/CompanyDetailModal';
import { API_BASE_URL } from './utils/constants';
const TEXT_COLORS = {
  primary: '#FFFFFF',
  secondary: '#FFCE7B',
  accent: '#00FFDA',
  teal: '#00917C',
  highlight: '#055A57',
  dark: '#141414'
};

const ScreenerPage = () => {
  const [selectedStocks, setSelectedStocks] = useState(new Set());
  const [stocks, setStocks] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    exchanges: [],
    sectors: [],
    industries: [],
    countries: []
  });
  const [filters, setFilters] = useState({
    search: '',
    exchange: '',
    sector: '',
    industry: '',
    country: '',
    ordering: 'ticker',
    priceFilter: 'Any',
    marketCapMin: '',
    marketCapMax: '',
    marketCapMinUnit: 'M',
    marketCapMaxUnit: 'M'
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    count: 0,
    page: 1,
    pageSize: 30
  });
  const [error, setError] = useState('');
  const [alert, setAlert] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [showCharts, setShowCharts] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [industryDetails, setIndustryDetails] = useState([]);
  const [industrySummary, setIndustrySummary] = useState({
    totalCompanies: 0,
    industriesListed: 0,
    sectorsListed: 0,
  });
  const [companyModal, setCompanyModal] = useState({
    open: false,
    ticker: null,
    exchange: null,
    name: '',
  });

  // Helper function to convert price filter to API parameters
  const parsePriceFilter = (priceFilter) => {
    if (priceFilter === 'Any') return { min: null, max: null };

    if (priceFilter.startsWith('Under $')) {
      return { min: null, max: parseFloat(priceFilter.replace('Under $', '')) };
    } else if (priceFilter.startsWith('Over $')) {
      return { min: parseFloat(priceFilter.replace('Over $', '')), max: null };
    }

    return { min: null, max: null };
  };

  // Helper function to convert market cap range filter to API parameters
  const parseMarketCapFilter = (minValue, maxValue, minUnit, maxUnit) => {
    const params = {};

    if (minValue && minValue !== '') {
      const numMin = parseFloat(minValue);
      if (!isNaN(numMin)) {
        const minMultiplier = minUnit === 'B' ? 1000000000 : 1000000;
        params.market_cap_min = numMin * minMultiplier;
      }
    }

    if (maxValue && maxValue !== '') {
      const numMax = parseFloat(maxValue);
      if (!isNaN(numMax)) {
        const maxMultiplier = maxUnit === 'B' ? 1000000000 : 1000000;
        params.market_cap_max = numMax * maxMultiplier;
      }
    }

    return params;
  };

  const handleCompanyModalOpen = (stock) => {
    if (!stock) return;
    setCompanyModal({
      open: true,
      ticker: (stock.ticker || '').toUpperCase(),
      exchange: stock.exchange_code || stock.exchange_name || stock.exchange || null,
      name: stock.company_name || stock.ticker,
    });
  };

  const handleCompanyModalClose = () => {
    setCompanyModal((prev) => ({
      ...prev,
      open: false,
    }));
  };

  // Fetch filter options on component mount
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Fetch stocks when filters change
  useEffect(() => {
    fetchStocks();
    fetchChartData();
  }, [filters, pagination.page, pagination.pageSize]);

  const fetchFilterOptions = async () => {
    try {
      // Always fetch all industries, not filtered by sector
      const response = await fetch(`${API_BASE_URL}/stocks/filter_options/`);
      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data);
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  const fetchChartData = async () => {
    setChartLoading(true);
    try {
      const params = new URLSearchParams();

      // Add the same filters as fetchStocks
      if (filters.search) params.append('search', filters.search);
      if (filters.exchange) params.append('exchange', filters.exchange);
      if (filters.sector) params.append('sector', filters.sector);
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.country) params.append('country', filters.country);

      // Add price filtering
      if (filters.priceFilter !== 'Any') {
        const { min, max } = parsePriceFilter(filters.priceFilter);
        if (min !== null) params.append('price_min', min.toString());
        if (max !== null) params.append('price_max', max.toString());
      }

      // Add market cap filtering
      const marketCapParams = parseMarketCapFilter(filters.marketCapMin, filters.marketCapMax, filters.marketCapMinUnit, filters.marketCapMaxUnit);
      if (marketCapParams.market_cap_min) params.append('market_cap_min', marketCapParams.market_cap_min.toString());
      if (marketCapParams.market_cap_max) params.append('market_cap_max', marketCapParams.market_cap_max.toString());

      const response = await fetch(`${API_BASE_URL}/filtered-stats/?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setChartData(data);
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
    } finally {
      setChartLoading(false);
    }
  };

  const fetchStocks = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();

      // Add pagination
      params.append('page', pagination.page.toString());
      params.append('page_size', pagination.pageSize.toString());

      // Add filters
      if (filters.search) params.append('search', filters.search);
      if (filters.exchange) params.append('exchange', filters.exchange);
      if (filters.sector) params.append('sector', filters.sector);
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.country) params.append('country', filters.country);
      if (filters.ordering) params.append('ordering', filters.ordering);

      // Add price filtering to API parameters
      if (filters.priceFilter !== 'Any') {
        const { min, max } = parsePriceFilter(filters.priceFilter);
        if (min !== null) params.append('price_min', min.toString());
        if (max !== null) params.append('price_max', max.toString());
      }

      // Add market cap filtering to API parameters
      const marketCapParams = parseMarketCapFilter(filters.marketCapMin, filters.marketCapMax, filters.marketCapMinUnit, filters.marketCapMaxUnit);
      if (marketCapParams.market_cap_min) params.append('market_cap_min', marketCapParams.market_cap_min.toString());
      if (marketCapParams.market_cap_max) params.append('market_cap_max', marketCapParams.market_cap_max.toString());

      const response = await fetch(`${API_BASE_URL}/stocks/?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();

        // No more client-side filtering needed!
        setStocks(data.results || []);
        setPagination(prev => ({
          ...prev,
          count: data.count || 0
        }));
      } else {
        setError('Failed to fetch stocks');
      }
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

  const handleIndustryCardClick = () => {
    if (!chartData || !chartData.industry_breakdown) return;

    const findSectorForIndustry = (industryName) => {
      if (!industryName) return chartData?.applied_filters?.sector || 'N/A';
      const match = filterOptions.industries.find(
        item => item.name && item.name.toLowerCase() === industryName.toLowerCase()
      );
      if (match) {
        return match.sector__name || match.sector || chartData?.applied_filters?.sector || 'N/A';
      }
      return chartData?.applied_filters?.sector || 'N/A';
    };

    const breakdown = [...chartData.industry_breakdown]
      .map(item => {
        const rawMarketCap = item.total_market_cap;
        const hasMarketCap = rawMarketCap !== null && rawMarketCap !== undefined;
        const name = item.industry__name || item.industry_name || item.name || 'N/A';
        return {
          name,
          sector: item.sector__name || item.sector_name || findSectorForIndustry(name),
          count: item.count || 0,
          marketCap: hasMarketCap ? Number(rawMarketCap) : null,
        };
      })
      .sort((a, b) => b.count - a.count);

    setIndustryDetails(breakdown);

    const industriesListed = breakdown.length;
    const sectorsListed = new Set(breakdown.map(item => item.sector || 'N/A')).size;
    const totalCompanies = chartData.total_companies || 0;
    setIndustrySummary({
      totalCompanies,
      industriesListed,
      sectorsListed,
    });

    setShowIndustryModal(true);
  };

  const closeIndustryModal = () => {
    setShowIndustryModal(false);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFilters(prev => ({
      ...prev,
      search: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));

    // Show industry suggestions if typing
    if (value.trim() === '') {
      setShowSuggestions(false);
      setSuggestions([]);
      return;
    }

    // Filter industries based on search term
    const matchingIndustries = filterOptions.industries
      .filter(industry => industry.name.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 8); // Limit to 8 suggestions

    setSuggestions(matchingIndustries);
    setShowSuggestions(matchingIndustries.length > 0);
  };

  const selectIndustrySuggestion = (industryName) => {
    setFilters(prev => ({
      ...prev,
      industry: industryName,
      search: '' // Clear search when selecting
    }));
    setShowSuggestions(false);
    setSuggestions([]);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      exchange: '',
      sector: '',
      industry: '',
      country: '',
      ordering: 'ticker',
      priceFilter: 'Any',
      marketCapMin: '',
      marketCapMax: '',
      marketCapMinUnit: 'M',
      marketCapMaxUnit: 'M'
    });
    setShowSuggestions(false);
    setSuggestions([]);
    setSortConfig({ key: null, direction: 'asc' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    // Update the ordering filter to send to backend
    const orderingValue = direction === 'desc' ? `-${key}` : key;
    setFilters(prev => ({
      ...prev,
      ordering: orderingValue
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when sorting
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronUp style={{ width: '16px', height: '16px', color: '#6b7280', opacity: 0.3 }} />;
    }
    return sortConfig.direction === 'asc' ?
      <ChevronUp style={{ width: '16px', height: '16px', color: '#2dd4bf' }} /> :
      <ChevronDown style={{ width: '16px', height: '16px', color: '#2dd4bf' }} />;
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

  const showAlert = (message, type = 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const savePortfolioAsExcel = async () => {
    if (selectedStocks.size === 0) {
      showAlert('Please select at least one stock to save to portfolio', 'warning');
      return;
    }

    try {
      const selectedStockData = stocks.filter(stock => selectedStocks.has(stock.id));

      // Create CSV content with all data
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

      // Create and download file
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

  const formatPercentageValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return formatMarketCap(value);
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const formatMarketCap = (num) => {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1000000000000) return `$${(num / 1000000000000).toFixed(2)}T`;
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const totalPages = Math.ceil(pagination.count / pagination.pageSize);

  return (
    <div style={{ width: '100%' }}>
      {/* Alert */}
      {alert && (
        <div style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 50,
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: alert.type === 'error' ? '#dc2626' :
                          alert.type === 'warning' ? '#d97706' :
                          alert.type === 'success' ? '#059669' : '#0ea5e9',
          color: 'white'
        }}>
          <AlertCircle style={{ width: '20px', height: '20px' }} />
          <span>{alert.message}</span>
          <button
            onClick={() => setAlert(null)}
            style={{ marginLeft: '8px', fontSize: '18px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #475569', padding: '12px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <h2 style={{ fontSize: '18px', color: '#d1d5db', margin: 0, fontWeight: '600' }}>Stock Screener</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', width: '16px', height: '16px' }} />
              <input
                type="text"
                placeholder="Search ticker, company, sector, industry..."
                value={filters.search}
                onChange={handleSearchChange}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Delay hiding suggestions to allow clicking on them
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                style={{ paddingLeft: '40px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', backgroundColor: '#334155', border: '1px solid #475569', color: 'white', borderRadius: '4px', width: '360px' }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#334155',
                  border: '1px solid #475569',
                  borderTop: 'none',
                  borderRadius: '0 0 4px 4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000
                }}>
                  <div style={{
                    padding: '8px 12px',
                    fontSize: '11px',
                    color: '#9ca3af',
                    backgroundColor: '#1e293b',
                    borderBottom: '1px solid #475569'
                  }}>
                    Industry suggestions:
                  </div>
                  {suggestions.map((industry, index) => (
                    <div
                      key={industry.id}
                      onClick={() => selectIndustrySuggestion(industry.name)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#d1d5db',
                        backgroundColor: 'transparent',
                        borderBottom: index < suggestions.length - 1 ? '1px solid #475569' : 'none'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#475569'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      {industry.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: showFilters ? '#dc2626' : '#0d9488',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <Filter style={{ width: '16px', height: '16px' }} />
              <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
              {showFilters ? <ChevronUp style={{ width: '16px', height: '16px' }} /> : <ChevronDown style={{ width: '16px', height: '16px' }} />}
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
      <div style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #475569', padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#d1d5db', margin: 0 }}>Filters</h3>
          <button
            onClick={resetFilters}
            style={{ fontSize: '12px', color: '#2dd4bf', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Reset All
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={{ color: '#d1d5db', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Order by</label>
            <select
              value={filters.ordering}
              onChange={(e) => handleFilterChange('ordering', e.target.value)}
              style={{ width: '100%', backgroundColor: '#334155', border: '1px solid #475569', color: 'white', padding: '8px 12px', fontSize: '14px', borderRadius: '4px' }}
            >
              <option value="ticker">Ticker (A-Z)</option>
              <option value="-ticker">Ticker (Z-A)</option>
              <option value="company_name">Company (A-Z)</option>
              <option value="-company_name">Company (Z-A)</option>
              <option value="price">Price (Low-High)</option>
              <option value="-price">Price (High-Low)</option>
              <option value="market_cap">Market Cap (Low-High)</option>
              <option value="-market_cap">Market Cap (High-Low)</option>
            </select>
          </div>

          <div>
            <label style={{ color: '#d1d5db', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Price</label>
            <select
              value={filters.priceFilter}
              onChange={(e) => handleFilterChange('priceFilter', e.target.value)}
              style={{ width: '100%', backgroundColor: '#334155', border: '1px solid #475569', color: 'white', padding: '8px 12px', fontSize: '14px', borderRadius: '4px' }}
            >
              <option value="Any">Any</option>
              <option value="Under $1">Under $1</option>
              <option value="Under $2">Under $2</option>
              <option value="Under $3">Under $3</option>
              <option value="Under $4">Under $4</option>
              <option value="Under $5">Under $5</option>
              <option value="Under $7">Under $7</option>
              <option value="Under $10">Under $10</option>
              <option value="Under $15">Under $15</option>
              <option value="Under $20">Under $20</option>
              <option value="Under $30">Under $30</option>
              <option value="Under $40">Under $40</option>
              <option value="Under $50">Under $50</option>
              <option value="Under $100">Under $100</option>
              <option value="Under $200">Under $200</option>
              <option value="Under $400">Under $400</option>
              <option value="Over $1">Over $1</option>
              <option value="Over $2">Over $2</option>
              <option value="Over $3">Over $3</option>
              <option value="Over $5">Over $5</option>
              <option value="Over $10">Over $10</option>
              <option value="Over $20">Over $20</option>
              <option value="Over $50">Over $50</option>
              <option value="Over $100">Over $100</option>
              <option value="Over $200">Over $200</option>
              <option value="Over $400">Over $400</option>
            </select>
          </div>

          <div>
            <label style={{ color: '#d1d5db', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Exchange</label>
            <select
              value={filters.exchange}
              onChange={(e) => handleFilterChange('exchange', e.target.value)}
              style={{ width: '100%', backgroundColor: '#334155', border: '1px solid #475569', color: 'white', padding: '8px 12px', fontSize: '14px', borderRadius: '4px' }}
            >
              <option value="">Any</option>
              {filterOptions.exchanges.map(exchange => (
                <option key={exchange.id} value={exchange.code}>
                  {exchange.name} ({exchange.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ color: '#d1d5db', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Sector</label>
            <select
              value={filters.sector}
              onChange={(e) => handleFilterChange('sector', e.target.value)}
              style={{ width: '100%', backgroundColor: '#334155', border: '1px solid #475569', color: 'white', padding: '8px 12px', fontSize: '14px', borderRadius: '4px' }}
            >
              <option value="">Any</option>
              {filterOptions.sectors.map(sector => (
                <option key={sector.id} value={sector.name}>{sector.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ color: '#d1d5db', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Industry</label>
            <select
              value={filters.industry}
              onChange={(e) => handleFilterChange('industry', e.target.value)}
              style={{ width: '100%', backgroundColor: '#334155', border: '1px solid #475569', color: 'white', padding: '8px 12px', fontSize: '14px', borderRadius: '4px' }}
            >
              <option value="">Any</option>
              {filterOptions.industries.map(industry => (
                <option key={industry.id} value={industry.name}>{industry.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ color: '#d1d5db', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Country</label>
            <select
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              style={{ width: '100%', backgroundColor: '#334155', border: '1px solid #475569', color: 'white', padding: '8px 12px', fontSize: '14px', borderRadius: '4px' }}
            >
              <option value="">Any</option>
              {filterOptions.countries
                .filter(country => country && country.trim() !== '' && country !== 'Unknown')
                .map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
            </select>
          </div>
        </div>

        {/* Market Cap Filter Row */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ color: '#d1d5db', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Market Cap</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="From"
                  value={filters.marketCapMin || ''}
                  onChange={(e) => handleFilterChange('marketCapMin', e.target.value)}
                  style={{ backgroundColor: '#334155', border: '1px solid #475569', color: 'white', padding: '8px 12px', fontSize: '14px', borderRadius: '4px', width: '100px' }}
                />
                <select
                  value={filters.marketCapMinUnit || 'M'}
                  onChange={(e) => handleFilterChange('marketCapMinUnit', e.target.value)}
                  style={{ backgroundColor: '#334155', border: '1px solid #475569', color: 'white', padding: '8px 12px', fontSize: '14px', borderRadius: '4px' }}
                >
                  <option value="M">Million</option>
                  <option value="B">Billion</option>
                </select>
                <span style={{ color: '#9ca3af', fontSize: '14px' }}>to</span>
                <input
                  type="number"
                  placeholder="To"
                  value={filters.marketCapMax || ''}
                  onChange={(e) => handleFilterChange('marketCapMax', e.target.value)}
                  style={{ backgroundColor: '#334155', border: '1px solid #475569', color: 'white', padding: '8px 12px', fontSize: '14px', borderRadius: '4px', width: '100px' }}
                />
                <select
                  value={filters.marketCapMaxUnit || 'M'}
                  onChange={(e) => handleFilterChange('marketCapMaxUnit', e.target.value)}
                  style={{ backgroundColor: '#334155', border: '1px solid #475569', color: 'white', padding: '8px 12px', fontSize: '14px', borderRadius: '4px' }}
                >
                  <option value="M">Million</option>
                  <option value="B">Billion</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Charts Section */}
      {showCharts && (
        <div style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #475569', padding: '16px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#d1d5db', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 style={{ width: '20px', height: '20px', color: '#2dd4bf' }} />
              Portfolio Analytics
            </h3>
            <button
              onClick={() => setShowCharts(!showCharts)}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #475569',
                color: '#d1d5db',
                padding: '4px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Hide Charts
            </button>
          </div>

          {chartLoading ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '48px' }}>
              <div style={{ fontSize: '14px' }}>Loading analytics...</div>
            </div>
          ) : chartData ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {/* Summary Stats Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #475569' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Total Companies</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2dd4bf' }}>
                        {chartData.total_companies.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #475569' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Total Market Cap</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2dd4bf' }}>
                        {chartData.total_market_cap ? formatMarketCap(chartData.total_market_cap) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '6px', border: '1px solid #475569', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2dd4bf' }}>{chartData.unique_sectors}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>Sectors</div>
                </div>
                <div
                  onClick={handleIndustryCardClick}
                  style={{
                    backgroundColor: '#1e293b',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #475569',
                    textAlign: 'center',
                    cursor: chartData?.industry_breakdown?.length ? 'pointer' : 'default',
                    transition: 'border-color 0.2s ease, transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (chartData?.industry_breakdown?.length) {
                      e.currentTarget.style.borderColor = '#2dd4bf';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#475569';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2dd4bf' }}>{chartData.unique_industries}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>Industries</div>
                  {chartData?.industry_breakdown?.length ? (
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '6px' }}>Tap to view industry details</div>
                  ) : null}
                </div>
              </div>
            </div>

              {/* Sector Breakdown Chart */}
              {chartData.sector_breakdown && chartData.sector_breakdown.length > 0 && (
                <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #475569' }}>
                  <h4 style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '16px', margin: 0 }}>Top Sectors</h4>
                  <div style={{ height: '200px' }}>
                    <Bar
                      data={{
                        labels: chartData.sector_breakdown.slice(0, 5).map(item =>
                          item.sector__name.length > 15
                            ? item.sector__name.substring(0, 15) + '...'
                            : item.sector__name
                        ),
                        datasets: [
                          {
                            label: 'Companies',
                            data: chartData.sector_breakdown.slice(0, 5).map(item => item.count),
                            backgroundColor: 'rgba(45, 212, 191, 0.8)',
                            borderColor: 'rgba(45, 212, 191, 1)',
                            borderWidth: 1
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: { color: '#9ca3af' },
                            grid: { color: '#475569' }
                          },
                          x: {
                            ticks: { color: '#9ca3af' },
                            grid: { color: '#475569' }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Exchange Distribution List */}
              {chartData.exchange_breakdown && chartData.exchange_breakdown.length > 1 && (
                <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #475569' }}>
                  <h4 style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '16px', margin: 0 }}>Exchange Distribution</h4>
                  <div style={{ height: '200px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {chartData.exchange_breakdown.map((item, index) => {
                        const total = chartData.exchange_breakdown.reduce((sum, ex) => sum + ex.count, 0);
                        const percentage = ((item.count / total) * 100).toFixed(1);
                        return (
                          <div key={item.exchange__name} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            backgroundColor: '#334155',
                            borderRadius: '4px',
                            border: '1px solid #475569'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: index === 0 ? '#2dd4bf' : index === 1 ? '#3b82f6' : index === 2 ? '#10b981' : '#f59e0b'
                              }}></div>
                              <span style={{ fontSize: '12px', color: '#d1d5db' }}>
                                {item.exchange__name}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '12px', color: '#2dd4bf', fontWeight: '600' }}>
                                {item.count}
                              </span>
                              <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                                ({percentage}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '24px' }}>
              <div style={{ fontSize: '14px' }}>No chart data available</div>
            </div>
          )}
        </div>
      )}

      {showIndustryModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px',
            zIndex: 100,
          }}
          onClick={closeIndustryModal}
        >
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '1100px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f8fafc' }}>Industry Overview</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                  Total companies: {industrySummary.totalCompanies.toLocaleString()} | Industries: {industrySummary.industriesListed.toLocaleString()} | Sectors: {industrySummary.sectorsListed.toLocaleString()}
                </div>
              </div>
              <button
                onClick={closeIndustryModal}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #475569',
                  color: '#f8fafc',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

            <div style={{ padding: '0 20px 20px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1e293b' }}>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#cbd5f5', fontSize: '12px', borderBottom: '1px solid #334155' }}>Industry Name</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#cbd5f5', fontSize: '12px', borderBottom: '1px solid #334155' }}>Sector</th>
                    <th style={{ textAlign: 'right', padding: '12px', color: '#cbd5f5', fontSize: '12px', borderBottom: '1px solid #334155' }}>Market Cap</th>
                    <th style={{ textAlign: 'right', padding: '12px', color: '#cbd5f5', fontSize: '12px', borderBottom: '1px solid #334155' }}>1%</th>
                    <th style={{ textAlign: 'right', padding: '12px', color: '#cbd5f5', fontSize: '12px', borderBottom: '1px solid #334155' }}>Companies</th>
                    <th style={{ textAlign: 'right', padding: '12px', color: '#cbd5f5', fontSize: '12px', borderBottom: '1px solid #334155' }}>Funds</th>
                  </tr>
                </thead>
                <tbody>
                  {industryDetails.map((item, idx) => (
                    <tr
                      key={`${item.name}-${idx}`}
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#0f172a' : '#111d34',
                        borderBottom: '1px solid #1e293b'
                      }}
                    >
                      <td style={{ padding: '10px 12px', color: '#e2e8f0', fontSize: '13px' }}>{item.name}</td>
                      <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '13px' }}>{item.sector || 'N/A'}</td>
                      <td style={{ padding: '10px 12px', color: '#f8fafc', fontSize: '13px', textAlign: 'right' }}>
                        {item.marketCap ? formatMarketCap(item.marketCap) : 'N/A'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#f8fafc', fontSize: '13px', textAlign: 'right' }}>
                        {item.marketCap ? formatPercentageValue(item.marketCap * 0.01) : 'N/A'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#f8fafc', fontSize: '13px', textAlign: 'right' }}>{item.count}</td>
                      <td style={{ padding: '10px 12px', color: '#10b981', fontSize: '13px', textAlign: 'right' }}>
                        {Math.ceil(item.count / 20)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Show/Hide Charts Button */}
      {!showCharts && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderBottom: '1px solid rgba(45, 212, 191, 0.1)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => setShowCharts(true)}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #475569',
              color: '#2dd4bf',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <BarChart3 style={{ width: '18px', height: '18px' }} />
            Show Analytics Dashboard
          </button>
        </div>
      )}

      {/* Results Bar */}
      <div style={{ backgroundColor: '#1e293b', padding: '12px 24px', borderBottom: '1px solid #475569' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#d1d5db' }}>
            <span>
              {loading ? 'Loading...' :
                  filters.priceFilter !== 'Any' || filters.marketCapMin !== '' || filters.marketCapMax !== '' ?
                  `${selectedStocks.size} selected / ${stocks.length} showing / ${pagination.count} total` :
                  `${selectedStocks.size} selected / ${pagination.count} total`
              }
              </span>
            <button
              onClick={savePortfolioAsExcel}
              style={{ color: '#2dd4bf', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              save as portfolio
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d1d5db' }}>
              <label style={{ fontSize: '12px' }}>Rows per page:</label>
              <select
                value={pagination.pageSize}
                onChange={(e) => setPagination(prev => ({ ...prev, pageSize: parseInt(e.target.value), page: 1 }))}
                style={{
                  backgroundColor: '#334155',
                  border: '1px solid #475569',
                  color: 'white',
                  padding: '4px 8px',
                  fontSize: '12px',
                  borderRadius: '4px'
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
            <span style={{ color: '#9ca3af' }}>
              Page {pagination.page} / {totalPages || 1}
            </span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ backgroundColor: '#dc2626', color: 'white', padding: '12px 24px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ backgroundColor: '#0f172a' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#1e293b' }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#d1d5db', textTransform: 'uppercase' }}>
                <input
                  type="checkbox"
                  checked={stocks.length > 0 && selectedStocks.size === stocks.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#d1d5db', textTransform: 'uppercase' }}>NO. TICKER</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#d1d5db', textTransform: 'uppercase' }}>COMPANY</th>

              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#d1d5db', textTransform: 'uppercase' }}>
                <button
                  onClick={() => handleSort('market_cap')}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer' }}
                >
                  MARKET CAP {getSortIcon('market_cap')}
                </button>
              </th>

              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#d1d5db', textTransform: 'uppercase' }}>
                <button
                  onClick={() => handleSort('price')}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer' }}
                >
                  PRICE {getSortIcon('price')}
                </button>
              </th>

              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#d1d5db', textTransform: 'uppercase' }}>
                <button
                  onClick={() => handleSort('pe_ratio')}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer' }}
                >
                  P/E RATIO {getSortIcon('pe_ratio')}
                </button>
              </th>

              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#d1d5db', textTransform: 'uppercase' }}>
                <button
                  onClick={() => handleSort('country')}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer' }}
                >
                  COUNTRY {getSortIcon('country')}
                </button>
              </th>

              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#d1d5db', textTransform: 'uppercase' }}>
                <button
                  onClick={() => handleSort('exchange_name')}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer' }}
                >
                  EXCHANGE NAME {getSortIcon('exchange_name')}
                </button>
              </th>

              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#d1d5db', textTransform: 'uppercase' }}>
                <button
                  onClick={() => handleSort('sector_name')}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer' }}
                >
                  SECTOR {getSortIcon('sector_name')}
                </button>
              </th>

              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#d1d5db', textTransform: 'uppercase' }}>
                <button
                  onClick={() => handleSort('industry_name')}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer' }}
                >
                  INDUSTRY {getSortIcon('industry_name')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
                  Loading stocks...
                </td>
              </tr>
            ) : stocks.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
                  No stocks found
                </td>
              </tr>
            ) : (
              stocks.map((stock, index) => (
                <tr
                  key={stock.id}
                  onClick={() => handleCompanyModalOpen(stock)}
                  style={{
                    backgroundColor: selectedStocks.has(stock.id) ? 'rgba(20, 184, 166, 0.1)' : 'transparent',
                    borderLeft: selectedStocks.has(stock.id) ? '4px solid #2dd4bf' : '4px solid transparent',
                    cursor: 'pointer',
                    borderBottom: '1px solid #475569'
                  }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <input
                      type="checkbox"
                      checked={selectedStocks.has(stock.id)}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => {
                        event.stopPropagation();
                        toggleSelectStock(stock.id);
                      }}
                    />
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    <span style={{ color: '#9ca3af', marginRight: '8px' }}>
                      {(pagination.page - 1) * pagination.pageSize + index + 1}
                    </span>
                    <span style={{ color: '#2dd4bf', fontWeight: '500' }}>{stock.ticker}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'white' }}>
                    {stock.company_name}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'white' }}>
                    {formatNumber(stock.market_cap)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'white', fontWeight: '500' }}>
                    {stock.price ? `${stock.price.toFixed(2)}` : 'N/A'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#d1d5db' }}>
                    {stock.pe_ratio ? stock.pe_ratio.toFixed(2) : 'N/A'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#d1d5db' }}>
                    {stock.country || 'N/A'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#d1d5db' }}>
                    {stock.exchange_name || 'N/A'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#d1d5db' }}>
                    {stock.sector_name || 'N/A'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#d1d5db' }}>
                    {stock.industry_name || 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ backgroundColor: '#1e293b', padding: '16px 24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page === 1}
            style={{
              padding: '8px 12px',
              backgroundColor: pagination.page === 1 ? '#475569' : '#0d9488',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: pagination.page === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>

          {/* Page Numbers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* First page */}
            {pagination.page > 3 && (
              <>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '1' === pagination.page.toString() ? '#0d9488' : 'transparent',
                    color: '1' === pagination.page.toString() ? 'white' : '#d1d5db',
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    minWidth: '40px'
                  }}
                >
                  1
                </button>
                {pagination.page > 4 && (
                  <span style={{ color: '#9ca3af', padding: '0 4px' }}>...</span>
                )}
              </>
            )}

            {/* Previous page */}
            {pagination.page > 1 && (
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  color: '#d1d5db',
                  border: '1px solid #475569',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  minWidth: '40px'
                }}
              >
                {pagination.page - 1}
              </button>
            )}

            {/* Current page */}
            <button
              style={{
                padding: '8px 12px',
                backgroundColor: '#0d9488',
                color: 'white',
                border: '1px solid #2dd4bf',
                borderRadius: '4px',
                cursor: 'default',
                minWidth: '40px',
                fontWeight: 'bold'
              }}
            >
              {pagination.page}
            </button>

            {/* Next page */}
            {pagination.page < totalPages && (
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  color: '#d1d5db',
                  border: '1px solid #475569',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  minWidth: '40px'
                }}
              >
                {pagination.page + 1}
              </button>
            )}

            {/* Last page */}
            {pagination.page < totalPages - 2 && (
              <>
                {pagination.page < totalPages - 3 && (
                  <span style={{ color: '#9ca3af', padding: '0 4px' }}>...</span>
                )}
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: totalPages }))}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: totalPages.toString() === pagination.page.toString() ? '#0d9488' : 'transparent',
                    color: totalPages.toString() === pagination.page.toString() ? 'white' : '#d1d5db',
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    minWidth: '40px'
                  }}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
            disabled={pagination.page === totalPages}
            style={{
              padding: '8px 12px',
              backgroundColor: pagination.page === totalPages ? '#475569' : '#0d9488',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: pagination.page === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      )}

      <CompanyDetailModal
        isOpen={companyModal.open}
        ticker={companyModal.ticker}
        exchange={companyModal.exchange}
        companyName={companyModal.name}
        onClose={handleCompanyModalClose}
      />
    </div>
  );
};

export default ScreenerPage;
