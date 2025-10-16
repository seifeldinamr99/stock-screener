import React from 'react';
import SectionCard from './SectionCard';
import { SliderField } from './FormFields';
import { REBALANCING_OPTIONS } from '../constants';
import { formatCurrency } from '../utils';

const GeneralParametersSection = ({
  generalParams,
  validation,
  onNumHoldingsChange,
  onInvestmentHorizonChange,
  onInitialInvestmentChange,
  onInitialInvestmentBlur,
  onRebalancingChange
}) => {
  const investmentError = validation.errors.find((error) => error.id === 'investment-min');

  return (
    <SectionCard title="General Parameters" subtitle="Applied to all selected funds">
      <div className="fp-grid fp-grid-2">
        <SliderField
          label="Number of Holdings"
          min={20}
          max={30}
          step={1}
          value={generalParams.num_holdings}
          onChange={onNumHoldingsChange}
        />
        <SliderField
          label="Investment Horizon"
          min={1}
          max={10}
          step={1}
          value={generalParams.investment_horizon}
          suffix=" yrs"
          displayValue={`${generalParams.investment_horizon} years`}
          onChange={onInvestmentHorizonChange}
        />
        <div className="fp-field">
          <div className="fp-field-label-row">
            <label className="fp-field-label">Initial Investment</label>
            <div className="fp-validity">
              {investmentError ? (
                <span className="fp-error">Min $10,000</span>
              ) : (
                <span className="fp-success">✓ Valid</span>
              )}
            </div>
          </div>
          <div className={`fp-number-input ${investmentError ? 'invalid' : ''}`}>
            <span className="fp-affix">$</span>
            <input
              type="text"
              value={generalParams.initial_investment === '' ? '' : formatCurrency(generalParams.initial_investment)}
              onChange={(event) => onInitialInvestmentChange(event.target.value)}
              onBlur={onInitialInvestmentBlur}
              inputMode="numeric"
              placeholder="100,000"
            />
          </div>
          <div className="fp-field-helper">Range: $10,000 – $10,000,000</div>
        </div>
        <div className="fp-field">
          <label className="fp-field-label">Rebalancing Frequency</label>
          <select
            className="fp-select"
            value={generalParams.rebalancing_frequency}
            onChange={(event) => onRebalancingChange(event.target.value)}
          >
            {REBALANCING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </SectionCard>
  );
};

export default GeneralParametersSection;
