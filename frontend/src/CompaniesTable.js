import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';

const CompaniesTable = React.forwardRef(({
  companies,
  loading,
  title,
  filterOptions,
  formatMarketCap,
  onCompanyClick,
}, ref) => {
  const [sortBy, setSortBy] = useState('market_cap');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({
    exchange: '',
    country: '',
    marketCapMin: '',
    marketCapMax: '',
    marketCapMinUnit: 'M',
    marketCapMaxUnit: 'M'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Save filtered companies to CSV
  const saveFilteredCompanies = () => {
    if (allFilteredCompanies.length === 0) {
      alert('No companies to save with current filters');
      return;
    }

    // Create CSV content
    const headers = [
      'Ticker', 'Company Name', 'Price', 'Market Cap', 'P/E Ratio', 'Health Label',
      'Exchange', 'Country'
    ];

    const csvContent = [
      headers.join(','),
      ...allFilteredCompanies.map(company => [
        company.ticker || 'N/A',
        `"${company.company_name || 'N/A'}"`,
        company.price ? `$${parseFloat(company.price).toFixed(2)}` : 'N/A',
        formatMarketCap(company.market_cap),
        company.pe_ratio ? parseFloat(company.pe_ratio).toFixed(2) : 'N/A',
        company.health_label || 'N/A',
        company.exchange_name || 'N/A',
        company.country || 'N/A'
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `filtered_companies_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return <ChevronUp style={{ width: '16px', height: '16px', color: '#6b7280', opacity: 0.3 }} />;
    }
    return sortOrder === 'asc' ?
      <ChevronDown style={{ width: '16px', height: '16px', color: '#00FFDA' }} /> :
      <ChevronUp style={{ width: '16px', height: '16px', color: '#00FFDA' }} />;
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filterAndSortCompanies = (companies) => {
    let filtered = companies.filter(company => {
      if (filters.exchange && company.exchange_name !== filters.exchange) return false;
      if (filters.country && company.country !== filters.country) return false;

      if (filters.marketCapMin) {
        const minCap = parseFloat(filters.marketCapMin) * (filters.marketCapMinUnit === 'B' ? 1000000000 : 1000000);
        if ((company.market_cap || 0) < minCap) return false;
      }

      if (filters.marketCapMax) {
        const maxCap = parseFloat(filters.marketCapMax) * (filters.marketCapMaxUnit === 'B' ? 1000000000 : 1000000);
        if ((company.market_cap || 0) > maxCap) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
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
        case 'pe_ratio':
          aVal = parseFloat(a.pe_ratio) || 0;
          bVal = parseFloat(b.pe_ratio) || 0;
          break;
        case 'health_label':
          aVal = a.health_label || '';
          bVal = b.health_label || '';
          break;
        default:
          aVal = a.market_cap || 0;
          bVal = b.market_cap || 0;
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });

    return filtered;
  };

  const allFilteredCompanies = filterAndSortCompanies(companies);

  // Pagination logic
  const totalPages = Math.ceil(allFilteredCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const filteredCompanies = allFilteredCompanies.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  return (
    <>
      <div ref={ref} style={{ display: 'flex', gap: '16px', width: '100%' }}>
        {/* Companies Table - Left Half */}
        <div style={{ flex: '1', minWidth: '0' }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '16px', color: '#d1d5db', margin: 0 }}>
                {title}
                {loading && <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>Loading...</span>}
              </h4>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={saveFilteredCompanies}
                  style={{
                    background: '#00917C',
                    border: 'none',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#059669';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#00917C';
                  }}
                  title={`Save ${allFilteredCompanies.length} filtered companies to CSV`}
                >
                  <Download style={{ width: '14px', height: '14px' }} />
                  Save ({allFilteredCompanies.length})
                </button>
              </div>
            </div>

            {/* Filters */}
            <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'end' }}>
              <div>
                <label style={{ color: '#d1d5db', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Exchange</label>
                <select
                  value={filters.exchange}
                  onChange={(e) => setFilters({...filters, exchange: e.target.value})}
                  style={{ backgroundColor: '#334155', border: '1px solid #475569', color: 'white', padding: '6px 8px', fontSize: '12px', borderRadius: '4px' }}
                >
                  <option value="">All Exchanges</option>
                  {filterOptions.exchanges.map(exchange => (
                    <option key={exchange.code} value={exchange.name}>{exchange.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: '#d1d5db', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Country</label>
                <select
                  value={filters.country}
                  onChange={(e) => setFilters({...filters, country: e.target.value})}
                  style={{ backgroundColor: '#334155', border: '1px solid #475569', color: 'white', padding: '6px 8px', fontSize: '12px', borderRadius: '4px' }}
                >
                  <option value="">All Countries</option>
                  {[...new Set(companies.map(c => c.country).filter(Boolean))].sort().map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: '#d1d5db', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Market Cap Range</label>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder="From"
                    value={filters.marketCapMin}
                    onChange={(e) => setFilters({...filters, marketCapMin: e.target.value})}
                    style={{ backgroundColor: '#334155', border: '1px solid #475569', color: 'white', padding: '6px 8px', fontSize: '12px', borderRadius: '4px', width: '60px' }}
                  />
                  <select
                    value={filters.marketCapMinUnit}
                    onChange={(e) => setFilters({...filters, marketCapMinUnit: e.target.value})}
                    style={{ backgroundColor: '#334155', border: '1px solid #475569', color: 'white', padding: '6px 8px', fontSize: '12px', borderRadius: '4px' }}
                  >
                    <option value="M">M</option>
                    <option value="B">B</option>
                  </select>
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>to</span>
                  <input
                    type="number"
                    placeholder="To"
                    value={filters.marketCapMax}
                    onChange={(e) => setFilters({...filters, marketCapMax: e.target.value})}
                    style={{ backgroundColor: '#334155', border: '1px solid #475569', color: 'white', padding: '6px 8px', fontSize: '12px', borderRadius: '4px', width: '60px' }}
                  />
                  <select
                    value={filters.marketCapMaxUnit}
                    onChange={(e) => setFilters({...filters, marketCapMaxUnit: e.target.value})}
                    style={{ backgroundColor: '#334155', border: '1px solid #475569', color: 'white', padding: '6px 8px', fontSize: '12px', borderRadius: '4px' }}
                  >
                    <option value="M">M</option>
                    <option value="B">B</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table Content */}
            {companies.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
                  <thead style={{ backgroundColor: '#273549', position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#9ca3af', borderBottom: '1px solid #475569' }}>
                        <button
                          onClick={() => handleSort('ticker')}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '4px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '12px', fontWeight: '500', textTransform: 'uppercase' }}
                        >
                          TICKER {getSortIcon('ticker')}
                        </button>
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#9ca3af', borderBottom: '1px solid #475569' }}>
                        <button
                          onClick={() => handleSort('company_name')}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '4px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '12px', fontWeight: '500', textTransform: 'uppercase' }}
                        >
                          COMPANY NAME {getSortIcon('company_name')}
                        </button>
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#9ca3af', borderBottom: '1px solid #475569', width: '100px' }}>
                        <button
                          onClick={() => handleSort('price')}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', width: '100%' }}
                        >
                          PRICE {getSortIcon('price')}
                        </button>
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#9ca3af', borderBottom: '1px solid #475569', width: '120px' }}>
                        <button
                          onClick={() => handleSort('market_cap')}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', width: '100%' }}
                        >
                          MARKET CAP {getSortIcon('market_cap')}
                        </button>
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#9ca3af', borderBottom: '1px solid #475569', width: '80px' }}>
                        <button
                          onClick={() => handleSort('pe_ratio')}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', width: '100%' }}
                        >
                          P/E {getSortIcon('pe_ratio')}
                        </button>
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#9ca3af', borderBottom: '1px solid #475569', width: '120px' }}>
                        <button
                          onClick={() => handleSort('health_label')}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', width: '100%' }}
                        >
                          HEALTH {getSortIcon('health_label')}
                        </button>
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#9ca3af', borderBottom: '1px solid #475569', width: '100px' }}>
                        <button
                          onClick={() => handleSort('exchange')}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', width: '100%' }}
                        >
                          EXCHANGE {getSortIcon('exchange')}
                        </button>
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#9ca3af', borderBottom: '1px solid #475569', width: '100px' }}>
                        <button
                          onClick={() => handleSort('country')}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', width: '100%' }}
                        >
                          COUNTRY {getSortIcon('country')}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.map((company, index) => {
                      const isInteractive = Boolean(onCompanyClick);
                      return (
                        <tr
                          key={company.ticker || index}
                          style={{
                            transition: 'background-color 0.2s',
                            cursor: isInteractive ? 'pointer' : 'default'
                          }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.backgroundColor = '#334155';
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          onClick={isInteractive ? () => onCompanyClick(company) : undefined}
                        >
                        <td style={{ padding: '12px', fontSize: '14px', color: '#00FFDA', fontWeight: '600', borderBottom: '1px solid #475569' }}>
                          {company.ticker || 'N/A'}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#d1d5db', borderBottom: '1px solid #475569' }}>
                          {company.company_name || 'N/A'}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#d1d5db', textAlign: 'center', borderBottom: '1px solid #475569' }}>
                          {company.price ? `$${parseFloat(company.price).toFixed(2)}` : 'N/A'}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#00FFDA', fontWeight: '600', textAlign: 'center', borderBottom: '1px solid #475569' }}>
                          {formatMarketCap(company.market_cap)}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#d1d5db', textAlign: 'center', borderBottom: '1px solid #475569' }}>
                          {company.pe_ratio ? parseFloat(company.pe_ratio).toFixed(2) : 'N/A'}
                        </td>
                        <td style={{
                          padding: '12px',
                          fontSize: '14px',
                          color: '#d1d5db',
                          fontWeight: '600',
                          textAlign: 'center',
                          borderBottom: '1px solid #475569'
                        }}>
                          {company.health_label || 'N/A'}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#d1d5db', textAlign: 'center', borderBottom: '1px solid #475569' }}>
                          {company.exchange_name || 'N/A'}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#d1d5db', textAlign: 'center', borderBottom: '1px solid #475569' }}>
                          {company.country || 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    Showing {startIndex + 1}-{Math.min(endIndex, allFilteredCompanies.length)} of {allFilteredCompanies.length} companies
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '12px', color: '#9ca3af' }}>Rows per page:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(parseInt(e.target.value));
                        setCurrentPage(1);
                      }}
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
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: currentPage === 1 ? '#475569' : '#00917C',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Previous
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {/* Show page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            style={{
                              padding: '8px 12px',
                              backgroundColor: currentPage === pageNum ? '#00917C' : 'transparent',
                              color: currentPage === pageNum ? 'white' : '#d1d5db',
                              border: '1px solid #475569',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              minWidth: '36px'
                            }}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: currentPage === totalPages ? '#475569' : '#00917C',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', padding: '24px' }}>
                {loading ? 'Loading companies...' : 'No companies found.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});

CompaniesTable.displayName = 'CompaniesTable';

export default CompaniesTable;
