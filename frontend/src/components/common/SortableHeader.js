import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const SortableHeader = ({ 
  label, 
  sortKey, 
  currentSort, 
  currentOrder, 
  onSort,
  width = 'auto',
  textAlign = 'left'
}) => {
  const getSortIcon = () => {
    if (currentSort !== sortKey) {
      return <ChevronUp style={{ width: '16px', height: '16px', color: '#6b7280', opacity: 0.3 }} />;
    }
    return currentOrder === 'desc' ?
      <ChevronDown style={{ width: '16px', height: '16px', color: '#00917C' }} /> :
      <ChevronUp style={{ width: '16px', height: '16px', color: '#00917C' }} />;
  };

  return (
    <th style={{
      padding: '12px',
      textAlign: textAlign === 'center' ? 'center' : 'left',
      fontSize: '12px',
      fontWeight: '500',
      color: '#9ca3af',
      borderBottom: '1px solid #475569',
      width: width
    }}>
      <button
        onClick={() => onSort(sortKey)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: textAlign === 'center' ? 'center' : 'flex-start',
          gap: '4px',
          background: 'none',
          border: 'none',
          color: '#d1d5db',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          textTransform: 'uppercase',
          width: '100%'
        }}
      >
        {label} {getSortIcon()}
      </button>
    </th>
  );
};

export default SortableHeader;