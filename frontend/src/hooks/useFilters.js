import { useState } from 'react';

export const useFilters = (initialFilters = {}) => {
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
    marketCapMaxUnit: 'M',
    ...initialFilters
  });

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
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
  };

  return {
    filters,
    setFilters,
    handleFilterChange,
    resetFilters
  };
};