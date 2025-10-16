import React from 'react';
import { STRATEGY_SECTION_ORDER } from '../constants';
import { getStrategyMetadata } from '../utils';
import StrategyCollapsible from './StrategyCollapsible';
import FactorConfig from './strategyConfigs/FactorConfig';
import RiskConfig from './strategyConfigs/RiskConfig';
import EqualWeightConfig from './strategyConfigs/EqualWeightConfig';
import ClusterConfig from './strategyConfigs/ClusterConfig';

const configComponentMap = {
  factor_based: FactorConfig,
  risk_optimized: RiskConfig,
  equal_weight: EqualWeightConfig,
  cluster_based: ClusterConfig
};

const StrategyContainer = ({ selectedStrategies, strategyConfigs, generalParams, onStrategyConfigChange }) => {
  const orderedStrategies = STRATEGY_SECTION_ORDER.filter((strategy) => selectedStrategies.includes(strategy));

  if (!orderedStrategies.length) {
    return <div className="fp-empty-warning">Select strategies to configure their parameters.</div>;
  }

  return (
    <div className="fp-strategy-container">
      {orderedStrategies.map((strategy) => {
        const metadata = getStrategyMetadata(strategy);
        const Component = configComponentMap[strategy];
        if (!Component) return null;
        return (
          <StrategyCollapsible key={strategy} metadata={metadata} strategyKey={strategy}>
            <Component
              config={strategyConfigs[strategy]}
              generalParams={generalParams}
              onUpdate={(updates) => onStrategyConfigChange(strategy, updates)}
            />
          </StrategyCollapsible>
        );
      })}
    </div>
  );
};

export default StrategyContainer;
