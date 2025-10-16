import React from 'react';
import { Loader2 } from 'lucide-react';
import { DISTRIBUTION_METHODS } from '../../constants';
import { NumberField, SliderField } from '../FormFields';

const tierOptions = [
  { key: 'mega', label: 'Mega-Cap (>$200B)' },
  { key: 'large', label: 'Large-Cap ($10B-$200B)' },
  { key: 'mid', label: 'Mid-Cap ($2B-$10B)' },
  { key: 'small', label: 'Small-Cap (<$2B)' }
];

const regionOptions = [
  { key: 'us', label: '🇺🇸 United States' },
  { key: 'china', label: '🇨🇳 China' },
  { key: 'europe', label: '🇪🇺 Europe' },
  { key: 'israel', label: '🇮🇱 Israel' },
  { key: 'apac', label: '🌏 APAC' }
];

const businessClusters = [
  { key: 'saas', label: '📦 SaaS', companies: 6, avgMc: '$48B' },
  { key: 'cloud', label: '☁️ Cloud', companies: 5, avgMc: '$36B' },
  { key: 'security', label: '🔒 Security', companies: 4, avgMc: '$18B' },
  { key: 'data', label: '🧠 Data & AI', companies: 5, avgMc: '$42B' },
  { key: 'payments', label: '💳 Payments', companies: 3, avgMc: '$22B' },
  { key: 'marketplace', label: '🏪 Marketplace', companies: 3, avgMc: '$12B' },
  { key: 'infrastructure', label: '🛠️ Infrastructure', companies: 4, avgMc: '$28B' },
  { key: 'devices', label: '💻 Devices', companies: 3, avgMc: '$16B' }
];

const ClusterConfig = ({ config, onUpdate, generalParams }) => {
  const totalAllocation = (() => {
    switch (config.method) {
      case 'market_cap':
        return Object.values(config.tier_allocation || {}).reduce((sum, val) => sum + Number(val || 0), 0);
      case 'geographic':
        return Object.values(config.region_allocation || {}).reduce((sum, val) => sum + Number(val || 0), 0);
      case 'business_model':
        return config.num_clusters * config.companies_per_cluster;
      case 'ml':
        return config.num_clusters * config.ml_company_target;
      default:
        return 0;
    }
  })();

  const handleAllocationChange = (group, key, value) => {
    const targetKey = group === 'region' ? 'region_allocation' : 'tier_allocation';
    onUpdate({
      [targetKey]: {
        ...(config[targetKey] || {}),
        [key]: value
      }
    });
  };

  return (
    <div className="fp-strategy-card">
      <div className="fp-radio-list inline">
        {[
          { value: 'business_model', title: 'Business Model Clustering (Recommended)', subtitle: 'Group by revenue model and business type' },
          { value: 'market_cap', title: 'Market Cap Tiers', subtitle: 'Group by company size' },
          { value: 'geographic', title: 'Geographic Focus', subtitle: 'Group by primary region' },
          { value: 'ml', title: 'Automatic ML Clustering', subtitle: 'Algorithm finds natural groupings' }
        ].map((option) => (
          <label key={option.value} className={`fp-radio ${config.method === option.value ? 'checked' : ''}`}>
            <input
              type="radio"
              name="cluster-method"
              checked={config.method === option.value}
              onChange={() => onUpdate({ method: option.value })}
            />
            <div className="fp-radio-content">
              <div className="fp-radio-title">{option.title}</div>
              <div className="fp-radio-subtitle">{option.subtitle}</div>
            </div>
          </label>
        ))}
      </div>

      {config.method === 'business_model' && (
        <div className="fp-table">
          <div className="fp-table-header">
            <span>Cluster Name</span>
            <span>Companies</span>
            <span>Avg MC</span>
          </div>
          {businessClusters.map((cluster) => (
            <div key={cluster.key} className="fp-table-row">
              <span>{cluster.label}</span>
              <span>{cluster.companies}</span>
              <span>{cluster.avgMc}</span>
            </div>
          ))}
          <button type="button" className="fp-link-button">View Cluster Details</button>
        </div>
      )}

      {config.method === 'market_cap' && (
        <div className="fp-tier-grid">
          {tierOptions.map((tier) => (
            <NumberField
              key={tier.key}
              label={tier.label}
              value={config.tier_allocation?.[tier.key] || 0}
              onChange={(value) => handleAllocationChange('tier', tier.key, value)}
              min={0}
              max={generalParams.num_holdings}
            />
          ))}
          <div className="fp-allocation-total">Total companies: {totalAllocation}</div>
        </div>
      )}

      {config.method === 'geographic' && (
        <div className="fp-tier-grid">
          {regionOptions.map((region) => (
            <NumberField
              key={region.key}
              label={region.label}
              value={config.region_allocation?.[region.key] || 0}
              onChange={(value) => handleAllocationChange('region', region.key, value)}
              min={0}
              max={generalParams.num_holdings}
            />
          ))}
          <div className="fp-allocation-total">Total companies: {totalAllocation}</div>
        </div>
      )}

      {config.method === 'business_model' && (
        <div className="fp-tier-grid">
          <NumberField
            label="Clusters"
            value={config.num_clusters}
            onChange={(value) => onUpdate({ num_clusters: value })}
            min={1}
            max={12}
          />
          <NumberField
            label="Companies per cluster"
            value={config.companies_per_cluster}
            onChange={(value) => onUpdate({ companies_per_cluster: value })}
            min={1}
            max={10}
          />
        </div>
      )}

      {config.method === 'ml' && (
        <div className="fp-ml">
          <SliderField
            label="Number of clusters"
            min={3}
            max={15}
            value={config.num_clusters}
            onChange={(value) => onUpdate({ num_clusters: value })}
          />
          <SliderField
            label="Companies per cluster"
            min={1}
            max={10}
            value={config.ml_company_target}
            onChange={(value) => onUpdate({ ml_company_target: value })}
          />
          <button type="button" className="fp-primary-button">
            {config.isRunning ? (
              <>
                <Loader2 size={14} className="fp-spinner" />
                Running analysis...
              </>
            ) : (
              'Run Clustering Analysis'
            )}
          </button>
        </div>
      )}

      <div className="fp-radio-list inline">
        {[
          { value: 'market_cap', label: 'Top by Market Cap' },
          { value: 'fundamentals', label: 'Best Fundamentals' },
          { value: 'balanced', label: 'Balanced Mix' },
          { value: 'random', label: 'Random Selection' }
        ].map((option) => (
          <label key={option.value} className={`fp-radio ${config.selection_criteria === option.value ? 'checked' : ''}`}>
            <input
              type="radio"
              name="cluster-selection"
              checked={config.selection_criteria === option.value}
              onChange={() => onUpdate({ selection_criteria: option.value })}
            />
            <div className="fp-radio-content">
              <div className="fp-radio-title">{option.label}</div>
            </div>
          </label>
        ))}
      </div>

      <div className="fp-radio-list inline">
        {DISTRIBUTION_METHODS.map((option) => (
          <label key={option.value} className={`fp-radio ${config.distribution === option.value ? 'checked' : ''}`}>
            <input
              type="radio"
              name="cluster-distribution"
              checked={config.distribution === option.value}
              onChange={() => onUpdate({ distribution: option.value })}
            />
            <div className="fp-radio-content">
              <div className="fp-radio-title">{option.label}</div>
            </div>
          </label>
        ))}
      </div>

      <div className="fp-allocation-total">
        Total planned companies: {totalAllocation} / target {generalParams.num_holdings}
      </div>
      {totalAllocation !== generalParams.num_holdings && (
        <div className="fp-warning-banner">
          ⚠️ Total clusters ({totalAllocation}) differ from holdings target ({generalParams.num_holdings}). Adjust allocations.
        </div>
      )}
    </div>
  );
};

export default ClusterConfig;
