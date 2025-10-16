import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const ClassifierFilters = ({
  sectorFilters,
  onFilterChange,
  filterOptions,
  sectorIndustries,
  showIndustryFilter = false
}) => {
  const [industrySearchTerm, setIndustrySearchTerm] = useState('');
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showIndustryDropdown && !event.target.closest('.industry-dropdown')) {
        setShowIndustryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showIndustryDropdown]);

  const filteredIndustries = sectorIndustries.filter((industry) =>
    industry.name.toLowerCase().includes(industrySearchTerm.toLowerCase())
  );

  const handleIndustrySelect = (industryName) => {
    onFilterChange('industry', industryName);
    setIndustrySearchTerm('');
    setShowIndustryDropdown(false);
  };

  const handleClearIndustry = () => {
    onFilterChange('industry', '');
    setIndustrySearchTerm('');
    setShowIndustryDropdown(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
      <div>
        <label style={{ color: '#d1d5db', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
          Exchange
        </label>
        <select
          value={sectorFilters.exchange}
          onChange={(event) => onFilterChange('exchange', event.target.value)}
          style={{
            width: '100%',
            backgroundColor: '#334155',
            border: '1px solid #475569',
            color: 'white',
            padding: '8px 12px',
            fontSize: '14px',
            borderRadius: '4px'
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

      {showIndustryFilter && (
        <div style={{ position: 'relative' }} className="industry-dropdown">
          <label style={{ color: '#d1d5db', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
            Industry
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={industrySearchTerm}
              onChange={(event) => {
                setIndustrySearchTerm(event.target.value);
                setShowIndustryDropdown(true);
              }}
              onFocus={() => setShowIndustryDropdown(true)}
              placeholder={sectorFilters.industry || 'Search industries...'}
              style={{
                width: '100%',
                backgroundColor: '#334155',
                border: '1px solid #475569',
                color: 'white',
                padding: '8px 32px 8px 12px',
                fontSize: '14px',
                borderRadius: '4px'
              }}
            />
            <ChevronDown
              onClick={() => setShowIndustryDropdown((prev) => !prev)}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#9ca3af',
                cursor: 'pointer'
              }}
            />
          </div>
          {showIndustryDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#334155',
                border: '1px solid #475569',
                borderTop: 'none',
                borderRadius: '0 0 4px 4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000
              }}
            >
              <div
                onClick={handleClearIndustry}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'white',
                  backgroundColor: !sectorFilters.industry ? '#334155' : 'transparent'
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.backgroundColor = '#334155';
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.backgroundColor = !sectorFilters.industry ? '#334155' : 'transparent';
                }}
              >
                All Industries
              </div>
              {filteredIndustries.map((industry) => (
                <div
                  key={industry.id}
                  onClick={() => handleIndustrySelect(industry.name)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  color: 'white',
                    backgroundColor: sectorFilters.industry === industry.name ? '#334155' : 'transparent'
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.backgroundColor = '#334155';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.backgroundColor =
                      sectorFilters.industry === industry.name ? '#334155' : 'transparent';
                  }}
                >
                  {industry.name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ gridColumn: showIndustryFilter ? 'span 2' : 'span 1' }}>
        <label style={{ color: '#d1d5db', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
          Market Cap Range
        </label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="number"
            placeholder="From"
            value={sectorFilters.marketCapMin}
            onChange={(event) => onFilterChange('marketCapMin', event.target.value)}
            style={{
              backgroundColor: '#334155',
              border: '1px solid #475569',
              color: 'white',
              padding: '8px 12px',
              fontSize: '14px',
              borderRadius: '4px',
              width: '100px'
            }}
          />
          <select
            value={sectorFilters.marketCapMinUnit}
            onChange={(event) => onFilterChange('marketCapMinUnit', event.target.value)}
            style={{
              backgroundColor: '#334155',
              border: '1px solid #475569',
              color: 'white',
              padding: '8px 12px',
              fontSize: '14px',
              borderRadius: '4px'
            }}
          >
            <option value="M">Million</option>
            <option value="B">Billion</option>
          </select>
          <span style={{ color: '#9ca3af', fontSize: '14px' }}>to</span>
          <input
            type="number"
            placeholder="To"
            value={sectorFilters.marketCapMax}
            onChange={(event) => onFilterChange('marketCapMax', event.target.value)}
            style={{
              backgroundColor: '#334155',
              border: '1px solid #475569',
              color: 'white',
              padding: '8px 12px',
              fontSize: '14px',
              borderRadius: '4px',
              width: '100px'
            }}
          />
          <select
            value={sectorFilters.marketCapMaxUnit}
            onChange={(event) => onFilterChange('marketCapMaxUnit', event.target.value)}
            style={{
              backgroundColor: '#334155',
              border: '1px solid #475569',
              color: 'white',
              padding: '8px 12px',
              fontSize: '14px',
              borderRadius: '4px'
            }}
          >
            <option value="M">Million</option>
            <option value="B">Billion</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ClassifierFilters;
