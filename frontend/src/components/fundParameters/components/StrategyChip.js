import React from 'react';
import { X } from 'lucide-react';
import { getStrategyMetadata } from '../utils';

const StrategyChip = ({ strategyId, onRemove }) => {
  const metadata = getStrategyMetadata(strategyId);
  return (
    <div className="fp-chip">
      <span className="fp-chip-icon">{metadata.icon}</span>
      <span className="fp-chip-label">{metadata.label}</span>
      {onRemove && (
        <button
          type="button"
          className="fp-chip-remove"
          onClick={() => onRemove(strategyId)}
          aria-label={`Remove ${metadata.label}`}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default StrategyChip;
