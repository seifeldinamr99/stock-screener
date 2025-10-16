import React from 'react';

const Navigation = ({ currentPage, setCurrentPage }) => {
  return (
    <div style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #475569', padding: '12px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2dd4bf', margin: 0 }}>
            KAM SCREENER
          </h1>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => setCurrentPage('screener')}
              style={{
                padding: '8px 16px',
                backgroundColor: currentPage === 'screener' ? '#0d9488' : 'transparent',
                color: currentPage === 'screener' ? 'white' : '#d1d5db',
                border: '1px solid #475569',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Screener
            </button>
            <button
              onClick={() => setCurrentPage('classifiers')}
              style={{
                padding: '8px 16px',
                backgroundColor: currentPage === 'classifiers' ? '#0d9488' : 'transparent',
                color: currentPage === 'classifiers' ? 'white' : '#d1d5db',
                border: '1px solid #475569',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Classifiers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;