export const STRATEGY_METADATA = {
  market_cap: { label: 'Market-Cap Weighted', icon: '🏢' },
  market_cap_weighted: { label: 'Market-Cap Weighted', icon: '🏢' },
  market_capitalization: { label: 'Market-Cap Weighted', icon: '🏢' },
  'market-cap': { label: 'Market-Cap Weighted', icon: '🏢' },
  equal_weight: { label: 'Equal Weighted', icon: '⚖️' },
  equal_weighted: { label: 'Equal Weighted', icon: '⚖️' },
  'equal-weighted': { label: 'Equal Weighted', icon: '⚖️' },
  factor_based: { label: 'Factor-Based', icon: '📈' },
  'factor-based': { label: 'Factor-Based', icon: '📈' },
  risk_optimized: { label: 'Risk-Optimized', icon: '🎯' },
  'risk-optimized': { label: 'Risk-Optimized', icon: '🎯' },
  cluster_based: { label: 'Cluster-Based', icon: '📊' },
  'cluster-based': { label: 'Cluster-Based', icon: '📊' }
};

export const DEFAULT_GENERAL_PARAMS = {
  num_holdings: 25,
  investment_horizon: 4,
  initial_investment: 100000,
  rebalancing_frequency: 'quarterly'
};

export const DEFAULT_CONSTRAINTS = {
  max_weight_per_stock: 5,
  min_weight_per_stock: 3,
  strict_constraints: true,
  allow_deviations: false
};

export const DEFAULT_FACTOR_CONFIG = {
  primary_factor: 'growth',
  secondary_factor: 'quality',
  factor_split: [70, 30],
  growth_thresholds: { revenue_growth: 20, earnings_growth: 15 },
  value_thresholds: { pe_ratio: 20, pb_ratio: 5, dividend_yield: 2 },
  quality_thresholds: { roe: 15, profit_margin: 10, debt_to_equity: 1.0 },
  momentum_thresholds: { return_6m: 10, relative_strength: 50 },
  secondary_none: false,
  qualifying_companies: 45
};

export const DEFAULT_RISK_CONFIG = {
  objective: 'max_sharpe',
  target_return: 12,
  return_weight: 60,
  risk_weight: 40,
  allow_short: false,
  transaction_costs: false,
  tax_efficiency: false,
  risk_free_rate: 4.5
};

export const DEFAULT_EQUAL_WEIGHT_CONFIG = {
  selection_method: 'random',
  quality_filter: {
    enabled: false,
    min_market_cap: 1000000000,
    max_debt_to_equity: 2.0
  },
  rebalancing_tolerance: 5
};

export const DEFAULT_CLUSTER_CONFIG = {
  method: 'business_model',
  selection_criteria: 'market_cap',
  distribution: 'equal',
  num_clusters: 8,
  companies_per_cluster: 3,
  tier_allocation: {
    mega: 6,
    large: 8,
    mid: 6,
    small: 5
  },
  region_allocation: {
    us: 8,
    china: 4,
    europe: 4,
    israel: 3,
    apac: 6
  },
  ml_company_target: 8
};

export const PRESETS = {
  conservative: {
    label: 'Conservative',
    icon: '🛡️',
    generalParams: { num_holdings: 30, rebalancing_frequency: 'quarterly' },
    constraints: { max_weight_per_stock: 3, min_weight_per_stock: 2 }
  },
  balanced: {
    label: 'Balanced',
    icon: '⚖️',
    generalParams: { num_holdings: 25, rebalancing_frequency: 'quarterly' },
    constraints: { max_weight_per_stock: 5, min_weight_per_stock: 3 }
  },
  aggressive: {
    label: 'Aggressive',
    icon: '🚀',
    generalParams: { num_holdings: 20, rebalancing_frequency: 'monthly' },
    constraints: { max_weight_per_stock: 8, min_weight_per_stock: 4 }
  }
};

export const REBALANCING_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi-annual', label: 'Semi-Annually' },
  { value: 'annual', label: 'Annually' }
];

export const FACTOR_OPTIONS = [
  { value: 'growth', label: 'Growth' },
  { value: 'value', label: 'Value' },
  { value: 'quality', label: 'Quality' },
  { value: 'momentum', label: 'Momentum' }
];

export const SECONDARY_FACTOR_OPTIONS = [...FACTOR_OPTIONS, { value: 'none', label: 'None' }];

export const OBJECTIVE_OPTIONS = [
  { value: 'min_vol', label: 'Minimize Portfolio Volatility' },
  { value: 'max_sharpe', label: 'Maximize Sharpe Ratio' },
  { value: 'target_return', label: 'Target Return with Minimum Risk' },
  { value: 'custom', label: 'Custom Multi-Objective' }
];

export const DISTRIBUTION_METHODS = [
  { value: 'equal', label: 'Equal per Cluster' },
  { value: 'weighted', label: 'Weighted by Cluster Size' },
  { value: 'custom', label: 'Custom Allocation' }
];

export const STRATEGY_SECTION_ORDER = ['factor_based', 'risk_optimized', 'equal_weight', 'cluster_based'];

export const STORAGE_KEY = 'fundParametersPageState';
