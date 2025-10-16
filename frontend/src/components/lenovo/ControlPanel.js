import React from 'react';
import { Upload, RefreshCw, RotateCcw, Disc3 } from 'lucide-react';

const panelStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  border: '1px solid rgba(71, 85, 105, 0.7)',
  borderRadius: '12px',
  padding: '20px',
  color: '#e2e8f0',
  backdropFilter: 'blur(10px)'
};

const labelStyle = {
  fontSize: '12px',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '6px'
};

const selectStyle = {
  width: '100%',
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  color: 'white',
  padding: '8px 12px',
  borderRadius: '6px',
  fontSize: '14px'
};

const buttonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  padding: '10px 12px',
  backgroundColor: '#0d9488',
  border: 'none',
  borderRadius: '6px',
  color: 'white',
  cursor: 'pointer',
  fontSize: '14px',
  justifyContent: 'center'
};

const ControlPanel = ({
  onFileSelected,
  filters,
  onFilterChange,
  onResetFilters,
  relationshipOptions,
  countryOptions,
  sectorOptions,
  industryOptions,
  onToggleAutoRotate,
  autoRotate,
  onResetCamera,
  onFocusLenovo,
  companyCount,
  relationshipCount
}) => {
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <div style={{ ...panelStyle, width: '280px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0d9488, #22d3ee)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}
          >
            <Disc3 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>Lenovo Network</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Upload a CSV to visualise relationships</div>
          </div>
        </div>
        <label
          htmlFor="lenovo-upload"
          style={{
            ...buttonStyle,
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            cursor: 'pointer'
          }}
        >
          <Upload size={18} />
          Upload CSV
        </label>
        <input
          id="lenovo-upload"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Companies</div>
            <div style={{ fontSize: '22px', fontWeight: 600, color: '#38bdf8' }}>{companyCount}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Relationships</div>
            <div style={{ fontSize: '22px', fontWeight: 600, color: '#f97316' }}>{relationshipCount}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <div style={labelStyle}>Search</div>
          <input
            type="text"
            placeholder="Search companies..."
            value={filters.search}
            onChange={(event) => onFilterChange('search', event.target.value)}
            style={{
              ...selectStyle,
              padding: '8px 12px'
            }}
          />
        </div>

        <div>
          <div style={labelStyle}>Relationship</div>
          <select
            value={filters.relationship}
            onChange={(event) => onFilterChange('relationship', event.target.value)}
            style={selectStyle}
          >
            <option value="">All</option>
            {relationshipOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div style={labelStyle}>Country</div>
          <select
            value={filters.country}
            onChange={(event) => onFilterChange('country', event.target.value)}
            style={selectStyle}
          >
            <option value="">All</option>
            {countryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div style={labelStyle}>Sector</div>
          <select
            value={filters.sector}
            onChange={(event) => onFilterChange('sector', event.target.value)}
            style={selectStyle}
          >
            <option value="">All</option>
            {sectorOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div style={labelStyle}>Industry</div>
          <select
            value={filters.industry}
            onChange={(event) => onFilterChange('industry', event.target.value)}
            style={selectStyle}
          >
            <option value="">All</option>
            {industryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onResetFilters}
          style={{
            ...buttonStyle,
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            color: '#e2e8f0'
          }}
        >
          <RefreshCw size={18} />
          Reset Filters
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
          <button
            type="button"
            onClick={onToggleAutoRotate}
            style={{
              ...buttonStyle,
              backgroundColor: autoRotate ? '#0d9488' : '#1e293b',
              border: autoRotate ? 'none' : '1px solid #334155'
            }}
          >
            <RotateCcw size={18} />
            Auto-Rotate: {autoRotate ? 'On' : 'Off'}
          </button>
          <button
            type="button"
            onClick={onResetCamera}
            style={{ ...buttonStyle, backgroundColor: '#1e293b', border: '1px solid #334155' }}
          >
            <RefreshCw size={18} />
            Reset Camera
          </button>
          <button
            type="button"
            onClick={onFocusLenovo}
            style={{ ...buttonStyle, backgroundColor: '#1e293b', border: '1px solid #334155' }}
          >
            <Disc3 size={18} />
            Focus Lenovo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
