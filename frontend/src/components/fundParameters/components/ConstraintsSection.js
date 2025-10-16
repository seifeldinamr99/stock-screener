import React from 'react';
import { Info } from 'lucide-react';
import SectionCard from './SectionCard';
import { CheckboxField, NumberField } from './FormFields';

const ConstraintsSection = ({
  constraints,
  smartWeights,
  hasConstraintError,
  onConstraintChange,
  onToggleStrict,
  onToggleDeviation
}) => (
  <SectionCard
    title="Diversification Constraints"
    subtitle="Control per-position weights and constraint strictness"
    rightContent={(
      <div
        className="fp-smart-hint"
        title={`Suggested min ${smartWeights.suggestedMin}% · max ${smartWeights.suggestedMax}%`}
      >
        Smart suggestions: min {smartWeights.suggestedMin}% · max {smartWeights.suggestedMax}%
      </div>
    )}
  >
    <div className="fp-grid fp-grid-2">
      <NumberField
        label="Max weight per stock"
        value={constraints.max_weight_per_stock}
        onChange={(value) => onConstraintChange('max_weight_per_stock', value)}
        min={3}
        max={10}
        suffix="%"
        helper="Controls concentration risk"
        required
        isValid={constraints.max_weight_per_stock > constraints.min_weight_per_stock}
      />
      <NumberField
        label="Min weight per stock"
        value={constraints.min_weight_per_stock}
        onChange={(value) => onConstraintChange('min_weight_per_stock', value)}
        min={1}
        max={5}
        suffix="%"
        helper="Ensures minimum exposure"
        required
        isValid={constraints.max_weight_per_stock > constraints.min_weight_per_stock}
      />
    </div>
    <div className="fp-info-row">
      <Info size={14} />
      Individual stock limits to prevent over-concentration.
    </div>
    <div className="fp-checkboxes">
      <CheckboxField
        label="Apply constraints strictly"
        checked={constraints.strict_constraints}
        onChange={onToggleStrict}
      />
      <CheckboxField
        label="Allow minor deviations (±2%) for optimization"
        checked={constraints.allow_deviations}
        onChange={onToggleDeviation}
      />
    </div>
    {hasConstraintError && (
      <div className="fp-error-banner">❌ Constraints don't add up to 100%. Adjust min/max weights.</div>
    )}
  </SectionCard>
);

export default ConstraintsSection;
