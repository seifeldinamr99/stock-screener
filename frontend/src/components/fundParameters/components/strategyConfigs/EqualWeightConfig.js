import React from 'react';
import { NumberField, SliderField, CheckboxField } from '../FormFields';

const EqualWeightConfig = ({ config, onUpdate }) => {
  const handleMethodChange = (method) => {
    onUpdate({
      selection_method: method,
      quality_filter: {
        ...config.quality_filter,
        enabled: method === 'quality'
      }
    });
  };

  return (
    <div className="fp-strategy-card">
      <div className="fp-radio-list">
        <label className={`fp-radio ${config.selection_method === 'random' ? 'checked' : ''}`}>
          <input
            type="radio"
            name="equal-selection"
            checked={config.selection_method === 'random'}
            onChange={() => handleMethodChange('random')}
          />
          <div className="fp-radio-content">
            <div className="fp-radio-title">Random Selection</div>
            <div className="fp-radio-subtitle">Randomly choose from all available stocks</div>
          </div>
        </label>
        <label className={`fp-radio ${config.selection_method === 'diversified' ? 'checked' : ''}`}>
          <input
            type="radio"
            name="equal-selection"
            checked={config.selection_method === 'diversified'}
            onChange={() => handleMethodChange('diversified')}
          />
          <div className="fp-radio-content">
            <div className="fp-radio-title">Diversified Selection</div>
            <div className="fp-radio-subtitle">Ensure representation across all company types</div>
          </div>
        </label>
        <label className={`fp-radio ${config.selection_method === 'quality' ? 'checked' : ''}`}>
          <input
            type="radio"
            name="equal-selection"
            checked={config.selection_method === 'quality'}
            onChange={() => handleMethodChange('quality')}
          />
          <div className="fp-radio-content">
            <div className="fp-radio-title">Quality-Filtered Random</div>
            <div className="fp-radio-subtitle">Only select from stocks meeting quality criteria</div>
          </div>
        </label>
      </div>

      {config.selection_method === 'quality' && (
        <div className="fp-quality-options">
          <CheckboxField
            label="Positive earnings"
            checked={config.quality_filter.enabled}
            onChange={(checked) =>
              onUpdate({
                quality_filter: { ...config.quality_filter, enabled: checked }
              })
            }
          />
          <NumberField
            label="Minimum market cap"
            value={config.quality_filter.min_market_cap}
            onChange={(value) =>
              onUpdate({
                quality_filter: { ...config.quality_filter, min_market_cap: value }
              })
            }
            prefix="$"
            helper="In USD"
            step={100000000}
          />
          <NumberField
            label="Maximum debt-to-equity"
            value={config.quality_filter.max_debt_to_equity}
            onChange={(value) =>
              onUpdate({
                quality_filter: { ...config.quality_filter, max_debt_to_equity: value }
              })
            }
            step={0.1}
          />
        </div>
      )}

      <SliderField
        label="Rebalancing tolerance"
        min={1}
        max={20}
        value={config.rebalancing_tolerance}
        suffix="%"
        helper="Allow ± drift before rebalancing"
        onChange={(value) => onUpdate({ rebalancing_tolerance: value })}
      />
    </div>
  );
};

export default EqualWeightConfig;
