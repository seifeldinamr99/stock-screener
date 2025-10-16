import React from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import CompaniesTable from '../../CompaniesTable';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import BuildFundsCTA from './BuildFundsCTA';

const IndustryDetailView = ({
  sectorName,
  industryName,
  detail,
  detailLoading,
  sectorFilters,
  filterOptions,
  showCompanies,
  onToggleCompanies,
  onBuildFunds,
  companies = [],
  companiesLoading,
  companiesRef,
  formatMarketCap,
  onBackToSector,
  error,
  onCompanyClick,
}) => {
  const totalMarketCap = detail.totalMarketCap || 0;
  const statsCards = [
    { label: 'Companies', value: detail.companies || 0, formatter: (val) => val },
    { label: 'Funds', value: detail.funds || 0, formatter: (val) => val },
    { label: 'Total Market Cap', value: totalMarketCap, formatter: formatMarketCap },
    { label: '1%', value: totalMarketCap * 0.01, formatter: formatMarketCap },
    { label: 'Exchanges', value: detail.exchanges || 0, formatter: (val) => val },
    { label: 'Countries', value: detail.countries || 0, formatter: (val) => val }
  ];

  return (
    <div style={{ width: '100%', backgroundColor: '#0f172a', color: 'white', minHeight: '100vh' }}>
      <div style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #475569', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <button
            onClick={onBackToSector}
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
            Back to Sector
          </button>
          <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#d1d5db', margin: 0 }}>
            {industryName} ({sectorName})
          </h3>
        </div>
        <div style={{ color: '#9ca3af', fontSize: '13px' }}>
          Exchange: {sectorFilters.exchange || 'All'}
        </div>
      </div>

      {error && <div style={{ padding: '0 24px' }}><ErrorMessage message={error} /></div>}

      <div style={{ padding: '24px' }}>
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <LoadingSpinner text="Loading industry data..." />
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
                  <span style={{ fontSize: '24px', fontWeight: 600, color: stat.label === '1%' ? '#FFCE7B' : '#00FFDA' }}>
                    {stat.formatter(stat.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <BuildFundsCTA onClick={onBuildFunds} disabled={!onBuildFunds} />
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
            title={`Companies in ${industryName}`}
            filterOptions={filterOptions}
            formatMarketCap={formatMarketCap}
            onCompanyClick={onCompanyClick}
          />
        )}
      </div>
    </div>
  );
};

export default IndustryDetailView;

