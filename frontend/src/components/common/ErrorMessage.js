import React from 'react';

const ErrorMessage = ({ message, onRetry = null }) => {
  if (!message) return null;

  return (
    <div style={{
      backgroundColor: '#7f1d1d',
      border: '1px solid #dc2626',
      borderRadius: '6px',
      padding: '12px 16px',
      margin: '16px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <span style={{
        color: '#fca5a5',
        fontSize: '14px'
      }}>
        {message}
      </span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            marginLeft: '12px'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;