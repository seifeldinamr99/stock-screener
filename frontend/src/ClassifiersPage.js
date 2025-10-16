import React, { useEffect, useRef, useState } from 'react';
import useClassifierData from './hooks/useClassifierData';
import { formatMarketCap, scrollToElement } from './utils/formatters';
import SectorsView from './components/classifiers/SectorsView';
import SectorDetailView from './components/classifiers/SectorDetailView';
import IndustryDetailView from './components/classifiers/IndustryDetailView';
import FundConstructionView from './components/classifiers/FundConstructionView';
import FundParametersView from './components/fundParameters/FundParametersView';
import CompanyDetailModal from './components/common/CompanyDetailModal';

const VIEW_TYPES = {
  SECTORS: 'sectors',
  SECTOR_DETAIL: 'sector-detail',
  INDUSTRY_DETAIL: 'industry-detail',
  FUND_CONSTRUCTION: 'fund-construction',
  FUND_PARAMETERS: 'fund-parameters'
};

const DEFAULT_FILTERS = {
  marketCapMin: '',
  marketCapMax: '',
  marketCapMinUnit: 'M',
  marketCapMaxUnit: 'M',
  exchange: '',
  industry: ''
};

const MAX_STRATEGIES = 5;

const FUND_STRATEGIES = [
  {
    key: 'market-cap',
    name: 'Market-Cap Weighted',
    subtitle: 'Top companies by size',
    description: 'Scale allocations in proportion to company size for high-liquidity exposure.',
    selection: 'Top 20-30 companies by market cap',
    weighting: 'Proportional to each company market capitalization',
    bestFor: 'Conservative allocations seeking stability',
    risk: 'Low-Moderate',
    pros: [
      'Centers portfolio on proven, liquid leaders',
      'Lower turnover and tracking error',
      'Reduced idiosyncratic risk'
    ],
    cons: [
      'Concentrated in mega-cap names',
      'May lag during early growth cycles',
      'Limited exposure to emerging innovators'
    ]
  },
  {
    key: 'equal-weighted',
    name: 'Equal Weighted',
    subtitle: 'Balanced allocation',
    description: 'Assign the same weight to every selection for a diversified exposure.',
    selection: 'Diversified cross-cap selections within the sector',
    weighting: 'Equal allocation across included stocks',
    bestFor: 'Balanced diversification seekers',
    risk: 'Moderate',
    pros: [
      'Amplifies mid and small-cap participation',
      'Avoids mega-cap concentration risk',
      'Simple, rules-based implementation'
    ],
    cons: [
      'Requires frequent rebalancing',
      'Higher transaction and tax friction',
      'Can be more volatile in downturns'
    ]
  },
  {
    key: 'factor-based',
    name: 'Factor-Based',
    subtitle: 'Growth, Value, Quality, Momentum',
    description: 'Blend academic factors to tilt toward growth, value, quality, or momentum leaders.',
    selection: 'Stocks screened for Growth, Value, Quality, and Momentum factor scores',
    weighting: 'Weights proportional to composite factor score',
    bestFor: 'Investors targeting factor premia',
    risk: 'Variable by factor mix',
    pros: [
      'Targets historically rewarded factors',
      'Customizable tilts across factor styles',
      'Potential for enhanced long-term returns'
    ],
    cons: [
      'Factor cycles can underperform for years',
      'Requires consistent data refresh',
      'Can overlap with other smart-beta tilts'
    ]
  },
  {
    key: 'risk-optimized',
    name: 'Risk-Optimized',
    subtitle: 'Min volatility / Max Sharpe',
    description: 'Run optimizations to minimize volatility or maximize Sharpe against sector universe.',
    selection: 'Optimization engine using volatility and Sharpe objectives',
    weighting: 'Optimizer-derived target weights',
    bestFor: 'Risk-conscious allocators',
    risk: 'Low-Moderate',
    pros: [
      'Data-driven diversification benefits',
      'Controls downside contribution',
      'Adapts weights to risk clusters'
    ],
    cons: [
      'Relies on historical covariance stability',
      'Susceptible to model error',
      'Requires periodic optimization reruns'
    ]
  },
  {
    key: 'cluster-based',
    name: 'Cluster-Based',
    subtitle: 'Sub-sector diversification',
    description: 'Choose representatives from each sub-sector cluster for broad coverage.',
    selection: 'Representative picks from cluster analysis',
    weighting: 'Cluster-balanced allocations',
    bestFor: 'Investors avoiding overlap risk',
    risk: 'Moderate',
    pros: [
      'Ensures every sub-theme is represented',
      'Naturally limits correlation spikes',
      'Highlights under-followed niches'
    ],
    cons: [
      'May dilute leading sub-themes',
      'Dependent on clustering inputs',
      'Requires monitoring of cluster drift'
    ]
  }
];


const ClassifiersPage = ({
  datasetKey = 'classifier',
  sectorsTitle = 'Market Classifications',
  sectorsEmptyMessage = 'No sectors available'
}) => {
  const {
    filterOptions,
    sectorsData,
    sectorsLoading,
    sectorIndustries,
    sectorDetailData,
    sectorDetailLoading,
    industriesData,
    industriesLoading,
    sectorCompanies,
    sectorCompaniesLoading,
    industryDetailData,
    industryDetailLoading,
    industryCompanies,
    industryCompaniesLoading,
    error,
    setError,
    loadFilterOptions,
    loadSectorsData,
    loadSectorIndustries,
    loadSectorDetail,
    loadSectorCompanies,
    loadIndustryDetail,
    loadIndustryCompanies,
    resetSectorData,
    resetIndustryData
  } = useClassifierData(datasetKey);

  const [currentView, setCurrentView] = useState(VIEW_TYPES.SECTORS);
  const [selectedExchange, setSelectedExchange] = useState('');
  const [selectedSector, setSelectedSector] = useState(null);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [sectorFilters, setSectorFilters] = useState(DEFAULT_FILTERS);
  const [showSectorCompanies, setShowSectorCompanies] = useState(false);
  const [showIndustryCompanies, setShowIndustryCompanies] = useState(false);
  const [selectedStrategies, setSelectedStrategies] = useState([]);
  const [fundSourceView, setFundSourceView] = useState(null);
  const [companyModal, setCompanyModal] = useState({
    open: false,
    ticker: null,
    exchange: null,
    name: '',
  });

  const sectorCompaniesRef = useRef(null);
  const industryCompaniesRef = useRef(null);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    loadSectorsData(selectedExchange);
  }, [selectedExchange, loadSectorsData]);

  useEffect(() => {
    if (currentView === VIEW_TYPES.SECTOR_DETAIL && selectedSector) {
      loadSectorDetail(selectedSector, sectorFilters);
    }
  }, [currentView, selectedSector, sectorFilters, loadSectorDetail]);

  useEffect(() => {
    if (currentView === VIEW_TYPES.INDUSTRY_DETAIL && selectedSector && selectedIndustry) {
      loadIndustryDetail(selectedSector, selectedIndustry, sectorFilters);
    }
  }, [currentView, selectedSector, selectedIndustry, sectorFilters, loadIndustryDetail]);

  useEffect(() => {
    if (currentView === VIEW_TYPES.SECTOR_DETAIL && showSectorCompanies && selectedSector) {
      loadSectorCompanies(selectedSector, sectorFilters);
    }
  }, [currentView, showSectorCompanies, selectedSector, sectorFilters, loadSectorCompanies]);

  useEffect(() => {
    if (currentView === VIEW_TYPES.INDUSTRY_DETAIL && showIndustryCompanies && selectedSector && selectedIndustry) {
      loadIndustryCompanies(selectedSector, selectedIndustry, sectorFilters);
    }
  }, [
    currentView,
    showIndustryCompanies,
    selectedSector,
    selectedIndustry,
    sectorFilters,
    loadIndustryCompanies
  ]);

  const handleExchangeChange = (exchangeCode) => {
    setSelectedExchange(exchangeCode);
    if (currentView === VIEW_TYPES.SECTOR_DETAIL) {
      setSectorFilters((prev) => ({ ...prev, exchange: exchangeCode }));
    }
  };

  const handleCompanyModalOpen = (company) => {
    if (!company) return;
    setCompanyModal({
      open: true,
      ticker: (company.ticker || '').toUpperCase(),
      exchange: company.exchange_code || company.exchange_name || company.exchange || null,
      name: company.company_name || company.name || company.ticker,
    });
  };

  const handleCompanyModalClose = () => {
    setCompanyModal((prev) => ({
      ...prev,
      open: false,
    }));
  };

  const handleSectorFilterChange = (key, value) => {
    setSectorFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSectorClick = async (sectorName) => {
    setSelectedSector(sectorName);
    setSelectedIndustry(null);
    setSelectedStrategies([]);
    setFundSourceView(null);

    const nextFilters = { ...sectorFilters, exchange: selectedExchange };
    setSectorFilters(nextFilters);

    setShowSectorCompanies(false);
    setShowIndustryCompanies(false);
    setCurrentView(VIEW_TYPES.SECTOR_DETAIL);

    await Promise.all([
      loadSectorDetail(sectorName, nextFilters),
      loadSectorIndustries(sectorName)
    ]);

    setError('');
  };

  const handleBackToSectors = () => {
    setCurrentView(VIEW_TYPES.SECTORS);
    setSelectedSector(null);
    setSelectedIndustry(null);
    setSectorFilters(DEFAULT_FILTERS);
    setShowSectorCompanies(false);
    setShowIndustryCompanies(false);
    setSelectedStrategies([]);
    setFundSourceView(null);
    resetSectorData();
    resetIndustryData();
    setError('');
  };

  const handleIndustryClick = async (industryName) => {
    if (!selectedSector) return;
    setSelectedIndustry(industryName);
    setCurrentView(VIEW_TYPES.INDUSTRY_DETAIL);

    await Promise.all([
      loadIndustryDetail(selectedSector, industryName, sectorFilters),
      loadIndustryCompanies(selectedSector, industryName, sectorFilters)
    ]);

    setShowIndustryCompanies(true);
    scrollToElement(industryCompaniesRef);
    setError('');
  };

  const handleBackToSector = () => {
    setCurrentView(VIEW_TYPES.SECTOR_DETAIL);
    setSelectedIndustry(null);
    setShowIndustryCompanies(false);
    resetIndustryData();
    setError('');
  };

  const toggleSectorCompanies = async () => {
    if (!selectedSector) return;
    if (showSectorCompanies) {
      setShowSectorCompanies(false);
      return;
    }

    await loadSectorCompanies(selectedSector, sectorFilters);
    setShowSectorCompanies(true);
    scrollToElement(sectorCompaniesRef);
  };

  const toggleIndustryCompanies = async () => {
    if (!selectedSector || !selectedIndustry) return;
    if (showIndustryCompanies) {
      setShowIndustryCompanies(false);
      return;
    }

    await loadIndustryCompanies(selectedSector, selectedIndustry, sectorFilters);
    setShowIndustryCompanies(true);
    scrollToElement(industryCompaniesRef);
  };

  const handleBuildFunds = () => {
    if (!selectedSector || !selectedIndustry) return;
    setFundSourceView(VIEW_TYPES.INDUSTRY_DETAIL);
    setCurrentView(VIEW_TYPES.FUND_CONSTRUCTION);
  };

  const handleStrategyToggle = (strategyKey) => {
    setSelectedStrategies((prev) => {
      if (prev.includes(strategyKey)) {
        return prev.filter((key) => key !== strategyKey);
      }
      if (prev.length >= MAX_STRATEGIES) {
        return prev;
      }
      return [...prev, strategyKey];
    });
  };

  const handleFundBackToSource = () => {
    if (fundSourceView === VIEW_TYPES.INDUSTRY_DETAIL && selectedIndustry) {
      setCurrentView(VIEW_TYPES.INDUSTRY_DETAIL);
    } else {
      setCurrentView(VIEW_TYPES.SECTOR_DETAIL);
    }
    setFundSourceView(null);
  };

  const handleFundContinue = () => {
    if (selectedStrategies.length === 0) {
      return;
    }
    setCurrentView(VIEW_TYPES.FUND_PARAMETERS);
  };

  const handleFundParametersBack = () => {
    setCurrentView(VIEW_TYPES.FUND_CONSTRUCTION);
  };

  const handleUpdateSelectedStrategies = (nextStrategies) => {
    setSelectedStrategies(nextStrategies);
  };

  if (currentView === VIEW_TYPES.SECTORS) {
    return (
      <>
        <SectorsView
          title={sectorsTitle}
          emptyStateMessage={sectorsEmptyMessage}
          filterOptions={filterOptions}
          selectedExchange={selectedExchange}
          onExchangeChange={handleExchangeChange}
          sectorsData={sectorsData}
          loading={sectorsLoading}
          error={error}
          onSectorSelect={handleSectorClick}
        />
        <CompanyDetailModal
          isOpen={companyModal.open}
          ticker={companyModal.ticker}
          exchange={companyModal.exchange}
          companyName={companyModal.name}
          onClose={handleCompanyModalClose}
        />
      </>
    );
  }

  if (currentView === VIEW_TYPES.SECTOR_DETAIL && selectedSector) {
    return (
      <>
        <SectorDetailView
          sectorName={selectedSector}
          sectorFilters={sectorFilters}
          onFilterChange={handleSectorFilterChange}
          filterOptions={filterOptions}
          sectorIndustries={sectorIndustries}
          detail={sectorDetailData}
          detailLoading={sectorDetailLoading}
          industries={industriesData}
          industriesLoading={industriesLoading}
          error={error}
          onBack={handleBackToSectors}
          onIndustryClick={handleIndustryClick}
          showCompanies={showSectorCompanies}
          onToggleCompanies={toggleSectorCompanies}
          companies={sectorCompanies}
          companiesLoading={sectorCompaniesLoading}
          companiesRef={sectorCompaniesRef}
          formatMarketCap={formatMarketCap}
          onCompanyClick={handleCompanyModalOpen}
        />
        <CompanyDetailModal
          isOpen={companyModal.open}
          ticker={companyModal.ticker}
          exchange={companyModal.exchange}
          companyName={companyModal.name}
          onClose={handleCompanyModalClose}
        />
      </>
    );
  }

  if (
    currentView === VIEW_TYPES.INDUSTRY_DETAIL &&
    selectedSector &&
    selectedIndustry
  ) {
    return (
      <>
        <IndustryDetailView
          sectorName={selectedSector}
          industryName={selectedIndustry}
          detail={industryDetailData}
          detailLoading={industryDetailLoading}
          sectorFilters={sectorFilters}
          filterOptions={filterOptions}
          showCompanies={showIndustryCompanies}
          onToggleCompanies={toggleIndustryCompanies}
          onBuildFunds={handleBuildFunds}
          companies={industryCompanies}
          companiesLoading={industryCompaniesLoading}
          companiesRef={industryCompaniesRef}
          formatMarketCap={formatMarketCap}
          onBackToSector={handleBackToSector}
          error={error}
          onCompanyClick={handleCompanyModalOpen}
        />
        <CompanyDetailModal
          isOpen={companyModal.open}
          ticker={companyModal.ticker}
          exchange={companyModal.exchange}
          companyName={companyModal.name}
          onClose={handleCompanyModalClose}
        />
      </>
    );
  }

  if (currentView === VIEW_TYPES.FUND_CONSTRUCTION && selectedSector) {
    return (
      <>
        <FundConstructionView
          sectorName={selectedSector}
          industryName={selectedIndustry}
          strategies={FUND_STRATEGIES}
          selectedStrategies={selectedStrategies}
          maxStrategies={MAX_STRATEGIES}
          onStrategyToggle={handleStrategyToggle}
          onBackToIndustry={handleFundBackToSource}
          onContinue={handleFundContinue}
        />
        <CompanyDetailModal
          isOpen={companyModal.open}
          ticker={companyModal.ticker}
          exchange={companyModal.exchange}
          companyName={companyModal.name}
          onClose={handleCompanyModalClose}
        />
      </>
    );
  }

  if (currentView === VIEW_TYPES.FUND_PARAMETERS && selectedSector) {
    return (
      <>
        <FundParametersView
          sectorName={selectedSector}
          industryName={selectedIndustry}
          selectedStrategies={selectedStrategies}
          onBack={handleFundParametersBack}
          onUpdateStrategies={handleUpdateSelectedStrategies}
          onNavigateToStrategies={() => setCurrentView(VIEW_TYPES.FUND_CONSTRUCTION)}
        />
        <CompanyDetailModal
          isOpen={companyModal.open}
          ticker={companyModal.ticker}
          exchange={companyModal.exchange}
          companyName={companyModal.name}
          onClose={handleCompanyModalClose}
        />
      </>
    );
  }

  return (
    <CompanyDetailModal
      isOpen={companyModal.open}
      ticker={companyModal.ticker}
      exchange={companyModal.exchange}
      companyName={companyModal.name}
      onClose={handleCompanyModalClose}
    />
  );
};

export default ClassifiersPage;


