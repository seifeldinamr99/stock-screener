import React, { useMemo, useState } from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import ClassifierFilters from './ClassifierFilters';
import CompaniesTable from '../../CompaniesTable';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const sortOptions = [
  { value: 'count-desc', label: 'Most Companies' },
  { value: 'count-asc', label: 'Least Companies' },
  { value: 'total_market_cap-desc', label: 'Highest Market Cap' },
  { value: 'total_market_cap-asc', label: 'Lowest Market Cap' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' }
];

const SectorDetailView = ({
  sectorName,
  sectorFilters,
  onFilterChange,
  filterOptions,
  sectorIndustries,
  detail,
  detailLoading,
  industries = [],
  industriesLoading,
  error,
  onBack,
  onIndustryClick,
  showCompanies,
  onToggleCompanies,
  companies = [],
  companiesLoading,
  companiesRef,
  formatMarketCap,
  onCompanyClick,
}) => {
  const [industrySearch, setIndustrySearch] = useState('');
  const [sortOption, setSortOption] = useState('count-desc');
  const countryBreakdown = Array.isArray(detail?.countryBreakdown) ? detail.countryBreakdown : [];
  const totalCountryCount = countryBreakdown.reduce((sum, item) => sum + (item.count || 0), 0);
  const hasCountryBreakdown = countryBreakdown.length > 0;

  const sortConfig = useMemo(() => {
    const [by, order] = sortOption.split('-');
    return { by, order };
  }, [sortOption]);

  const filteredIndustries = useMemo(() => {
    const query = industrySearch.trim().toLowerCase();
    return industries.filter((industry) => {
      const name = industry.industry__name || industry.name || 'Unknown';
      return !query || name.toLowerCase().includes(query);
    });
  }, [industries, industrySearch]);

  const sortedIndustries = useMemo(() => {
    const items = [...filteredIndustries];
    const { by, order } = sortConfig;

    const compare = (a, b) => {
      const direction = order === 'asc' ? 1 : -1;
      if (by === 'name') {
        const nameA = (a.industry__name || a.name || 'Unknown').toLowerCase();
        const nameB = (b.industry__name || b.name || 'Unknown').toLowerCase();
        return nameA.localeCompare(nameB) * direction;
      }

      const valueA = by === 'total_market_cap' ? (a.total_market_cap || 0) : (a.count || 0);
      const valueB = by === 'total_market_cap' ? (b.total_market_cap || 0) : (b.count || 0);
      if (valueA === valueB) {
        const nameA = (a.industry__name || a.name || 'Unknown').toLowerCase();
        const nameB = (b.industry__name || b.name || 'Unknown').toLowerCase();
        return nameA.localeCompare(nameB) * direction;
      }
      return valueA > valueB ? direction : -direction;
    };

    items.sort(compare);
    return items;
  }, [filteredIndustries, sortConfig]);

  const statsCards = [
    { label: 'Companies', value: detail.companies || 0, color: '#00FFDA' },
    { label: 'Industries', value: detail.industries || 0, color: '#00FFDA' },
    { label: 'Funds', value: detail.funds || 0, color: '#00FFDA' },
    { label: 'Exchanges', value: detail.exchanges || 0, color: '#00FFDA' },
    { label: 'Countries', value: detail.countries || 0, color: '#00FFDA' }
  ];

  const handleSortSelect = (event) => {
    setSortOption(event.target.value);
  };

  const handleHeaderSort = (field) => {
    setSortOption((prev) => {
      const [currentField, currentOrder] = prev.split('-');
      if (currentField === field) {
        return `${field}-${currentOrder === 'asc' ? 'desc' : 'asc'}`;
      }
      return `${field}-desc`;
    });
  };

  return (
    <div style={{ width: '100%', backgroundColor: '#0f172a', color: 'white', minHeight: '100vh' }}>
      <div style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #475569', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={onBack}
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
          <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#d1d5db', margin: 0 }}>
            {sectorName} Sector
          </h3>
        </div>

        <ClassifierFilters
          sectorFilters={sectorFilters}
          onFilterChange={onFilterChange}
          filterOptions={filterOptions}
          sectorIndustries={sectorIndustries.map((industry) => ({
            id: industry.id,
            name: industry.name
          }))}
          showIndustryFilter={true}
        />
      </div>

      {error && <div style={{ padding: '0 24px' }}><ErrorMessage message={error} /></div>}

      <div style={{ padding: '24px' }}>
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <LoadingSpinner text="Loading sector data..." />
          </div>
        ) : (
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '16px'
            }}>
              {statsCards.map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#d1d5db', textTransform: 'uppercase' }}>{stat.label}</span>
                  <span style={{ fontSize: '24px', fontWeight: 600, color: stat.color }}>{stat.value}</span>
                </div>
              ))}
              <div
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '12px', color: '#d1d5db', textTransform: 'uppercase' }}>Total Market Cap</span>
                <span style={{ fontSize: '24px', fontWeight: 600, color: '#00FFDA' }}>
                  {formatMarketCap(detail.totalMarketCap || 0)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #475569',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '16px', color: '#d1d5db', margin: 0, flexGrow: 1 }}>
              Industries in {sectorName} Sector ({industries.length})
              {industriesLoading && (
                <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>Loading...</span>
              )}
            </h4>
            <input
              type="text"
              value={industrySearch}
              placeholder="Search industries..."
              onChange={(event) => setIndustrySearch(event.target.value)}
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
              value={sortOption}
              onChange={handleSortSelect}
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                color: 'white',
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '4px'
              }}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {industriesLoading ? (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <LoadingSpinner text="Loading industries..." />
            </div>
          ) : sortedIndustries.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
              No industries data available for this sector.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: hasCountryBreakdown ? 'minmax(0, 2fr) minmax(0, 1fr)' : '1fr',
              gap: '24px'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
                  <thead style={{ backgroundColor: '#273549' }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#9ca3af', borderBottom: '1px solid #475569' }}>
                        Industry Name
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#9ca3af', borderBottom: '1px solid #475569' }}>
                        <button
                          onClick={() => handleHeaderSort('total_market_cap')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            background: 'none',
                            border: 'none',
                            color: 'inherit',
                            cursor: 'pointer'
                          }}
                        >
                          Market Cap
                        </button>
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#9ca3af', borderBottom: '1px solid #475569' }}>
                        1%
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#9ca3af', borderBottom: '1px solid #475569' }}>
                        <button
                          onClick={() => handleHeaderSort('count')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            background: 'none',
                            border: 'none',
                            color: 'inherit',
                            cursor: 'pointer'
                          }}
                        >
                          Companies
                        </button>
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#9ca3af', borderBottom: '1px solid #475569' }}>
                        Funds
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedIndustries.map((industry) => {
                      const name = industry.industry__name || industry.name || 'Unknown';
                      const companiesCount = industry.count || 0;
                      return (
                        <tr
                          key={name}
                          onClick={() => onIndustryClick(name)}
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.backgroundColor = '#334155';
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <td style={{ padding: '12px', borderBottom: '1px solid #475569' }}>
                            <span style={{ color: 'white', fontWeight: 500 }}>{name}</span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #475569', color: '#FFFFFF' }}>
                            {formatMarketCap(industry.total_market_cap || 0)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #475569', color: '#FFCE7B' }}>
                            {formatMarketCap((industry.total_market_cap || 0) * 0.01)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #475569', color: '#FFFFFF', fontWeight: 600 }}>
                            {companiesCount}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #475569', color: '#FFFFFF' }}>
                            {Math.ceil(companiesCount / 20)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {hasCountryBreakdown && (
                <div style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  padding: '16px',
                  minHeight: '100%'
                }}>
                  <h4 style={{ fontSize: '16px', color: '#d1d5db', margin: '0 0 16px 0' }}>
                    Countries Distribution
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                    {countryBreakdown.map((item, index) => {
                      const country = item.country || 'Unknown';
                      const count = item.count || 0;
                      const percentage = totalCountryCount ? ((count / totalCountryCount) * 100).toFixed(1) : '0.0';
                      return (
                        <div
                          key={`${country}-${index}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px',
                            backgroundColor: '#334155',
                            borderRadius: '6px',
                            border: '1px solid #475569'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#00917C'
                            }} />
                            <span style={{ fontSize: '14px', color: '#d1d5db', fontWeight: 500 }}>
                              {country}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: 600 }}>
                              {count}
                            </span>
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                              ({percentage}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: '16px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
                    Total: {totalCountryCount} companies across {countryBreakdown.length} countries
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={onToggleCompanies}
            style={{
              backgroundColor: showCompanies ? '#dc2626' : '#00917C',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FileText style={{ width: '16px', height: '16px' }} />
            {showCompanies ? 'Hide Companies' : 'Show Companies'}
          </button>
        </div>

        {showCompanies && (
          <CompaniesTable
            ref={companiesRef}
            companies={companies}
            loading={companiesLoading}
            title={`Companies in ${sectorName}`}
            filterOptions={filterOptions}
            formatMarketCap={formatMarketCap}
            onCompanyClick={onCompanyClick}
          />
        )}
      </div>
    </div>
  );
};

export default SectorDetailView;

