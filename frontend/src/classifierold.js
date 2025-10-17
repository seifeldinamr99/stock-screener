import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Filter, ChevronUp, ChevronRight, FileText, Folder, Expand, Shrink } from 'lucide-react';
import CompaniesTable from './CompaniesTable';

import { API_BASE_URL } from './utils/constants';

const ClassifiersPage = () => {
  const [filterOptions, setFilterOptions] = useState({
    exchanges: [],
    sectors: [],
    industries: []
  });
  const [sectorIndustries, setSectorIndustries] = useState([]);
  const [selectedExchange, setSelectedExchange] = useState('');
  const [sectorsData, setSectorsData] = useState([]);
  const [sectorsLoading, setSectorsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState('sectors'); // 'sectors', 'sector-detail', or 'industry-detail'
  const [selectedSector, setSelectedSector] = useState(null);
  const [sectorDetailData, setSectorDetailData] = useState({
    industryBreakdown: []
  });
  const [industriesData, setIndustriesData] = useState([]);
  const [industriesLoading, setIndustriesLoading] = useState(false);
  const [sectorDetailLoading, setSectorDetailLoading] = useState(false);
  const [sectorFilters, setSectorFilters] = useState({
    marketCapMin: '',
    marketCapMax: '',
    marketCapMinUnit: 'M',
    marketCapMaxUnit: 'M',
    exchange: '',
    industry: ''
  });
  const [industrySearchTerm, setIndustrySearchTerm] = useState('');
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [sectorCompanies, setSectorCompanies] = useState([]);
  const [showSectorCompanies, setShowSectorCompanies] = useState(false);
  const [sectorCompaniesLoading, setSectorCompaniesLoading] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [industryDetailData, setIndustryDetailData] = useState({
    companies: 0,
    funds: 0,
    totalMarketCap: 0
  });
  const [industryDetailLoading, setIndustryDetailLoading] = useState(false);
  const [industryCompanies, setIndustryCompanies] = useState([]);
  const [showIndustryCompanies, setShowIndustryCompanies] = useState(false);
  const [industryCompaniesLoading, setIndustryCompaniesLoading] = useState(false);
  const [industrySearch, setIndustrySearch] = useState('');
  const [industrySortBy, setIndustrySortBy] = useState('count'); // 'count', 'name'
  const [industrySortOrder, setIndustrySortOrder] = useState('desc'); // 'asc', 'desc'
  const [isIndustriesFullScreen, setIsIndustriesFullScreen] = useState(false);
  const [isCompaniesFullScreen, setIsCompaniesFullScreen] = useState(false);

  // Companies table state
  const [companiesSortBy, setCompaniesSortBy] = useState('market_cap');
  const [companiesSortOrder, setCompaniesSortOrder] = useState('desc');
  const [companiesFilters, setCompaniesFilters] = useState({
    exchange: '',
    country: '',
    marketCapMin: '',
    marketCapMax: '',
    marketCapMinUnit: 'M',
    marketCapMaxUnit: 'M'
  });

  // Refs for auto-scroll
  const sectorCompaniesRef = useRef(null);
  const industryCompaniesRef = useRef(null);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    if (filterOptions.sectors.length > 0) {
      buildSectorsData();
    }
  }, [filterOptions, selectedExchange]);

  useEffect(() => {
    if (currentView === 'sector-detail' && selectedSector) {
      fetchSectorDetailData(selectedSector);
      if (showSectorCompanies) {
        fetchSectorCompanies();
      }
    } else if (currentView === 'industry-detail' && selectedIndustry) {
      fetchIndustryDetailData(selectedIndustry);
      if (showIndustryCompanies) {
        fetchIndustryCompanies();
      }
    }
  }, [sectorFilters]);

  // Handle click outside to close industry dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showIndustryDropdown && !event.target.closest('.industry-dropdown')) {
        setShowIndustryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showIndustryDropdown]);

  const fetchFilterOptions = async () => {
    setSectorsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/stocks/filter_options/`);
      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data);
      }
    } catch (err) {
      setError('Error fetching filter options');
      console.error('Error fetching filter options:', err);
    } finally {
      setSectorsLoading(false);
    }
  };

  const fetchSectorIndustries = async (sectorName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sectors/${encodeURIComponent(sectorName)}/industries/`);
      if (response.ok) {
        const data = await response.json();
        setSectorIndustries(data.industries || []);
        setError(''); // Clear any previous errors
      } else {
        console.error('Error fetching sector industries:', response.statusText);
        setSectorIndustries([]);
        setError(`Failed to load industries for ${sectorName}. Please try again.`);
      }
    } catch (err) {
      console.error('Error fetching sector industries:', err);
      setSectorIndustries([]);
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setError(`Error loading industries for ${sectorName}. Please try again.`);
      }
    }
  };

  const buildSectorsData = async () => {
    setSectorsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedExchange) {
        params.append('exchange', selectedExchange);
      }

      const response = await fetch(`${API_BASE_URL}/stocks/sector-industry-counts/?${params.toString()}`);
      if (response.ok) {
        const sectorsArray = await response.json();
        setSectorsData(sectorsArray);
      }
    } catch (err) {
      setError('Error building sectors data');
      console.error('Error building sectors data:', err);
    } finally {
      setSectorsLoading(false);
    }
  };

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


  const fetchSectorDetailData = async (sectorName) => {
    setSectorDetailLoading(true);
    setIndustriesLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('sector', sectorName);

      // Apply sector filters
      if (sectorFilters.exchange) params.append('exchange', sectorFilters.exchange);
      if (sectorFilters.industry) params.append('industry', sectorFilters.industry);

      // Add market cap filtering
      const marketCapParams = parseMarketCapFilter(
        sectorFilters.marketCapMin,
        sectorFilters.marketCapMax,
        sectorFilters.marketCapMinUnit,
        sectorFilters.marketCapMaxUnit
      );
      if (marketCapParams.market_cap_min) params.append('market_cap_min', marketCapParams.market_cap_min.toString());
      if (marketCapParams.market_cap_max) params.append('market_cap_max', marketCapParams.market_cap_max.toString());

      // Include companies data to calculate countries count immediately
      params.append('include_companies', 'true');

      const response = await fetch(`${API_BASE_URL}/filtered-stats/?${params.toString()}`);
      console.log('fetchSectorDetailData API call:', `${API_BASE_URL}/filtered-stats/?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        console.log('fetchSectorDetailData response (industry_breakdown):', data.industry_breakdown);

        // Calculate funds (companies / 20)
        const funds = Math.ceil(data.total_companies / 20);

        // Calculate countries count from companies data if available
        let countriesCount = 0;
        if (data.companies && Array.isArray(data.companies)) {
          const uniqueCountries = new Set(data.companies.map(company => company.country).filter(Boolean));
          countriesCount = uniqueCountries.size;
        }

        setSectorDetailData({
          sectorName,
          companies: data.total_companies,
          industries: data.unique_industries,
          funds: funds,
          totalMarketCap: data.total_market_cap || 0,
          exchanges: data.unique_exchanges || 0,
          countries: countriesCount, // Use calculated countries count
          industryBreakdown: [] // We'll use the separate industriesData instead
        });

        // Use industry_breakdown data directly instead of making individual API calls
        if (data.industry_breakdown && Array.isArray(data.industry_breakdown)) {
          setIndustriesData(data.industry_breakdown);
        } else {
          setIndustriesData([]);
        }
      }
    } catch (err) {
      setError('Error fetching sector detail data');
      console.error('Error fetching sector detail data:', err);
    } finally {
      setSectorDetailLoading(false);
      setIndustriesLoading(false);
    }
  };

  const fetchSectorCompanies = async () => {
    setSectorCompaniesLoading(true);
    try {
      // Use the exact same parameters as fetchSectorDetailData
      const params = new URLSearchParams();
      params.append('sector', selectedSector);
      params.append('page_size', '5000');

      // Apply sector filters (same as stats)
      if (sectorFilters.exchange) params.append('exchange', sectorFilters.exchange);
      if (sectorFilters.industry) params.append('industry', sectorFilters.industry);

      // Add market cap filtering (same as stats)
      const marketCapParams = parseMarketCapFilter(
        sectorFilters.marketCapMin,
        sectorFilters.marketCapMax,
        sectorFilters.marketCapMinUnit,
        sectorFilters.marketCapMaxUnit
      );
      if (marketCapParams.market_cap_min) params.append('market_cap_min', marketCapParams.market_cap_min.toString());
      if (marketCapParams.market_cap_max) params.append('market_cap_max', marketCapParams.market_cap_max.toString());

      // Use the same endpoint as stats with detailed companies data
      params.append('include_companies', 'true');
      const response = await fetch(`${API_BASE_URL}/filtered-stats/?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const companies = data.companies || [];
        setSectorCompanies(companies);

        // Calculate unique countries from companies data
        const uniqueCountries = new Set(companies.map(company => company.country).filter(Boolean));
        setSectorDetailData(prev => ({
          ...prev,
          countries: uniqueCountries.size
        }));
      }
    } catch (err) {
      setError('Error fetching sector companies');
      console.error('Error fetching sector companies:', err);
    } finally {
      setSectorCompaniesLoading(false);
    }
  };

  const handleSectorClick = (sectorName) => {
    setSelectedSector(sectorName);
    setCurrentView('sector-detail');
    setSectorFilters(prev => ({ ...prev, exchange: selectedExchange })); // Inherit exchange filter
    fetchSectorDetailData(sectorName);
    fetchSectorIndustries(sectorName); // Fetch industries for this sector
  };

  const handleBackToSectors = () => {
    setCurrentView('sectors');
    setSelectedSector(null);
    setSectorDetailData({
      industryBreakdown: []
    });
    setSectorCompanies([]);
    setShowSectorCompanies(false);
    setSelectedIndustry(null);
    setIndustryDetailData({
      companies: 0,
      funds: 0,
      totalMarketCap: 0
    });
    setIndustryCompanies([]);
    setShowIndustryCompanies(false);
    setSectorFilters({
      marketCapMin: '',
      marketCapMax: '',
      marketCapMinUnit: 'M',
      marketCapMaxUnit: 'M',
      exchange: '',
      industry: ''
    });
    setIndustrySearchTerm('');
    setShowIndustryDropdown(false);
    setIndustrySearch('');
    setIndustrySortBy('count');
    setIndustrySortOrder('desc');
    setSectorIndustries([]); // Clear sector-specific industries
    setError(''); // Clear any errors
  };

  const handleBackToSector = () => {
    setCurrentView('sector-detail');
    setSelectedIndustry(null);
    setIndustryDetailData({
      companies: 0,
      funds: 0,
      totalMarketCap: 0
    });
    setIndustryCompanies([]);
    setShowIndustryCompanies(false);
  };

  const handleIndustryClick = (industryName) => {
    setSelectedIndustry(industryName);
    setCurrentView('industry-detail');
    fetchIndustryDetailData(industryName);
  };

  const fetchIndustryDetailData = async (industryName) => {
    setIndustryDetailLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('sector', selectedSector);
      params.append('industry', industryName);

      // Apply current filters
      if (sectorFilters.exchange) params.append('exchange', sectorFilters.exchange);

      // Add market cap filtering
      const marketCapParams = parseMarketCapFilter(
        sectorFilters.marketCapMin,
        sectorFilters.marketCapMax,
        sectorFilters.marketCapMinUnit,
        sectorFilters.marketCapMaxUnit
      );
      if (marketCapParams.market_cap_min) params.append('market_cap_min', marketCapParams.market_cap_min.toString());
      if (marketCapParams.market_cap_max) params.append('market_cap_max', marketCapParams.market_cap_max.toString());

      // Include companies data to calculate countries count immediately
      params.append('include_companies', 'true');

      const response = await fetch(`${API_BASE_URL}/filtered-stats/?${params.toString()}`);
      console.log('fetchIndustryDetailData API call:', `${API_BASE_URL}/filtered-stats/?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        console.log('fetchIndustryDetailData response:', data);

        // Calculate funds (companies / 20)
        const funds = Math.ceil(data.total_companies / 20);

        // Calculate countries count from companies data if available
        let countriesCount = 0;
        if (data.companies && Array.isArray(data.companies)) {
          const uniqueCountries = new Set(data.companies.map(company => company.country).filter(Boolean));
          countriesCount = uniqueCountries.size;
        }

        setIndustryDetailData({
          industryName,
          sectorName: selectedSector,
          companies: data.total_companies,
          funds: funds,
          totalMarketCap: data.total_market_cap || 0,
          exchanges: data.unique_exchanges || 0,
          countries: countriesCount // Use calculated countries count
        });
      }
    } catch (err) {
      setError('Error fetching industry detail data');
      console.error('Error fetching industry detail data:', err);
    } finally {
      setIndustryDetailLoading(false);
    }
  };

  const fetchIndustryCompanies = async () => {
    setIndustryCompaniesLoading(true);
    try {
      // Use the exact same parameters as fetchIndustryDetailData
      const params = new URLSearchParams();
      params.append('sector', selectedSector);
      params.append('industry', selectedIndustry);
      params.append('page_size', '5000');

      // Apply current filters (same as stats)
      if (sectorFilters.exchange) params.append('exchange', sectorFilters.exchange);

      // Add market cap filtering (same as stats)
      const marketCapParams = parseMarketCapFilter(
        sectorFilters.marketCapMin,
        sectorFilters.marketCapMax,
        sectorFilters.marketCapMinUnit,
        sectorFilters.marketCapMaxUnit
      );
      if (marketCapParams.market_cap_min) params.append('market_cap_min', marketCapParams.market_cap_min.toString());
      if (marketCapParams.market_cap_max) params.append('market_cap_max', marketCapParams.market_cap_max.toString());

      // Use the same endpoint as stats with detailed companies data
      params.append('include_companies', 'true');
      const response = await fetch(`${API_BASE_URL}/filtered-stats/?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const companies = data.companies || [];
        setIndustryCompanies(companies);

        // Calculate unique countries from companies data
        const uniqueCountries = new Set(companies.map(company => company.country).filter(Boolean));
        setIndustryDetailData(prev => ({
          ...prev,
          countries: uniqueCountries.size
        }));
      }
    } catch (err) {
      setError('Error fetching industry companies');
      console.error('Error fetching industry companies:', err);
    } finally {
      setIndustryCompaniesLoading(false);
    }
  };

  const handleSectorFilterChange = (key, value) => {
    setSectorFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleShowCompanies = () => {
    if (showSectorCompanies) {
      setShowSectorCompanies(false);
      setSectorCompanies([]);
    } else {
      setShowSectorCompanies(true);
      fetchSectorCompanies();
      // Auto-scroll to companies table after a short delay
      setTimeout(() => {
        if (sectorCompaniesRef.current) {
          const elementRect = sectorCompaniesRef.current.getBoundingClientRect();
          const absoluteElementTop = elementRect.top + window.pageYOffset;
          const offset = 80; // Additional offset to show more content
          window.scrollTo({
            top: absoluteElementTop - offset,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  const handleShowIndustryCompanies = () => {
    if (showIndustryCompanies) {
      setShowIndustryCompanies(false);
      setIndustryCompanies([]);
    } else {
      setShowIndustryCompanies(true);
      fetchIndustryCompanies();
      // Auto-scroll to companies table after a short delay
      setTimeout(() => {
        if (industryCompaniesRef.current) {
          const elementRect = industryCompaniesRef.current.getBoundingClientRect();
          const absoluteElementTop = elementRect.top + window.pageYOffset;
          const offset = 80; // Additional offset to show more content
          window.scrollTo({
            top: absoluteElementTop - offset,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  const formatMarketCap = (marketCap) => {
    if (marketCap === 0 || !marketCap) return 'N/A';
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  const handleHeaderSort = (sortField) => {
    if (industrySortBy === sortField) {
      setIndustrySortOrder(industrySortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setIndustrySortBy(sortField);
      setIndustrySortOrder('desc');
    }
  };

  const getSortIcon = (sortField) => {
    if (industrySortBy !== sortField) {
      return <ChevronUp style={{ width: '16px', height: '16px', color: '#6b7280', opacity: 0.3 }} />;
    }
    return industrySortOrder === 'desc' ?
      <ChevronDown style={{ width: '16px', height: '16px', color: '#00917C' }} /> :
      <ChevronUp style={{ width: '16px', height: '16px', color: '#00917C' }} />;
  };

  const getCompaniesSortIcon = (field) => {
    if (companiesSortBy !== field) {
      return <ChevronUp style={{ width: '16px', height: '16px', color: '#6b7280', opacity: 0.3 }} />;
    }
    return companiesSortOrder === 'asc' ?
      <ChevronDown style={{ width: '16px', height: '16px', color: '#00917C' }} /> :
      <ChevronUp style={{ width: '16px', height: '16px', color: '#00917C' }} />;
  };

  const handleCompaniesSort = (field) => {
    if (companiesSortBy === field) {
      setCompaniesSortOrder(companiesSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setCompaniesSortBy(field);
      setCompaniesSortOrder('desc');
    }
  };

  const filterAndSortCompanies = (companies) => {
    let filtered = companies.filter(company => {
      if (companiesFilters.exchange && company.exchange_name !== companiesFilters.exchange) return false;
      if (companiesFilters.country && company.country !== companiesFilters.country) return false;

      if (companiesFilters.marketCapMin) {
        const minCap = parseFloat(companiesFilters.marketCapMin) * (companiesFilters.marketCapMinUnit === 'B' ? 1000000000 : 1000000);
        if ((company.market_cap || 0) < minCap) return false;
      }

      if (companiesFilters.marketCapMax) {
        const maxCap = parseFloat(companiesFilters.marketCapMax) * (companiesFilters.marketCapMaxUnit === 'B' ? 1000000000 : 1000000);
        if ((company.market_cap || 0) > maxCap) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (companiesSortBy) {
        case 'ticker':
          aVal = a.ticker || '';
          bVal = b.ticker || '';
          break;
        case 'company_name':
          aVal = a.company_name || '';
          bVal = b.company_name || '';
          break;
        case 'price':
          aVal = parseFloat(a.price) || 0;
          bVal = parseFloat(b.price) || 0;
          break;
        case 'market_cap':
          aVal = a.market_cap || 0;
          bVal = b.market_cap || 0;
          break;
        case 'exchange':
          aVal = a.exchange_name || '';
          bVal = b.exchange_name || '';
          break;
        case 'country':
          aVal = a.country || '';
          bVal = b.country || '';
          break;
        default:
          aVal = a.market_cap || 0;
          bVal = b.market_cap || 0;
      }

      if (typeof aVal === 'string') {
        return companiesSortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        return companiesSortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });

    return filtered;
  };

  const handleExchangeChange = (exchangeCode) => {
    setSelectedExchange(exchangeCode);
    // If we're in sector detail view, also update the sector filter and refresh data
    if (currentView === 'sector-detail') {
      setSectorFilters(prev => ({ ...prev, exchange: exchangeCode }));
    }
  };

  if (currentView === 'sectors') {
    return (
      <div style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #475569', padding: '16px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#d1d5db', margin: 0 }}>Market Classifications</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <label style={{ color: '#d1d5db', fontSize: '14px' }}>Exchange:</label>
              <select
                value={selectedExchange}
                onChange={(e) => handleExchangeChange(e.target.value)}
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  color: 'white',
                  padding: '8px 12px',
                  fontSize: '14px',
                  borderRadius: '4px',
                  minWidth: '200px'
                }}
              >
                <option value="">All Exchanges</option>
                {filterOptions.exchanges.map(exchange => (
                  <option key={exchange.id} value={exchange.code}>
                    {exchange.name} ({exchange.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedExchange && (
            <div style={{ fontSize: '14px', color: '#9ca3af' }}>
              Showing classifications for: {filterOptions.exchanges.find(ex => ex.code === selectedExchange)?.name || selectedExchange}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ backgroundColor: '#dc2626', color: 'white', padding: '12px 24px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* Sectors Grid */}
        <div style={{ padding: '24px' }}>
          {sectorsLoading ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '48px' }}>
              <div style={{ fontSize: '16px' }}>Loading sectors...</div>
            </div>
          ) : sectorsData.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '48px' }}>
              <div style={{ fontSize: '16px' }}>No sectors available</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {sectorsData.map(sector => (
                <div
                  key={sector.name}
                  onClick={() => handleSectorClick(sector.name)}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                  onMouseEnter={(e) => {
                    const card = e.currentTarget;
                    card.style.backgroundColor = '#1e293b';
                    card.style.borderColor = '#00917C';
                  }}
                  onMouseLeave={(e) => {
                    const card = e.currentTarget;
                    card.style.backgroundColor = '#1e293b';
                    card.style.borderColor = '#334155';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Folder style={{ width: '24px', height: '24px', color: '#00917C' }} />
                    <h4 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: 0 }}>
                      {sector.name}
                    </h4>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '14px', color: '#9ca3af' }}>
                        {sector.total_companies} Companies
                      </span>
                      <span style={{ fontSize: '14px', color: '#9ca3af' }}>
                        {sector.industries.length} Industries
                      </span>
                    </div>
                    <ChevronRight style={{ width: '20px', height: '20px', color: '#9ca3af' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Summary Footer - Fixed at bottom */}
        {!sectorsLoading && sectorsData.length > 0 && (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#1e293b',
            borderTop: '1px solid #475569',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px',
            color: '#d1d5db',
            zIndex: 100
          }}>
            <span>
              Total: {sectorsData.length} sectors with {sectorsData.reduce((sum, sector) => sum + sector.total_companies, 0)} companies
            </span>
            <span style={{ color: '#9ca3af' }}>
              Click sectors to navigate to detailed analytics
            </span>
          </div>
        )}
      </div>
    );
  }

  if (currentView === 'sector-detail') {
    return (
      <div style={{ width: '100%' }}>
        {/* Header with Back Button */}
        <div style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #475569', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <button
              onClick={handleBackToSectors}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #475569',
                color: '#d1d5db',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <ChevronDown style={{ width: '16px', height: '16px', transform: 'rotate(90deg)' }} />
              Back to Sectors
            </button>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#d1d5db', margin: 0 }}>
              {selectedSector} Sector
            </h3>
          </div>

          {/* Sector Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ color: '#d1d5db', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Exchange</label>
              <select
                value={sectorFilters.exchange}
                onChange={(e) => handleSectorFilterChange('exchange', e.target.value)}
                style={{ width: '100%', backgroundColor: '#334155', border: '1px solid #475569', color: 'white', padding: '8px 12px', fontSize: '14px', borderRadius: '4px' }}
              >
                <option value="">All Exchanges</option>
                {filterOptions.exchanges.map(exchange => (
                  <option key={exchange.id} value={exchange.code}>
                    {exchange.name} ({exchange.code})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ position: 'relative' }} className="industry-dropdown">
              <label style={{ color: '#d1d5db', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Industry</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={industrySearchTerm}
                  onChange={(e) => {
                    setIndustrySearchTerm(e.target.value);
                    setShowIndustryDropdown(true);
                  }}
                  onFocus={() => setShowIndustryDropdown(true)}
                  placeholder={sectorFilters.industry || "Search industries..."}
                  style={{
                    width: '100%',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    color: 'white',
                    padding: '8px 32px 8px 12px',
                    fontSize: '14px',
                    borderRadius: '4px'
                  }}
                />
                <ChevronDown
                  onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '16px',
                    height: '16px',
                    color: '#9ca3af',
                    cursor: 'pointer'
                  }}
                />
              </div>
              {showIndustryDropdown && (
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
                  <div
                    onClick={() => {
                      handleSectorFilterChange('industry', '');
                      setIndustrySearchTerm('');
                      setShowIndustryDropdown(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#d1d5db',
                      backgroundColor: !sectorFilters.industry ? '#334155' : 'transparent'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#334155'}
                    onMouseOut={(e) => e.target.style.backgroundColor = !sectorFilters.industry ? '#334155' : 'transparent'}
                  >
                    All Industries
                  </div>
                  {sectorIndustries
                    .filter(industry => industry.name.toLowerCase().includes(industrySearchTerm.toLowerCase()))
                    .map(industry => (
                      <div
                        key={industry.id}
                        onClick={() => {
                          handleSectorFilterChange('industry', industry.name);
                          setIndustrySearchTerm('');
                          setShowIndustryDropdown(false);
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#d1d5db',
                          backgroundColor: sectorFilters.industry === industry.name ? '#334155' : 'transparent'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#334155'}
                        onMouseOut={(e) => e.target.style.backgroundColor = sectorFilters.industry === industry.name ? '#334155' : 'transparent'}
                      >
                        {industry.name}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Market Cap Filter */}
          <div style={{ marginTop: '16px' }}>
            <label style={{ color: '#d1d5db', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Market Cap Range</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="number"
                placeholder="From"
                value={sectorFilters.marketCapMin}
                onChange={(e) => handleSectorFilterChange('marketCapMin', e.target.value)}
                style={{ backgroundColor: '#334155', border: '1px solid #475569', color: 'white', padding: '8px 12px', fontSize: '14px', borderRadius: '4px', width: '100px' }}
              />
              <select
                value={sectorFilters.marketCapMinUnit}
                onChange={(e) => handleSectorFilterChange('marketCapMinUnit', e.target.value)}
                style={{ backgroundColor: '#334155', border: '1px solid #475569', color: 'white', padding: '8px 12px', fontSize: '14px', borderRadius: '4px' }}
              >
                <option value="M">Million</option>
                <option value="B">Billion</option>
              </select>
              <span style={{ color: '#9ca3af', fontSize: '14px' }}>to</span>
              <input
                type="number"
                placeholder="To"
                value={sectorFilters.marketCapMax}
                onChange={(e) => handleSectorFilterChange('marketCapMax', e.target.value)}
                style={{ backgroundColor: '#334155', border: '1px solid #475569', color: 'white', padding: '8px 12px', fontSize: '14px', borderRadius: '4px', width: '100px' }}
              />
              <select
                value={sectorFilters.marketCapMaxUnit}
                onChange={(e) => handleSectorFilterChange('marketCapMaxUnit', e.target.value)}
                style={{ backgroundColor: '#334155', border: '1px solid #475569', color: 'white', padding: '8px 12px', fontSize: '14px', borderRadius: '4px' }}
              >
                <option value="M">Million</option>
                <option value="B">Billion</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ backgroundColor: '#dc2626', color: 'white', padding: '12px 24px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* Sector Detail Content */}
        <div style={{ padding: '24px' }}>
          {sectorDetailLoading ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '48px' }}>
              <div style={{ fontSize: '16px' }}>Loading sector data...</div>
            </div>
          ) : sectorDetailData && sectorDetailData.sectorName ? (
            <div>
              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #475569', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00917C', marginBottom: '8px' }}>{sectorDetailData.companies}</div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>Companies</div>
                </div>
                <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #475569', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>{sectorDetailData.industries}</div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>Industries</div>
                </div>
                <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #475569', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFCE7B', marginBottom: '8px' }}>{sectorDetailData.funds}</div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>Funds</div>
                </div>
                <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #475569', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00917C', marginBottom: '8px' }}>{formatMarketCap(sectorDetailData.totalMarketCap)}</div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>Total Market Cap</div>
                </div>
                <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #475569', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '8px' }}>{formatMarketCap(sectorDetailData.totalMarketCap * 0.01)}</div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>1% of Total Market Cap</div>
                </div>
                <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #475569', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>{sectorDetailData.exchanges || 0}</div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>Exchanges</div>
                </div>
                <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #475569', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>{sectorDetailData.countries || 0}</div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>Countries</div>
                </div>
              </div>

              {/* Industries Table and Chart Row */}
              <div style={{ display: 'grid', gridTemplateColumns: isIndustriesFullScreen ? '1fr' : '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* Industries Table */}
                <div style={{
                  backgroundColor: '#1e293b',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #475569',
                  position: isIndustriesFullScreen ? 'fixed' : 'relative',
                  top: isIndustriesFullScreen ? '0' : 'auto',
                  left: isIndustriesFullScreen ? '0' : 'auto',
                  width: isIndustriesFullScreen ? '100vw' : 'auto',
                  height: isIndustriesFullScreen ? '100vh' : 'auto',
                  zIndex: isIndustriesFullScreen ? 1000 : 'auto',
                  overflow: isIndustriesFullScreen ? 'auto' : 'visible'
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', color: '#d1d5db', margin: 0 }}>
                    Industries in {selectedSector} Sector ({industriesData?.length || 0} total)
                    {industriesLoading && <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>Loading...</span>}
                  </h4>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Search industries..."
                      value={industrySearch}
                      onChange={(e) => setIndustrySearch(e.target.value)}
                      style={{
                        backgroundColor: '#334155',
                        border: '1px solid #475569',
                        color: 'white',
                        padding: '6px 12px',
                        fontSize: '12px',
                        borderRadius: '4px',
                        width: '200px'
                      }}
                    />
                    <select
                      value={`${industrySortBy}-${industrySortOrder}`}
                      onChange={(e) => {
                        const [sortBy, sortOrder] = e.target.value.split('-');
                        setIndustrySortBy(sortBy);
                        setIndustrySortOrder(sortOrder);
                      }}
                      style={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        color: 'white',
                        padding: '6px 12px',
                        fontSize: '12px',
                        borderRadius: '4px'
                      }}
                    >
                      <option value="count-desc">Most Companies</option>
                      <option value="count-asc">Least Companies</option>
                      <option value="total_market_cap-desc">Highest Market Cap</option>
                      <option value="total_market_cap-asc">Lowest Market Cap</option>
                      <option value="name-asc">Name A-Z</option>
                      <option value="name-desc">Name Z-A</option>
                    </select>
                    <button
                      onClick={() => setIsIndustriesFullScreen(!isIndustriesFullScreen)}
                      style={{
                        background: isIndustriesFullScreen ? '#ef4444' : '#475569',
                        border: 'none',
                        color: 'white',
                        padding: '8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '32px',
                        minHeight: '32px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = isIndustriesFullScreen ? '#dc2626' : '#00917C';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = isIndustriesFullScreen ? '#ef4444' : '#475569';
                      }}
                      title={isIndustriesFullScreen ? 'Exit full screen' : 'Enter full screen'}
                    >
                      {isIndustriesFullScreen ? (
                        <Shrink style={{ width: '16px', height: '16px' }} />
                      ) : (
                        <Expand style={{ width: '16px', height: '16px' }} />
                      )}
                    </button>
                  </div>
                </div>

                {industriesData && industriesData.length > 0 ? (
                  <div style={{
                    maxHeight: isIndustriesFullScreen ? 'calc(100vh - 120px)' : '400px',
                    overflowY: 'auto',
                    overflowX: 'auto',
                    width: '100%'
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      tableLayout: 'fixed',
                      minWidth: '800px'
                    }}>
                      <thead style={{ backgroundColor: '#1e293b', position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr>
                          <th style={{
                            padding: '12px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#9ca3af',
                            borderBottom: '1px solid #475569',
                            width: '35%'
                          }}>
                            Industry Name
                          </th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#9ca3af',
                            borderBottom: '1px solid #475569',
                            width: '15%'
                          }}>
                            <button
                              onClick={() => handleHeaderSort('total_market_cap')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                background: 'none',
                                border: 'none',
                                color: '#d1d5db',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500',
                                textTransform: 'uppercase',
                                width: '100%'
                              }}
                            >
                              MARKET CAP {getSortIcon('total_market_cap')}
                            </button>
                          </th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#9ca3af',
                            borderBottom: '1px solid #475569',
                            width: '12%'
                          }}>
                            <button
                              onClick={() => handleHeaderSort('one_percent')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                background: 'none',
                                border: 'none',
                                color: '#d1d5db',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500',
                                textTransform: 'uppercase',
                                width: '100%'
                              }}
                            >
                              1% {getSortIcon('one_percent')}
                            </button>
                          </th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#9ca3af',
                            borderBottom: '1px solid #475569',
                            width: '13%'
                          }}>
                            <button
                              onClick={() => handleHeaderSort('count')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                background: 'none',
                                border: 'none',
                                color: '#d1d5db',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500',
                                textTransform: 'uppercase',
                                width: '100%'
                              }}
                            >
                              COMPANIES {getSortIcon('count')}
                            </button>
                          </th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#9ca3af',
                            borderBottom: '1px solid #475569',
                            width: '12%'
                          }}>
                            <button
                              onClick={() => handleHeaderSort('percentage')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                background: 'none',
                                border: 'none',
                                color: '#d1d5db',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500',
                                textTransform: 'uppercase',
                                width: '100%'
                              }}
                            >
                              PERCENTAGE {getSortIcon('percentage')}
                            </button>
                          </th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#9ca3af',
                            borderBottom: '1px solid #475569',
                            width: '13%'
                          }}>
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          // Filter data first, then calculate totals to ensure consistency
                          const filteredData = industriesData.filter(item =>
                            !industrySearch ||
                            (item.industry__name || '').toLowerCase().includes(industrySearch.toLowerCase())
                          );

                          // Calculate total from filtered data for display, but use sector total for percentages
                          const filteredTotal = filteredData.reduce((sum, item) => sum + (item.count || 0), 0);
                          const sectorTotalCompanies = sectorDetailData.companies || 0;

                          return filteredData
                            .sort((a, b) => {
                              if (industrySortBy === 'count') {
                                const diff = (b.count || 0) - (a.count || 0);
                                return industrySortOrder === 'desc' ? diff : -diff;
                              } else if (industrySortBy === 'total_market_cap') {
                                const diff = (b.total_market_cap || 0) - (a.total_market_cap || 0);
                                return industrySortOrder === 'desc' ? diff : -diff;
                              } else if (industrySortBy === 'percentage') {
                                const percentageA = sectorTotalCompanies > 0 ? ((a.count || 0) / sectorTotalCompanies * 100) : 0;
                                const percentageB = sectorTotalCompanies > 0 ? ((b.count || 0) / sectorTotalCompanies * 100) : 0;
                                const diff = percentageB - percentageA;
                                return industrySortOrder === 'desc' ? diff : -diff;
                              } else {
                                const nameA = (a.industry__name || '').toLowerCase();
                                const nameB = (b.industry__name || '').toLowerCase();
                                const diff = nameA.localeCompare(nameB);
                                return industrySortOrder === 'desc' ? -diff : diff;
                              }
                            })
                            .map((industry, index) => {
                              // Use sector total for percentage calculation (not filtered total)
                              const percentage = sectorTotalCompanies > 0 ? ((industry.count || 0) / sectorTotalCompanies * 100).toFixed(1) : 0;
                              return (
                                <tr
                                  key={index}
                                  onClick={() => handleIndustryClick(industry.industry__name)}
                                  style={{
                                    backgroundColor: '#1e293b',
                                    transition: 'background-color 0.2s',
                                    cursor: 'pointer'
                                  }}
                                  onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#00917C20'}
                                  onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = '#1e293b'}
                                >
                                  <td style={{
                                    padding: '12px',
                                    fontSize: '14px',
                                    color: '#d1d5db',
                                    borderBottom: '1px solid #475569',
                                    width: '35%',
                                    wordWrap: 'break-word'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <div style={{
                                        width: '4px',
                                        height: '20px',
                                        backgroundColor: '#00917C',
                                        borderRadius: '2px',
                                        flexShrink: 0
                                      }}></div>
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {industry.industry__name || 'Unknown'}
                                      </span>
                                    </div>
                                  </td>
                                  <td style={{
                                    padding: '12px',
                                    fontSize: '14px',
                                    color: '#00917C',
                                    fontWeight: '600',
                                    textAlign: 'center',
                                    borderBottom: '1px solid #475569',
                                    width: '15%'
                                  }}>
                                    {formatMarketCap(industry.total_market_cap || 0)}
                                  </td>
                                  <td style={{
                                    padding: '12px',
                                    fontSize: '14px',
                                    color: '#FFCE7B',
                                    fontWeight: '600',
                                    textAlign: 'center',
                                    borderBottom: '1px solid #475569',
                                    width: '12%'
                                  }}>
                                    {formatMarketCap((industry.total_market_cap || 0) * 0.01)}
                                  </td>
                                  <td style={{
                                    padding: '12px',
                                    fontSize: '14px',
                                    color: '#00917C',
                                    fontWeight: '600',
                                    textAlign: 'center',
                                    borderBottom: '1px solid #475569',
                                    width: '13%'
                                  }}>
                                    {industry.count || 0}
                                  </td>
                                  <td style={{
                                    padding: '12px',
                                    fontSize: '14px',
                                    color: '#9ca3af',
                                    textAlign: 'center',
                                    borderBottom: '1px solid #475569',
                                    width: '12%'
                                  }}>
                                    {percentage}%
                                  </td>
                                  <td style={{
                                    padding: '12px',
                                    textAlign: 'center',
                                    borderBottom: '1px solid #475569',
                                    width: '13%'
                                  }}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleIndustryClick(industry.industry__name);
                                      }}
                                      style={{
                                        backgroundColor: '#00917C',
                                        color: 'white',
                                        border: 'none',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      View
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                        })()}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '24px' }}>
                    No industry data available
                  </div>
                )}
                </div>

                {/* Industries Distribution List - Only show when not in full screen */}
                {!isIndustriesFullScreen && (
                <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '8px', border: '1px solid #475569', display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '16px', color: '#d1d5db', marginBottom: '16px', margin: '0 0 16px 0', textAlign: 'center' }}>Industries Distribution</h4>
                  <div style={{
                    flex: 1,
                    minHeight: '400px',
                    overflowY: 'auto'
                  }}>
                    {industriesData && industriesData.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {industriesData
                          .filter(item => !industrySearch || (item.industry__name || '').toLowerCase().includes(industrySearch.toLowerCase()))
                          .sort((a, b) => (b.count || 0) - (a.count || 0))
                          .slice(0, 10)
                          .map((industry, index) => {
                            const totalIndustries = industriesData.reduce((sum, item) => sum + (item.count || 0), 0);
                            const percentage = totalIndustries > 0 ? ((industry.count / totalIndustries) * 100).toFixed(1) : 0;
                            return (
                              <div key={industry.industry__name} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px',
                                backgroundColor: '#334155',
                                borderRadius: '6px',
                                border: '1px solid #475569',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleIndustryClick(industry.industry__name)}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#00917C20'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#334155'}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: index === 0 ? '#00917C' : index === 1 ? '#3b82f6' : index === 2 ? '#FFCE7B' : '#8b5cf6'
                                  }}></div>
                                  <span style={{ fontSize: '14px', color: '#d1d5db', fontWeight: '500' }}>
                                    {industry.industry__name || 'Unknown'}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '14px', color: '#00917C', fontWeight: '600' }}>
                                    {industry.count || 0}
                                  </span>
                                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                                    ({percentage}%)
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                        <div style={{ fontSize: '14px' }}>
                          No industries data available for this sector
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>

              {/* Show Companies Button */}
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={handleShowCompanies}
                  style={{
                    backgroundColor: showSectorCompanies ? '#dc2626' : '#00917C',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FileText style={{ width: '16px', height: '16px' }} />
                  {showSectorCompanies ? 'Hide Companies' : 'Show Companies'}
                </button>
              </div>

              {/* Companies Table */}
              {showSectorCompanies && (
                <CompaniesTable
                  ref={sectorCompaniesRef}
                  companies={sectorCompanies}
                  loading={sectorCompaniesLoading}
                  title={`Companies in ${selectedSector}`}
                  filterOptions={filterOptions}
                  formatMarketCap={formatMarketCap}
                />
              )}

              {/* Original Companies List for reference - remove this */}
              {false && showSectorCompanies && (
                <div style={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', padding: '16px' }}>
                  <h4 style={{ fontSize: '16px', color: '#d1d5db', marginBottom: '16px', margin: '0 0 16px 0' }}>
                    Companies in {selectedSector}
                    {sectorCompaniesLoading && <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>Loading...</span>}
                  </h4>
                  {sectorCompanies.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                      {sectorCompanies.map((company, index) => (
                        <div key={index} style={{
                          backgroundColor: '#1e293b',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '1px solid #475569'
                        }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#d1d5db',
                            marginBottom: '4px'
                          }}>
                            {company.ticker}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#9ca3af',
                            marginBottom: '8px'
                          }}>
                            {company.company_name}
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '11px',
                            color: '#6b7280'
                          }}>
                            <span>Price: {company.price ? `$${company.price}` : 'N/A'}</span>
                            <span>Cap: {formatMarketCap(company.market_cap)}</span>
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: '#6b7280',
                            marginTop: '4px'
                          }}>
                            {company.exchange_name} • {company.industry_name}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !sectorCompaniesLoading ? (
                    <div style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', padding: '24px' }}>
                      No companies found with current filters
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (currentView === 'industry-detail') {
    return (
      <div style={{ width: '100%' }}>
        {/* Header with Back Button */}
        <div style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #475569', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <button
              onClick={handleBackToSector}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #475569',
                color: '#d1d5db',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <ChevronDown style={{ width: '16px', height: '16px', transform: 'rotate(90deg)' }} />
              Back to {selectedSector} Sector
            </button>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#d1d5db', margin: 0 }}>
              {selectedIndustry} Industry
            </h3>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ backgroundColor: '#dc2626', color: 'white', padding: '12px 24px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* Industry Detail Content */}
        <div style={{ padding: '24px' }}>
          {industryDetailLoading ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '48px' }}>
              <div style={{ fontSize: '16px' }}>Loading industry data...</div>
            </div>
          ) : industryDetailData && industryDetailData.industryName ? (
            <div>
              {/* Stats Cards and Globe Map Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #475569', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00917C', marginBottom: '8px' }}>{industryDetailData.companies}</div>
                    <div style={{ fontSize: '14px', color: '#9ca3af' }}>Companies</div>
                  </div>
                  <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #475569', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFCE7B', marginBottom: '8px' }}>{industryDetailData.funds}</div>
                    <div style={{ fontSize: '14px', color: '#9ca3af' }}>Funds</div>
                  </div>
                  <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #475569', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00917C', marginBottom: '8px' }}>{formatMarketCap(industryDetailData.totalMarketCap)}</div>
                    <div style={{ fontSize: '14px', color: '#9ca3af' }}>Total Market Cap</div>
                  </div>
                  <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #475569', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '8px' }}>{formatMarketCap(industryDetailData.totalMarketCap * 0.01)}</div>
                    <div style={{ fontSize: '14px', color: '#9ca3af' }}>1% of Total Market Cap</div>
                  </div>
                  <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #475569', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>{industryDetailData.exchanges || 0}</div>
                    <div style={{ fontSize: '14px', color: '#9ca3af' }}>Exchanges</div>
                  </div>
                  <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #475569', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>{industryDetailData.countries || 0}</div>
                    <div style={{ fontSize: '14px', color: '#9ca3af' }}>Countries</div>
                  </div>
                </div>

                {/* Companies Distribution List */}
                <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '8px', border: '1px solid #475569', display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '16px', color: '#d1d5db', marginBottom: '16px', margin: '0 0 16px 0', textAlign: 'center' }}>Companies Distribution</h4>
                  <div style={{
                    flex: 1,
                    minHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {industryCompanies.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(() => {
                          // Calculate countries from actual companies data
                          const countryCounts = {};
                          industryCompanies.forEach(company => {
                            const country = company.country || 'Unknown';
                            countryCounts[country] = (countryCounts[country] || 0) + 1;
                          });
                          const sortedCountries = Object.entries(countryCounts)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 10);

                          return sortedCountries.map(([country, count], index) => {
                            const percentage = ((count / industryCompanies.length) * 100).toFixed(1);
                            return (
                              <div key={country} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px',
                                backgroundColor: '#334155',
                                borderRadius: '6px',
                                border: '1px solid #475569'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: index === 0 ? '#00917C' : index === 1 ? '#3b82f6' : index === 2 ? '#FFCE7B' : '#8b5cf6'
                                  }}></div>
                                  <span style={{ fontSize: '14px', color: '#d1d5db', fontWeight: '500' }}>
                                    {country}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '14px', color: '#00917C', fontWeight: '600' }}>
                                    {count}
                                  </span>
                                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                                    ({percentage}%)
                                  </span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                        <div style={{ fontSize: '14px' }}>
                          {showIndustryCompanies ? 'No companies data available' : 'Click "Show Companies" to see countries distribution'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Show Companies Button */}
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={handleShowIndustryCompanies}
                  style={{
                    backgroundColor: showIndustryCompanies ? '#dc2626' : '#00917C',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FileText style={{ width: '16px', height: '16px' }} />
                  {showIndustryCompanies ? 'Hide Companies' : 'Show Companies'}
                </button>
              </div>

              {/* Companies Table */}
              {showIndustryCompanies && (
                <CompaniesTable
                  ref={industryCompaniesRef}
                  companies={industryCompanies}
                  loading={industryCompaniesLoading}
                  title={`Companies in ${selectedIndustry}`}
                  filterOptions={filterOptions}
                  formatMarketCap={formatMarketCap}
                />
              )}

              {/* Original Industry Companies List for reference - remove this */}
              {false && showIndustryCompanies && (
                <div style={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', padding: '16px' }}>
                  <h4 style={{ fontSize: '16px', color: '#d1d5db', marginBottom: '16px', margin: '0 0 16px 0' }}>
                    Companies in {selectedIndustry}
                    {industryCompaniesLoading && <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>Loading...</span>}
                  </h4>
                  {industryCompanies.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                      {industryCompanies.map((company, index) => (
                        <div key={index} style={{
                          backgroundColor: '#1e293b',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '1px solid #475569'
                        }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#d1d5db',
                            marginBottom: '4px'
                          }}>
                            {company.ticker}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#9ca3af',
                            marginBottom: '8px'
                          }}>
                            {company.company_name}
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '11px',
                            color: '#6b7280'
                          }}>
                            <span>Price: {company.price ? `$${company.price}` : 'N/A'}</span>
                            <span>Cap: {formatMarketCap(company.market_cap)}</span>
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: '#6b7280',
                            marginTop: '4px'
                          }}>
                            {company.exchange_name}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !industryCompaniesLoading ? (
                    <div style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', padding: '24px' }}>
                      No companies found with current filters
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // Default return for sectors view - this should never be reached due to the first condition
  return null;
};

export default ClassifiersPage;
