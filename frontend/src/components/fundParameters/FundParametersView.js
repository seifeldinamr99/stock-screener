import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './FundParametersView.css';
import PageHeader from './components/PageHeader';
import PresetsSection from './components/PresetsSection';
import GeneralParametersSection from './components/GeneralParametersSection';
import ConstraintsSection from './components/ConstraintsSection';
import ValidationPanel from './components/ValidationPanel';
import SummaryCard from './components/SummaryCard';
import StrategyContainer from './components/StrategyContainer';
import BottomBar from './components/BottomBar';
import SectionCard from './components/SectionCard';
import { DEFAULT_CONSTRAINTS, PRESETS, STRATEGY_SECTION_ORDER } from './constants';
import {
  computeSmartWeights,
  getDefaultState,
  getPresetMatch,
  loadPersistedState,
  normalizeStrategyId,
  parseCurrency,
  persistState
} from './utils';

const FundParametersView = ({
  sectorName,
  industryName,
  selectedStrategies,
  onBack,
  onUpdateStrategies,
  onNavigateToStrategies
}) => {
  const normalizedStrategies = useMemo(() => {
    const list = selectedStrategies && selectedStrategies.length ? selectedStrategies : ['market_cap', 'equal_weight'];
    return list.map(normalizeStrategyId);
  }, [selectedStrategies]);

  const loadInitialState = useCallback(() => {
    const persisted = loadPersistedState();
    if (persisted) {
      return {
        ...getDefaultState(normalizedStrategies),
        ...persisted,
        selectedStrategies: normalizedStrategies
      };
    }
    return getDefaultState(normalizedStrategies);
  }, [normalizedStrategies]);

  const [pageState, setPageState] = useState(() => loadInitialState());

  const updatePageState = useCallback((updater) => {
    setPageState((prev) => (typeof updater === 'function' ? updater(prev) : updater));
  }, []);

  useEffect(() => {
    updatePageState((prev) => ({
      ...prev,
      selectedStrategies: normalizedStrategies
    }));
  }, [normalizedStrategies, updatePageState]);

  const { generalParams, constraints, strategyConfigs, validation, isBuilding, activePreset } = pageState;

  useEffect(() => {
    persistState(pageState);
  }, [pageState]);

  const updateGeneralParams = useCallback((field, value) => {
    updatePageState((prev) => ({
      ...prev,
      generalParams: {
        ...prev.generalParams,
        [field]: value
      }
    }));
  }, [updatePageState]);

  const updateConstraints = useCallback((field, value) => {
    updatePageState((prev) => ({
      ...prev,
      constraints: {
        ...prev.constraints,
        [field]: value
      }
    }));
  }, [updatePageState]);

  const updateStrategyConfig = useCallback((strategy, updates) => {
    updatePageState((prev) => ({
      ...prev,
      strategyConfigs: {
        ...prev.strategyConfigs,
        [strategy]: {
          ...prev.strategyConfigs[strategy],
          ...updates
        }
      }
    }));
  }, [updatePageState]);

  const handleRemoveStrategy = useCallback((strategyId) => {
    const normalized = normalizeStrategyId(strategyId);
    updatePageState((prev) => ({
      ...prev,
      selectedStrategies: prev.selectedStrategies.filter((strategy) => strategy !== normalized)
    }));
    if (onUpdateStrategies) {
      const rawIds = selectedStrategies.filter((id) => normalizeStrategyId(id) !== normalized);
      onUpdateStrategies(rawIds);
    }
  }, [onUpdateStrategies, selectedStrategies, updatePageState]);

  const handlePresetSelect = useCallback((presetKey) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    updatePageState((prev) => ({
      ...prev,
      generalParams: {
        ...prev.generalParams,
        ...preset.generalParams
      },
      constraints: {
        ...prev.constraints,
        ...preset.constraints
      },
      activePreset: presetKey
    }));
  }, [updatePageState]);

  const handleCustomChange = useCallback(() => {
    updatePageState((prev) => ({
      ...prev,
      activePreset: null
    }));
  }, [updatePageState]);

  const smartWeights = useMemo(() => computeSmartWeights(generalParams.num_holdings), [generalParams.num_holdings]);

  const validateAll = useCallback((state) => {
    const nextErrors = [];
    const nextWarnings = [];
    const { generalParams: gp, constraints: ct, strategyConfigs: sc } = state;

    const maxTotal = gp.num_holdings * ct.max_weight_per_stock;
    const minTotal = gp.num_holdings * ct.min_weight_per_stock;

    if (ct.max_weight_per_stock <= ct.min_weight_per_stock) {
      nextErrors.push({
        id: 'constraint-max-min',
        title: 'Max must exceed Min',
        message: 'Max weight per stock must be greater than min weight.'
      });
    }

    if (maxTotal < 100) {
      nextErrors.push({
        id: 'constraint-max-total',
        title: 'Max weight too low',
        message: 'Increase max weight or holdings to reach at least 100% allocation.'
      });
    }

    if (minTotal > 100) {
      nextErrors.push({
        id: 'constraint-min-total',
        title: 'Min weight too high',
        message: 'Decrease min weight or holdings so coverage stays below 100%.'
      });
    }

    if (state.selectedStrategies.length === 0) {
      nextErrors.push({
        id: 'strategy-empty',
        title: 'No strategies selected',
        message: 'Please select at least one strategy before building funds.'
      });
    }

    if (state.selectedStrategies.includes('factor_based')) {
      const qualifying = sc.factor_based?.qualifying_companies ?? 0;
      if (qualifying < gp.num_holdings) {
        nextWarnings.push({
          id: 'factor-coverage',
          title: 'Factor coverage low',
          message: `Only ${qualifying} companies meet factor criteria (need ${gp.num_holdings}).`
        });
      }
    }

    if (state.selectedStrategies.includes('cluster_based')) {
      const clusterConfig = sc.cluster_based;
      const totalCompanies = (() => {
        switch (clusterConfig.method) {
          case 'business_model':
            return clusterConfig.num_clusters * clusterConfig.companies_per_cluster;
          case 'market_cap':
            return Object.values(clusterConfig.tier_allocation || {}).reduce((sum, value) => sum + Number(value || 0), 0);
          case 'geographic':
            return Object.values(clusterConfig.region_allocation || {}).reduce((sum, value) => sum + Number(value || 0), 0);
          case 'ml':
            return clusterConfig.num_clusters * clusterConfig.ml_company_target;
          default:
            return 0;
        }
      })();

      if (totalCompanies !== gp.num_holdings) {
        nextWarnings.push({
          id: 'cluster-total',
          title: 'Cluster total mismatch',
          message: `Cluster selections total ${totalCompanies} companies but general holdings target ${gp.num_holdings}.`
        });
      }

      if (clusterConfig.num_clusters < 1) {
        nextErrors.push({
          id: 'cluster-count',
          title: 'Cluster count invalid',
          message: 'Each cluster configuration needs at least one cluster.'
        });
      }
    }

    if (gp.initial_investment < 10000 || !gp.initial_investment) {
      nextErrors.push({
        id: 'investment-min',
        title: 'Initial investment too low',
        message: 'Initial investment must be at least $10,000.'
      });
    }

    return {
      validation: {
        isValid: nextErrors.length === 0,
        errors: nextErrors,
        warnings: nextWarnings
      }
    };
  }, []);

  useEffect(() => {
    updatePageState((prev) => ({
      ...prev,
      ...validateAll(prev)
    }));
  }, [generalParams, constraints, strategyConfigs, validateAll, updatePageState]);

  useEffect(() => {
    const presetKey = getPresetMatch(generalParams, constraints);
    updatePageState((prev) => ({
      ...prev,
      activePreset: presetKey
    }));
  }, [generalParams, constraints, updatePageState]);

  const handleInitialInvestmentBlur = () => {
    if (generalParams.initial_investment < 10000) {
      updateGeneralParams('initial_investment', 10000);
    }
  };

  const handleInvestmentChange = (input) => {
    const parsed = parseCurrency(input);
    handleCustomChange();
    updateGeneralParams('initial_investment', parsed === '' ? '' : parsed);
  };

  const handleNumHoldingsChange = (value) => {
    handleCustomChange();
    updateGeneralParams('num_holdings', value);
  };

  const handleBuildFunds = async () => {
    updatePageState((prev) => ({ ...prev, isBuilding: true }));
    await new Promise((resolve) => setTimeout(resolve, 500));
    updatePageState((prev) => ({ ...prev, isBuilding: false }));
  };

  const hasConstraintError = validation.errors.some((error) => error.id.startsWith('constraint'));
  const selectedStrategySections = STRATEGY_SECTION_ORDER.filter((strategy) => pageState.selectedStrategies.includes(strategy));

  return (
    <div className="fp-page">
      <div className="fp-page-inner">
        <PageHeader
          sectorName={sectorName}
          industryName={industryName}
          selectedStrategies={pageState.selectedStrategies}
          onRemoveStrategy={handleRemoveStrategy}
        />

        <div className="fp-layout">
          <div className="fp-main-column">
            <PresetsSection activePreset={activePreset} onPresetSelect={handlePresetSelect} onCustom={handleCustomChange} />
            <GeneralParametersSection
              generalParams={generalParams}
              validation={validation}
              onNumHoldingsChange={handleNumHoldingsChange}
              onInvestmentHorizonChange={(value) => {
                handleCustomChange();
                updateGeneralParams('investment_horizon', value);
              }}
              onInitialInvestmentChange={handleInvestmentChange}
              onInitialInvestmentBlur={handleInitialInvestmentBlur}
              onRebalancingChange={(value) => {
                handleCustomChange();
                updateGeneralParams('rebalancing_frequency', value);
              }}
            />
            <ConstraintsSection
              constraints={constraints}
              smartWeights={smartWeights}
              hasConstraintError={hasConstraintError}
              onConstraintChange={(field, value) => {
                handleCustomChange();
                updateConstraints(field, value === '' ? DEFAULT_CONSTRAINTS[field] : value);
              }}
              onToggleStrict={(checked) => updateConstraints('strict_constraints', checked)}
              onToggleDeviation={(checked) => updateConstraints('allow_deviations', checked)}
            />
            <SectionCard title="Strategy Configurations" subtitle="Configure each selected strategy">
              <StrategyContainer
                selectedStrategies={selectedStrategySections}
                strategyConfigs={strategyConfigs}
                generalParams={generalParams}
                onStrategyConfigChange={updateStrategyConfig}
              />
            </SectionCard>
          </div>

          <aside className="fp-side-column">
            <ValidationPanel validation={validation} />
            <SummaryCard
              generalParams={generalParams}
              constraints={constraints}
              selectedCount={pageState.selectedStrategies.length}
              onNavigateBack={onNavigateToStrategies}
            />
          </aside>
        </div>
      </div>
      <BottomBar isValid={validation.isValid} isBuilding={isBuilding} onBack={onBack} onBuild={handleBuildFunds} />
    </div>
  );
};

export default FundParametersView;
