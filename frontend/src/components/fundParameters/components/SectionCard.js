import React from 'react';

const SectionCard = ({ title, subtitle, children, rightContent }) => (
  <div className="fp-card">
    <div className="fp-card-head">
      <div>
        <div className="fp-card-title">{title}</div>
        {subtitle && <div className="fp-card-subtitle">{subtitle}</div>}
      </div>
      {rightContent && <div className="fp-card-extra">{rightContent}</div>}
    </div>
    <div className="fp-card-body">{children}</div>
  </div>
);

export default SectionCard;
