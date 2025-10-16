import React from 'react';

const BuildFundsCTA = ({ onClick, disabled = false, label = 'Build Funds' }) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    style={{
      backgroundColor: disabled ? '#1e293b' : '#0d9488',
      color: disabled ? '#94a3b8' : '#f8fafc',
      border: 'none',
      padding: '12px 20px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: disabled ? 'none' : '0 12px 24px rgba(13, 148, 136, 0.25)'
    }}
  >
    {label}
  </button>
);

export default BuildFundsCTA;
