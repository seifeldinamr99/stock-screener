import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../utils/constants';
import { parseMarketCapFilter } from '../utils/formatters';

const initialSectorDetail = {
  sectorName: '',
  companies: 0,
  industries: 0,
  funds: 0,
  totalMarketCap: 0,
  exchanges: 0,
  countries: 0,
  countryBreakdown: []
};

const initialIndustryDetail = {
  industryName: '',
  sectorName: '',
  companies: 0,
  funds: 0,
  totalMarketCap: 0,
  exchanges: 0,
  countries: 0
};

const useClassifierData = (datasetKey = 'classifier') => {
  const [filterOptions, setFilterOptions] = useState({
    exchanges: [],
    sectors: [],
    industries: []
  });

  const [sectorsData, setSectorsData] = useState([]);
  const [sectorIndustries, setSectorIndustries] = useState([]);

  const [sectorDetailData, setSectorDetailData] = useState(initialSectorDetail);
  const [industryDetailData, setIndustryDetailData] = useState(initialIndustryDetail);

  const [sectorCompanies, setSectorCompanies] = useState([]);
  const [industryCompanies, setIndustryCompanies] = useState([]);

  const [industriesData, setIndustriesData] = useState([]);

  const [error, setError] = useState('');

  const [sectorsLoading, setSectorsLoading] = useState(false);
  const [sectorDetailLoading, setSectorDetailLoading] = useState(false);
  const [industriesLoading, setIndustriesLoading] = useState(false);
  const [sectorCompaniesLoading, setSectorCompaniesLoading] = useState(false);
  const [industryDetailLoading, setIndustryDetailLoading] = useState(false);
  const [industryCompaniesLoading, setIndustryCompaniesLoading] = useState(false);

  const loadFilterOptions = useCallback(async () => {
    setSectorsLoading(true);
    try {
      const params = new URLSearchParams();
      if (datasetKey) {
        params.append('dataset', datasetKey);
      }
      const response = await fetch(`${API_BASE_URL}/stocks/filter_options/?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load filter options');
      }
      const data = await response.json();
      setFilterOptions(data);
      setError('');
    } catch (err) {
      console.error('Error fetching filter options:', err);
      setError('Error fetching filter options');
    } finally {
      setSectorsLoading(false);
    }
  }, [datasetKey]);

  const loadSectorsData = useCallback(async (exchangeCode = '') => {
    setSectorsLoading(true);
    try {
      const params = new URLSearchParams();
      if (exchangeCode) {
        params.append('exchange', exchangeCode);
      }
      if (datasetKey) {
        params.append('dataset', datasetKey);
      }

      const response = await fetch(`${API_BASE_URL}/stocks/sector-industry-counts/?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load sectors');
      }

      const sectorsArray = await response.json();
      setSectorsData(sectorsArray);
      setError('');
    } catch (err) {
      console.error('Error building sectors data:', err);
      setError('Error building sectors data');
      setSectorsData([]);
    } finally {
      setSectorsLoading(false);
    }
  }, [datasetKey]);

  const loadSectorIndustries = useCallback(async (sectorName) => {
    try {
      const params = new URLSearchParams();
      if (datasetKey) {
        params.append('dataset', datasetKey);
      }
      const response = await fetch(
        `${API_BASE_URL}/sectors/${encodeURIComponent(sectorName)}/industries/?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to load industries');
      }
      const data = await response.json();
      setSectorIndustries(data.industries || []);
      setError('');
    } catch (err) {
      console.error('Error fetching sector industries:', err);
      setSectorIndustries([]);
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setError(`Failed to load industries for ${sectorName}. Please try again.`);
      }
    }
  }, [datasetKey]);

  const loadSectorDetail = useCallback(async (sectorName, filters = {}) => {
    setSectorDetailLoading(true);
    setIndustriesLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('sector', sectorName);

      if (filters.exchange) params.append('exchange', filters.exchange);

      const marketCapParams = parseMarketCapFilter(
        filters.marketCapMin,
        filters.marketCapMax,
        filters.marketCapMinUnit,
        filters.marketCapMaxUnit
      );
      if (marketCapParams.market_cap_min) params.append('market_cap_min', marketCapParams.market_cap_min.toString());
      if (marketCapParams.market_cap_max) params.append('market_cap_max', marketCapParams.market_cap_max.toString());

      params.append('include_companies', 'true');
      if (datasetKey) {
        params.append('dataset', datasetKey);
      }

      const response = await fetch(`${API_BASE_URL}/filtered-stats/?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to load data for ${sectorName}`);
      }

      const data = await response.json();

      const countryBreakdown = Array.isArray(data.country_breakdown) ? data.country_breakdown : [];

      const sectorData = {
        sectorName,
        companies: data.total_companies,
        industries: data.unique_industries,
        funds: Math.ceil((data.total_companies || 0) / 20),
        totalMarketCap: data.total_market_cap || 0,
        exchanges: data.unique_exchanges || 0,
        countries: countryBreakdown.length,
        countryBreakdown
      };

      setSectorDetailData(sectorData);
      setIndustriesData(data.industry_breakdown || []);
      setError('');
    } catch (err) {
      console.error('Error fetching sector detail data:', err);
      setError('Error fetching sector detail data');
      setSectorDetailData(initialSectorDetail);
      setIndustriesData([]);
    } finally {
      setSectorDetailLoading(false);
      setIndustriesLoading(false);
    }
  }, [datasetKey]);

  const loadSectorCompanies = useCallback(async (sectorName, filters = {}) => {
    setSectorCompaniesLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('sector', sectorName);
      params.append('page_size', '5000');

      if (filters.exchange) params.append('exchange', filters.exchange);
      if (filters.industry) params.append('industry', filters.industry);

      const marketCapParams = parseMarketCapFilter(
        filters.marketCapMin,
        filters.marketCapMax,
        filters.marketCapMinUnit,
        filters.marketCapMaxUnit
      );
      if (marketCapParams.market_cap_min) params.append('market_cap_min', marketCapParams.market_cap_min.toString());
      if (marketCapParams.market_cap_max) params.append('market_cap_max', marketCapParams.market_cap_max.toString());

      params.append('include_companies', 'true');
      if (datasetKey) {
        params.append('dataset', datasetKey);
      }

      const response = await fetch(`${API_BASE_URL}/filtered-stats/?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load sector companies');
      }

      const data = await response.json();
      const companies = data.companies || [];
      setSectorCompanies(companies);

      const countryBreakdown = Array.isArray(data.country_breakdown) ? data.country_breakdown : [];
      setSectorDetailData((prev) => ({
        ...prev,
        countries: countryBreakdown.length,
        countryBreakdown
      }));
      setError('');
    } catch (err) {
      console.error('Error fetching sector companies:', err);
      setError('Error fetching sector companies');
      setSectorCompanies([]);
    } finally {
      setSectorCompaniesLoading(false);
    }
  }, [datasetKey]);

  const loadIndustryDetail = useCallback(async (sectorName, industryName, filters = {}) => {
    setIndustryDetailLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('sector', sectorName);
      params.append('industry', industryName);

      if (filters.exchange) params.append('exchange', filters.exchange);

      const marketCapParams = parseMarketCapFilter(
        filters.marketCapMin,
        filters.marketCapMax,
        filters.marketCapMinUnit,
        filters.marketCapMaxUnit
      );
      if (marketCapParams.market_cap_min) params.append('market_cap_min', marketCapParams.market_cap_min.toString());
      if (marketCapParams.market_cap_max) params.append('market_cap_max', marketCapParams.market_cap_max.toString());

      params.append('include_companies', 'true');
      if (datasetKey) {
        params.append('dataset', datasetKey);
      }

      const response = await fetch(`${API_BASE_URL}/filtered-stats/?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load industry detail data');
      }

      const data = await response.json();
      let countriesCount = 0;
      if (data.companies && Array.isArray(data.companies)) {
        const uniqueCountries = new Set(
          data.companies.map((company) => company.country).filter(Boolean)
        );
        countriesCount = uniqueCountries.size;
      }

      setIndustryDetailData({
        industryName,
        sectorName,
        companies: data.total_companies,
        funds: Math.ceil((data.total_companies || 0) / 20),
        totalMarketCap: data.total_market_cap || 0,
        exchanges: data.unique_exchanges || 0,
        countries: countriesCount
      });
      setError('');
    } catch (err) {
      console.error('Error fetching industry detail data:', err);
      setError('Error fetching industry detail data');
      setIndustryDetailData(initialIndustryDetail);
    } finally {
      setIndustryDetailLoading(false);
    }
  }, [datasetKey]);

  const loadIndustryCompanies = useCallback(async (sectorName, industryName, filters = {}) => {
    setIndustryCompaniesLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('sector', sectorName);
      params.append('industry', industryName);
      params.append('page_size', '5000');

      if (filters.exchange) params.append('exchange', filters.exchange);

      const marketCapParams = parseMarketCapFilter(
        filters.marketCapMin,
        filters.marketCapMax,
        filters.marketCapMinUnit,
        filters.marketCapMaxUnit
      );
      if (marketCapParams.market_cap_min) params.append('market_cap_min', marketCapParams.market_cap_min.toString());
      if (marketCapParams.market_cap_max) params.append('market_cap_max', marketCapParams.market_cap_max.toString());

      params.append('include_companies', 'true');
      if (datasetKey) {
        params.append('dataset', datasetKey);
      }

      const response = await fetch(`${API_BASE_URL}/filtered-stats/?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load industry companies');
      }

      const data = await response.json();
      setIndustryCompanies(data.companies || []);
      setError('');
    } catch (err) {
      console.error('Error fetching industry companies:', err);
      setError('Error fetching industry companies');
      setIndustryCompanies([]);
    } finally {
      setIndustryCompaniesLoading(false);
    }
  }, [datasetKey]);

  const resetSectorData = useCallback(() => {
    setSectorDetailData(initialSectorDetail);
    setIndustriesData([]);
    setSectorCompanies([]);
    setSectorIndustries([]);
  }, []);

  const resetIndustryData = useCallback(() => {
    setIndustryDetailData(initialIndustryDetail);
    setIndustryCompanies([]);
  }, []);

  return {
    filterOptions,
    sectorsData,
    sectorsLoading,
    sectorIndustries,
    sectorDetailData,
    sectorDetailLoading,
    industriesData,
    industriesLoading,
    sectorCompanies,
    sectorCompaniesLoading,
    industryDetailData,
    industryDetailLoading,
    industryCompanies,
    industryCompaniesLoading,
    error,
    setError,
    loadFilterOptions,
    loadSectorsData,
    loadSectorIndustries,
    loadSectorDetail,
    loadSectorCompanies,
    loadIndustryDetail,
    loadIndustryCompanies,
    resetSectorData,
    resetIndustryData
  };
};

export default useClassifierData;
