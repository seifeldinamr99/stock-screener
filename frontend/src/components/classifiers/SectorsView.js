import React from 'react';
import { Folder, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const SectorsView = ({
  filterOptions,
  selectedExchange,
  onExchangeChange,
  sectorsData,
  loading,
  error,
  onSectorSelect,
  title = 'Market Classifications',
  emptyStateMessage = 'No sectors available'
}) => {
  const totalCompanies = sectorsData.reduce(
    (sum, sector) => sum + (sector.total_companies || 0),
    0
  );

  return (
    <div style={{ width: '100%' }}>
      <div style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #475569', padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#d1d5db', margin: 0 }}>
            {title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <label style={{ color: '#d1d5db', fontSize: '14px' }}>Exchange:</label>
            <select
              value={selectedExchange}
              onChange={(event) => onExchangeChange(event.target.value)}
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
              {filterOptions.exchanges.map((exchange) => (
                <option key={exchange.id} value={exchange.code}>
                  {exchange.name} ({exchange.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedExchange && (
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>
            Showing classifications for:{' '}
            {filterOptions.exchanges.find((exchange) => exchange.code === selectedExchange)?.name ||
              selectedExchange}
          </div>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      <div style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '48px' }}>
            <LoadingSpinner text="Loading sectors..." />
          </div>
        ) : sectorsData.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '48px' }}>
            <div style={{ fontSize: '16px' }}>{emptyStateMessage}</div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px'
            }}
          >
            {sectorsData.map((sector) => (
              <div
                key={sector.name}
                onClick={() => onSectorSelect(sector.name)}
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
                onMouseEnter={(event) => {
                const card = event.currentTarget;
                card.style.borderColor = '#00917C';
                }}
                onMouseLeave={(event) => {
                  const card = event.currentTarget;
                  card.style.borderColor = '#475569';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Folder style={{ width: '24px', height: '24px', color: '#00917C' }} />
                  <h4 style={{ fontSize: '18px', fontWeight: 600, color: 'white', margin: 0 }}>
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

      {!loading && sectorsData.length > 0 && (
        <div
          style={{
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
          }}
        >
          <span>Total: {sectorsData.length} sectors with {totalCompanies} companies</span>
          <span style={{ color: '#9ca3af' }}>Click sectors to navigate to detailed analytics</span>
        </div>
      )}
    </div>
  );
};

export default SectorsView;
