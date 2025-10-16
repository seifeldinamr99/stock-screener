import React from 'react';
import { AlertCircle } from 'lucide-react';

const Alert = ({ alert, onClose }) => {
  if (!alert) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      right: '16px',
      zIndex: 50,
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: alert.type === 'error' ? '#dc2626' :
                      alert.type === 'warning' ? '#d97706' :
                      alert.type === 'success' ? '#059669' : '#0ea5e9',
      color: 'white'
    }}>
      <AlertCircle style={{ width: '20px', height: '20px' }} />
      <span>{alert.message}</span>
      <button
        onClick={onClose}
        style={{ 
          marginLeft: '8px', 
          fontSize: '18px', 
          background: 'none', 
          border: 'none', 
          color: 'white', 
          cursor: 'pointer' 
        }}
      >
        &times;
      </button>
    </div>
  );
};

export default Alert;