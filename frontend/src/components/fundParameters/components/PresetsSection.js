import React from 'react';
import { RefreshCw } from 'lucide-react';
import SectionCard from './SectionCard';
import { PRESETS } from '../constants';

const PresetsSection = ({ activePreset, onPresetSelect, onCustom }) => (
  <SectionCard
    title="Quick Presets"
    subtitle="Apply recommended allocations instantly"
    rightContent={(
      <button type="button" className="fp-link-button" onClick={onCustom}>
        <RefreshCw size={14} />
        Custom
      </button>
    )}
  >
    <div className="fp-presets">
      {Object.entries(PRESETS).map(([key, preset]) => {
        const isActive = activePreset === key;
        return (
          <button
            key={key}
            type="button"
            className={`fp-preset ${isActive ? 'active' : ''}`}
            onClick={() => onPresetSelect(key)}
          >
            <span className="fp-preset-icon">{preset.icon}</span>
            <div>
              <div className="fp-preset-title">{preset.label}</div>
              <div className="fp-preset-details">
                {preset.generalParams.num_holdings} holdings · Max {preset.constraints.max_weight_per_stock}% · Min {preset.constraints.min_weight_per_stock}%
              </div>
            </div>
            {isActive && <span className="fp-badge">Active</span>}
          </button>
        );
      })}
    </div>
  </SectionCard>
);

export default PresetsSection;
