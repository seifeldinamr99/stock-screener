import React from 'react';

export const NumberField = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  prefix,
  helper,
  required,
  onBlur,
  isValid = true
}) => (
  <div className="fp-field">
    <div className="fp-field-label-row">
      <label className="fp-field-label">
        {label}
        {required && <span className="fp-required">*</span>}
      </label>
      {helper && <span className="fp-field-helper">{helper}</span>}
    </div>
    <div className={`fp-number-input ${!isValid ? 'invalid' : ''}`}>
      {prefix && <span className="fp-affix">{prefix}</span>}
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
        min={min}
        max={max}
        step={step}
        onBlur={onBlur}
      />
      {suffix && <span className="fp-affix">{suffix}</span>}
    </div>
  </div>
);

export const SliderField = ({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  displayValue,
  suffix,
  helper
}) => (
  <div className="fp-field">
    <div className="fp-field-label-row">
      <label className="fp-field-label">{label}</label>
      <span className="fp-field-value">
        {displayValue ?? value}
        {suffix}
      </span>
    </div>
    {helper && <div className="fp-field-helper">{helper}</div>}
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="fp-slider"
    />
  </div>
);

export const CheckboxField = ({ label, checked, onChange, className }) => (
  <label className={`fp-checkbox ${className || ''}`}>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <span>{label}</span>
  </label>
);
