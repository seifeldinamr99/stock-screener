import React, { useMemo, useState } from 'react';

const headerCellStyle = {
  padding: '12px',
  textAlign: 'left',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#94a3b8',
  borderBottom: '1px solid #334155'
};

const cellStyle = {
  padding: '10px 12px',
  fontSize: '13px',
  borderBottom: '1px solid #1f2937',
  color: '#e2e8f0'
};

const sortableColumns = [
  { key: 'company_name', label: 'Company' },
  { key: 'relationship_type', label: 'Relationship' },
  { key: 'country', label: 'Country' },
  { key: 'sector', label: 'Sector' },
  { key: 'market_cap_usd', label: 'Market Cap (USD)' }
];

const CompanyTable = ({ data }) => {
  const [sort, setSort] = useState({ key: 'company_name', direction: 'asc' });
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const sortedData = useMemo(() => {
    const items = [...data];
    items.sort((a, b) => {
      const valueA = (a?.[sort.key] || '').toString().toLowerCase();
      const valueB = (b?.[sort.key] || '').toString().toLowerCase();
      if (valueA === valueB) return 0;
      return sort.direction === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    });
    return items;
  }, [data, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (key) => {
    setPage(1);
    setSort((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  return (
    <div
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(71, 85, 105, 0.7)',
        borderRadius: '12px',
        padding: '20px',
        backdropFilter: 'blur(10px)',
        color: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Companies</h3>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          Showing {(currentPage - 1) * pageSize + 1}-
          {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '920px' }}>
          <thead style={{ backgroundColor: '#111c2f' }}>
            <tr>
              {[
                { key: 'company_name', label: 'Company' },
                { key: 'relationship_type', label: 'Relationship' },
                { key: 'ticker', label: 'Ticker' },
                { key: 'exchange', label: 'Exchange' },
                { key: 'market_cap_usd', label: 'Market Cap (USD)' },
                { key: 'country', label: 'Country' },
                { key: 'sector', label: 'Sector' },
                { key: 'industry', label: 'Industry' }
              ].map(({ key, label }) => {
                const isSortable = sortableColumns.some((col) => col.key === key);
                const isActive = sort.key === key;
                return (
                  <th key={key} style={headerCellStyle}>
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: isActive ? '#38bdf8' : '#94a3b8',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {label} {isActive ? (sort.direction === 'asc' ? '↑' : '↓') : ''}
                      </button>
                    ) : (
                      label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ ...cellStyle, textAlign: 'center', padding: '40px' }}>
                  Upload a CSV to populate the Lenovo network.
                </td>
              </tr>
            ) : (
              pageData.map((company, index) => (
                <tr key={`${company.company_name}-${index}`} style={{ backgroundColor: index % 2 ? '#0f172a' : 'transparent' }}>
                  <td style={cellStyle}>{company.company_name || 'N/A'}</td>
                  <td style={cellStyle}>{company.relationship_type || 'N/A'}</td>
                  <td style={cellStyle}>{company.ticker || 'N/A'}</td>
                  <td style={cellStyle}>{company.exchange || 'N/A'}</td>
                  <td style={cellStyle}>{company.market_cap_usd || 'N/A'}</td>
                  <td style={cellStyle}>{company.country || 'N/A'}</td>
                  <td style={cellStyle}>{company.sector || 'N/A'}</td>
                  <td style={cellStyle}>{company.industry || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            color: '#e2e8f0',
            padding: '8px 14px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          Page {currentPage} of {totalPages}
        </div>
        <button
          type="button"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            color: '#e2e8f0',
            padding: '8px 14px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CompanyTable;
