import React, { useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import NetworkCanvas from './components/lenovo/NetworkCanvas';
import ControlPanel from './components/lenovo/ControlPanel';
import InfoPanel from './components/lenovo/InfoPanel';
import CompanyTable from './components/lenovo/CompanyTable';

const DEFAULT_FILTERS = {
  search: '',
  relationship: '',
  country: '',
  sector: '',
  industry: ''
};

const LenovoPage = () => {
  const [allCompanies, setAllCompanies] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const networkRef = useRef(null);

  const filteredCompanies = useMemo(() => {
    const searchTerm = filters.search.toLowerCase();
    return allCompanies.filter((company) => {
      const matchesSearch =
        !searchTerm ||
        (company.company_name || '').toLowerCase().includes(searchTerm) ||
        (company.ticker || '').toLowerCase().includes(searchTerm);
      const matchesRelationship =
        !filters.relationship || company.relationship_type === filters.relationship;
      const matchesCountry = !filters.country || company.country === filters.country;
      const matchesSector = !filters.sector || company.sector === filters.sector;
      const matchesIndustry =
        !filters.industry || company.industry === filters.industry;

      return (
        matchesSearch &&
        matchesRelationship &&
        matchesCountry &&
        matchesSector &&
        matchesIndustry
      );
    });
  }, [allCompanies, filters]);

  const relationshipCounts = useMemo(() => {
    const counts = new Map();
    filteredCompanies.forEach((company) => {
      const key = company.relationship_type || 'Other';
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries());
  }, [filteredCompanies]);

  const relationshipOptions = useMemo(() => {
    const set = new Set();
    allCompanies.forEach((company) => {
      if (company.relationship_type) set.add(company.relationship_type);
    });
    return Array.from(set).sort();
  }, [allCompanies]);

  const countryOptions = useMemo(() => {
    const set = new Set();
    allCompanies.forEach((company) => {
      if (company.country) set.add(company.country);
    });
    return Array.from(set).sort();
  }, [allCompanies]);

  const sectorOptions = useMemo(() => {
    const set = new Set();
    allCompanies.forEach((company) => {
      if (company.sector) set.add(company.sector);
    });
    return Array.from(set).sort();
  }, [allCompanies]);

  const industryOptions = useMemo(() => {
    const set = new Set();
    allCompanies.forEach((company) => {
      if (company.industry) set.add(company.industry);
    });
    return Array.from(set).sort();
  }, [allCompanies]);

  const handleFileSelected = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const cleaned = data.filter((row) => Object.values(row).some(Boolean));
        setAllCompanies(cleaned);
        setFilters(DEFAULT_FILTERS);
        setSelectedCompany(null);
      }
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setSelectedCompany(null);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSelectedCompany(null);
  };

  const handleToggleAutoRotate = () => setAutoRotate((prev) => !prev);

  const handleResetCamera = () => {
    networkRef.current?.resetCamera();
  };

  const handleFocusLenovo = () => {
    networkRef.current?.focusLenovo();
  };

  const handleSelectCompany = (company) => {
    if (company && company.company_name === 'Lenovo') {
      setSelectedCompany({
        company_name: 'Lenovo',
        relationship_type: 'Headquarters',
        notes: 'Central node for Lenovo Group Ltd.'
      });
      return;
    }
    setSelectedCompany(company);
  };

  return (
    <div
      style={{
        padding: '24px',
        minHeight: 'calc(100vh - 120px)',
        boxSizing: 'border-box',
        backgroundColor: '#0f172a'
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr 320px',
          gap: '24px',
          alignItems: 'start'
        }}
      >
        <ControlPanel
            onFileSelected={handleFileSelected}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            relationshipOptions={relationshipOptions}
            countryOptions={countryOptions}
            sectorOptions={sectorOptions}
            industryOptions={industryOptions}
            onToggleAutoRotate={handleToggleAutoRotate}
            autoRotate={autoRotate}
            onResetCamera={handleResetCamera}
            onFocusLenovo={handleFocusLenovo}
            companyCount={filteredCompanies.length}
            relationshipCount={relationshipCounts.reduce((sum, [, value]) => sum + value, 0)}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              position: 'relative',
              height: '520px',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid rgba(71, 85, 105, 0.4)'
            }}
          >
            <NetworkCanvas
              ref={networkRef}
              data={filteredCompanies}
              autoRotate={autoRotate}
              onSelectCompany={handleSelectCompany}
            />
            {allCompanies.length === 0 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.85))',
                  color: '#94a3b8',
                  textAlign: 'center',
                  padding: '40px'
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#e2e8f0', marginBottom: '12px' }}>
                  Upload Lenovo relationship data to begin
                </div>
                <div style={{ fontSize: '14px' }}>
                  The 3D network will visualise relationships once a CSV file is uploaded and parsed.
                </div>
              </div>
            )}
          </div>

          {relationshipCounts.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(71, 85, 105, 0.7)',
                borderRadius: '12px',
                padding: '16px',
                backdropFilter: 'blur(10px)'
              }}
            >
              {relationshipCounts.map(([type, count]) => (
                <div
                  key={type}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    minWidth: '140px'
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {type}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#38bdf8' }}>{count}</div>
                </div>
              ))}
            </div>
          )}

          <CompanyTable data={filteredCompanies} />
        </div>

        <InfoPanel company={selectedCompany} onClose={() => setSelectedCompany(null)} />
      </div>
    </div>
  );
};

export default LenovoPage;
