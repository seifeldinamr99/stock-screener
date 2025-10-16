import {
  DEFAULT_CLUSTER_CONFIG,
  DEFAULT_CONSTRAINTS,
  DEFAULT_EQUAL_WEIGHT_CONFIG,
  DEFAULT_FACTOR_CONFIG,
  DEFAULT_GENERAL_PARAMS,
  DEFAULT_RISK_CONFIG,
  PRESETS,
  STORAGE_KEY,
  STRATEGY_METADATA
} from './constants';

export const normalizeStrategyId = (id) => (id ? id.replace(/-/g, '_') : '');

export const getStrategyMetadata = (id) => {
  if (!id) {
    return { label: 'Strategy', icon: '🏦' };
  }
  if (STRATEGY_METADATA[id]) {
    return STRATEGY_METADATA[id];
  }
  const normalized = normalizeStrategyId(id);
  return STRATEGY_METADATA[normalized] || {
    label: normalized.replace(/_/g, ' '),
    icon: '🏦'
  };
};

export const formatCurrency = (value) => {
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  const number = Number(value);
  if (Number.isNaN(number)) {
    return '';
  }
  return number.toLocaleString('en-US');
};

export const parseCurrency = (value) => {
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  const sanitized = String(value).replace(/[^0-9.]/g, '');
  return sanitized ? Number(sanitized) : '';
};

export const computeSmartWeights = (holdings) => {
  if (!holdings || holdings <= 0) {
    return { suggestedMin: '', suggestedMax: '' };
  }
  const suggestedMin = Math.max(1, Number((100 / (holdings * 1.5)).toFixed(2)));
  const suggestedMax = Math.min(20, Number((100 / (holdings * 0.7)).toFixed(2)));
  return { suggestedMin, suggestedMax };
};

export const getPresetMatch = (generalParams, constraints) => {
  return Object.entries(PRESETS).find(([_, preset]) =>
    preset.generalParams.num_holdings === generalParams.num_holdings &&
    preset.generalParams.rebalancing_frequency === generalParams.rebalancing_frequency &&
    preset.constraints.max_weight_per_stock === constraints.max_weight_per_stock &&
    preset.constraints.min_weight_per_stock === constraints.min_weight_per_stock
  )?.[0] || null;
};

export const getDefaultState = (selectedStrategies) => ({
  industry: 'Software & Services',
  sector: 'Information Technology',
  selectedStrategies,
  generalParams: { ...DEFAULT_GENERAL_PARAMS },
  constraints: { ...DEFAULT_CONSTRAINTS },
  strategyConfigs: {
    factor_based: { ...DEFAULT_FACTOR_CONFIG },
    risk_optimized: { ...DEFAULT_RISK_CONFIG },
    equal_weight: { ...DEFAULT_EQUAL_WEIGHT_CONFIG },
    cluster_based: { ...DEFAULT_CLUSTER_CONFIG }
  },
  validation: {
    isValid: false,
    errors: [],
    warnings: []
  },
  isBuilding: false,
  activePreset: 'balanced'
});

export const persistState = (state) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Unable to persist fund parameters state', error);
  }
};

export const loadPersistedState = () => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = window.sessionStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn('Unable to load fund parameters state', error);
    return null;
  }
};
