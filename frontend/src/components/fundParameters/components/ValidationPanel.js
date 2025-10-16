import React from 'react';
import { AlertTriangle, CheckCircle2, SlidersHorizontal } from 'lucide-react';

const ValidationPanel = ({ validation }) => {
  const { errors = [], warnings = [], isValid } = validation;
  const hasErrors = errors.length > 0;

  return (
    <div className="fp-validation-card">
      <div className="fp-validation-header">
        <SlidersHorizontal size={16} />
        <span>Validation Status</span>
      </div>
      <div className="fp-validation-summary">
        {isValid && !hasErrors ? (
          <>
            <CheckCircle2 size={16} className="fp-validation-icon success" />
            <span>All parameters valid</span>
          </>
        ) : (
          <>
            <AlertTriangle size={16} className="fp-validation-icon warning" />
            <span>Review outstanding checks</span>
          </>
        )}
      </div>
      <div className="fp-validation-divider" />
      <div className="fp-validation-body">
        {errors.map((error) => (
          <div key={`error-${error.id}`} className="fp-validation-item error">
            <span className="fp-validation-symbol">❌</span>
            <div>
              <div className="fp-validation-title">{error.title}</div>
              <div className="fp-validation-message">{error.message}</div>
            </div>
          </div>
        ))}
        {warnings.map((warning) => (
          <div key={`warning-${warning.id}`} className="fp-validation-item warning">
            <span className="fp-validation-symbol">⚠️</span>
            <div>
              <div className="fp-validation-title">{warning.title}</div>
              <div className="fp-validation-message">{warning.message}</div>
            </div>
          </div>
        ))}
        {!errors.length && !warnings.length && (
          <div className="fp-validation-item success">
            <span className="fp-validation-symbol">✓</span>
            <div>
              <div className="fp-validation-title">Ready</div>
              <div className="fp-validation-message">All checks passed</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationPanel;
