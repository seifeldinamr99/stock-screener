import React from 'react';
import StrategyChip from './StrategyChip';
import SectionCard from './SectionCard';

const PageHeader = ({
  sectorName,
  industryName,
  selectedStrategies,
  onRemoveStrategy
}) => (
  <header className="fp-header">
    <div className="fp-header-text">
      <span className="fp-header-breadcrumb">
        Fund simulation · {sectorName} › {industryName || 'All Industries'}
      </span>
      <h1 className="fp-header-title">Configure Your Funds</h1>
      <div className="fp-header-counter">
        Selected Strategies ({selectedStrategies.length})
      </div>
    </div>
    <div className="fp-header-chips">
      {selectedStrategies.length > 0 ? (
        selectedStrategies.map((strategy) => (
          <StrategyChip
            key={strategy}
            strategyId={strategy}
            onRemove={onRemoveStrategy}
          />
        ))
      ) : (
        <div className="fp-empty-warning">Please select at least one strategy</div>
      )}
    </div>
  </header>
);

export default PageHeader;
