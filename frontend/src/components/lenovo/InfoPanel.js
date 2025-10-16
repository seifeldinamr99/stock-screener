import React from 'react';

const labelStyle = {
  fontSize: '12px',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.06em'
};

const valueStyle = {
  fontSize: '14px',
  color: '#e2e8f0',
  fontWeight: 500
};

const InfoPanel = ({ company, onClose }) => {
  if (!company) return null;

  const rows = [
    { label: 'Company', value: company.company_name || 'N/A' },
    { label: 'Relationship', value: company.relationship_type || 'N/A' },
    { label: 'Ticker', value: company.ticker || 'N/A' },
    { label: 'Exchange', value: company.exchange || 'N/A' },
    { label: 'Market Cap (USD)', value: company.market_cap_usd || 'N/A' },
    { label: 'Country', value: company.country || 'N/A' },
    { label: 'Sector', value: company.sector || 'N/A' },
    { label: 'Industry', value: company.industry || 'N/A' },
    { label: 'Website', value: company.website || '' },
    { label: 'Notes', value: company.notes || '' }
  ];

  return (
    <div
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(71, 85, 105, 0.7)',
        borderRadius: '12px',
        padding: '20px',
        color: '#e2e8f0',
        backdropFilter: 'blur(10px)',
        maxWidth: '320px',
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#38bdf8' }}>
          {company.company_name || 'Company Details'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {rows.map(({ label, value }) => {
          if (!value) return null;
          const isLink = label === 'Website' && value && value !== 'N/A';
          return (
            <div key={label}>
              <div style={labelStyle}>{label}</div>
              <div style={valueStyle}>
                {isLink ? (
                  <a
                    href={value.startsWith('http') ? value : `https://${value}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#38bdf8', textDecoration: 'none' }}
                  >
                    {value}
                  </a>
                ) : (
                  value
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InfoPanel;
