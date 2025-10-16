import React from 'react';
import { formatCurrency } from '../utils';

const SummaryCard = ({ generalParams, constraints, selectedCount, onNavigateBack }) => (
  <div className="fp-summary-card">
    <div className="fp-summary-row">
      <span>Total allocation range</span>
      <span>
        {generalParams.num_holdings * constraints.min_weight_per_stock}% - {generalParams.num_holdings * constraints.max_weight_per_stock}%
      </span>
    </div>
    <div className="fp-summary-row">
      <span>Initial investment</span>
      <span>${formatCurrency(generalParams.initial_investment)}</span>
    </div>
    <div className="fp-summary-row">
      <span>Strategies active</span>
      <span>{selectedCount}</span>
    </div>
    <button type="button" className="fp-secondary-button" onClick={onNavigateBack}>
      ← Back to Strategies
    </button>
  </div>
);

export default SummaryCard;
