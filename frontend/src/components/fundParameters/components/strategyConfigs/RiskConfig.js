import React from 'react';
import { OBJECTIVE_OPTIONS } from '../../constants';
import { CheckboxField, NumberField } from '../FormFields';

const RiskConfig = ({ config, onUpdate }) => {
  const handleObjectiveChange = (objective) => {
    onUpdate({ objective });
  };

  const handleCustomWeightChange = (field, value) => {
    const safeValue = Math.max(0, Math.min(100, value));
    const counterpart = field === 'return_weight' ? 'risk_weight' : 'return_weight';
    onUpdate({
      [field]: safeValue,
      [counterpart]: 100 - safeValue
    });
  };

  return (
    <div className="fp-strategy-card">
      <div className="fp-radio-list">
        {OBJECTIVE_OPTIONS.map((option) => (
          <label key={option.value} className={`fp-radio ${config.objective === option.value ? 'checked' : ''}`}>
            <input
              type="radio"
              name="risk-objective"
              checked={config.objective === option.value}
              onChange={() => handleObjectiveChange(option.value)}
            />
            <div className="fp-radio-content">
              <div className="fp-radio-title">{option.label}</div>
              {option.value === 'min_vol' && <div className="fp-radio-subtitle">Find lowest-risk portfolio combination</div>}
              {option.value === 'max_sharpe' && <div className="fp-radio-subtitle">Best risk-adjusted returns</div>}
              {option.value === 'target_return' && (
                <div className="fp-radio-subtitle">
                  Target Annual Return:{' '}
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={config.target_return}
                    onChange={(event) => onUpdate({ target_return: Number(event.target.value) })}
                    className="fp-inline-input"
                    disabled={config.objective !== 'target_return'}
                  />
                  %
                </div>
              )}
              {option.value === 'custom' && (
                <div className="fp-radio-subtitle">
                  Return Weight:{' '}
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={config.return_weight}
                    onChange={(event) => handleCustomWeightChange('return_weight', Number(event.target.value))}
                    className="fp-inline-input"
                    disabled={config.objective !== 'custom'}
                  />
                  % vs Risk Weight:{' '}
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={config.risk_weight}
                    onChange={(event) => handleCustomWeightChange('risk_weight', Number(event.target.value))}
                    className="fp-inline-input"
                    disabled={config.objective !== 'custom'}
                  />
                  %
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
      <details className="fp-advanced">
        <summary>Advanced settings</summary>
        <div className="fp-advanced-body">
          <CheckboxField
            label="Allow short positions"
            checked={config.allow_short}
            onChange={(checked) => onUpdate({ allow_short: checked })}
          />
          <CheckboxField
            label="Include transaction costs (0.1% per trade)"
            checked={config.transaction_costs}
            onChange={(checked) => onUpdate({ transaction_costs: checked })}
          />
          <CheckboxField
            label="Consider tax efficiency"
            checked={config.tax_efficiency}
            onChange={(checked) => onUpdate({ tax_efficiency: checked })}
          />
          <NumberField
            label="Risk-free rate"
            value={config.risk_free_rate}
            onChange={(value) => onUpdate({ risk_free_rate: value })}
            min={0}
            max={10}
            step={0.1}
            suffix="%"
          />
        </div>
      </details>
    </div>
  );
};

export default RiskConfig;
