import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const StrategyCollapsible = ({ metadata, strategyKey, children }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="fp-collapsible">
      <button className="fp-collapsible-trigger" type="button" onClick={() => setIsOpen((prev) => !prev)}>
        <div className="fp-collapsible-title">
          <span className="fp-collapsible-icon">{metadata.icon}</span>
          {metadata.label} Configuration
        </div>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isOpen && <div className="fp-collapsible-content">{children}</div>}
    </div>
  );
};

export default StrategyCollapsible;
