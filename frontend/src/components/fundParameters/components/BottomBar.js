import React from 'react';
import { Loader2 } from 'lucide-react';

const BottomBar = ({ isValid, isBuilding, onBack, onBuild }) => (
  <div className="fp-bottom-bar">
    <button type="button" className="fp-back-button" onClick={onBack}>
      ← Back to Strategies
    </button>
    <div className="fp-bottom-status">Estimated construction time: ~30 seconds</div>
    <button
      type="button"
      disabled={!isValid || isBuilding}
      className={`fp-build-button ${!isValid ? 'disabled' : ''}`}
      onClick={onBuild}
      title={!isValid ? 'Resolve validation items to continue' : 'Build funds & simulate'}
    >
      {isBuilding ? (
        <>
          <Loader2 className="fp-spinner" size={16} />
          Building...
        </>
      ) : (
        <>Build Funds &amp; Simulate →</>
      )}
    </button>
  </div>
);

export default BottomBar;
