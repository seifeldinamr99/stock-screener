import React, { Fragment } from 'react';
import { Shield } from 'lucide-react';
import { FACTOR_OPTIONS, SECONDARY_FACTOR_OPTIONS } from '../../constants';
import { SliderField } from '../FormFields';

const FactorConfig = ({ config, onUpdate, generalParams }) => {
  const handleSplitChange = (primaryWeight) => {
    const normalized = Math.min(100, Math.max(0, primaryWeight));
    onUpdate({ factor_split: [normalized, 100 - normalized] });
  };

  const handleThresholdChange = (factorKey, key, value) => {
    const thresholdKey = `${factorKey}_thresholds`;
    onUpdate({
      [thresholdKey]: {
        ...config[thresholdKey],
        [key]: value
      }
    });
  };

  const selectedFactors = [
    config.primary_factor,
    config.secondary_factor !== 'none' ? config.secondary_factor : null
  ].filter(Boolean);

  const growthFields = (
    <div className="fp-factor-section">
      <div className="fp-factor-title">Growth Factor Thresholds</div>
      <SliderField
        label="Revenue Growth >"
        min={0}
        max={50}
        value={config.growth_thresholds.revenue_growth}
        suffix="%"
        onChange={(value) => handleThresholdChange('growth', 'revenue_growth', value)}
      />
      <SliderField
        label="Earnings Growth >"
        min={0}
        max={50}
        value={config.growth_thresholds.earnings_growth}
        suffix="%"
        onChange={(value) => handleThresholdChange('growth', 'earnings_growth', value)}
      />
    </div>
  );

  const valueFields = (
    <div className="fp-factor-section">
      <div className="fp-factor-title">Value Factor Thresholds</div>
      <SliderField
        label="P/E Ratio <"
        min={5}
        max={50}
        value={config.value_thresholds.pe_ratio}
        onChange={(value) => handleThresholdChange('value', 'pe_ratio', value)}
      />
      <SliderField
        label="P/B Ratio <"
        min={1}
        max={10}
        step={0.1}
        value={config.value_thresholds.pb_ratio}
        onChange={(value) => handleThresholdChange('value', 'pb_ratio', value)}
      />
      <SliderField
        label="Dividend Yield >"
        min={0}
        max={10}
        value={config.value_thresholds.dividend_yield}
        suffix="%"
        onChange={(value) => handleThresholdChange('value', 'dividend_yield', value)}
      />
    </div>
  );

  const qualityFields = (
    <div className="fp-factor-section">
      <div className="fp-factor-title">Quality Factor Thresholds</div>
      <SliderField
        label="ROE >"
        min={0}
        max={50}
        value={config.quality_thresholds.roe}
        suffix="%"
        onChange={(value) => handleThresholdChange('quality', 'roe', value)}
      />
      <SliderField
        label="Profit Margin >"
        min={0}
        max={30}
        value={config.quality_thresholds.profit_margin}
        suffix="%"
        onChange={(value) => handleThresholdChange('quality', 'profit_margin', value)}
      />
      <SliderField
        label="Debt-to-Equity <"
        min={0}
        max={3}
        step={0.1}
        value={config.quality_thresholds.debt_to_equity}
        onChange={(value) => handleThresholdChange('quality', 'debt_to_equity', Number(value))}
      />
    </div>
  );

  const momentumFields = (
    <div className="fp-factor-section">
      <div className="fp-factor-title">Momentum Factor Thresholds</div>
      <SliderField
        label="6-Month Return >"
        min={0}
        max={50}
        value={config.momentum_thresholds.return_6m}
        suffix="%"
        onChange={(value) => handleThresholdChange('momentum', 'return_6m', value)}
      />
      <SliderField
        label="Relative Strength >"
        min={0}
        max={100}
        value={config.momentum_thresholds.relative_strength}
        onChange={(value) => handleThresholdChange('momentum', 'relative_strength', value)}
      />
    </div>
  );

  const factorSections = {
    growth: growthFields,
    value: valueFields,
    quality: qualityFields,
    momentum: momentumFields
  };

  return (
    <div className="fp-strategy-card">
      <div className="fp-grid fp-grid-2">
        <div className="fp-field">
          <label className="fp-field-label">Primary Factor</label>
          <select
            className="fp-select"
            value={config.primary_factor}
            onChange={(event) => onUpdate({ primary_factor: event.target.value })}
          >
            {FACTOR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="fp-field">
          <label className="fp-field-label">Secondary Factor</label>
          <select
            className="fp-select"
            value={config.secondary_factor}
            onChange={(event) => onUpdate({ secondary_factor: event.target.value })}
            disabled={config.secondary_none}
          >
            {SECONDARY_FACTOR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <label className="fp-checkbox inline">
            <input
              type="checkbox"
              checked={config.secondary_none}
              onChange={(event) => {
                const disabled = event.target.checked;
                onUpdate({
                  secondary_none: disabled,
                  secondary_factor: disabled ? 'none' : config.secondary_factor
                });
              }}
            />
            <span>Secondary None</span>
          </label>
        </div>
      </div>
      <SliderField
        label="Factor Allocation"
        min={0}
        max={100}
        value={config.factor_split[0]}
        suffix="%"
        helper="Balances allocation between primary and secondary factors"
        onChange={handleSplitChange}
      />
      <div className="fp-factor-split">
        Primary: {config.factor_split[0]}% | Secondary: {config.factor_split[1]}%
      </div>
      {selectedFactors.map((factor) => (
        <Fragment key={factor}>{factorSections[factor]}</Fragment>
      ))}
      <div className="fp-factor-footer">
        <Shield size={14} /> ✓ {config.qualifying_companies} companies meet these criteria
      </div>
      {config.qualifying_companies < generalParams.num_holdings && (
        <div className="fp-warning-banner">
          ⚠️ Only {config.qualifying_companies} companies meet thresholds. Adjust filters or reduce holdings.
        </div>
      )}
    </div>
  );
};

export default FactorConfig;
