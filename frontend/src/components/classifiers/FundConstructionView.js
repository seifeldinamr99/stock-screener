import React, { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Info, X } from 'lucide-react';

const FundConstructionView = ({
  sectorName,
  industryName,
  strategies,
  selectedStrategies,
  maxStrategies = 5,
  onStrategyToggle,
  onBackToIndustry,
  onContinue
}) => {
  const [activeStrategy, setActiveStrategy] = useState(null);

  const effectiveMaxStrategies = Math.max(5, maxStrategies || 0);
  const selectionCount = selectedStrategies.length;
  const selectionStatus = `${selectionCount}/${effectiveMaxStrategies}`;
  const cards = useMemo(() => strategies, [strategies]);

  const handleBackClick = () => {
    if (onBackToIndustry) {
      onBackToIndustry();
    }
  };

  const handleContinueClick = () => {
    if (onContinue) {
      onContinue();
    }
  };

  const handleLearnMore = (strategy) => {
    setActiveStrategy(strategy);
  };

  const handleCloseModal = () => {
    setActiveStrategy(null);
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#0f172a', color: '#ffffff' }}>
      <div style={{ padding: '24px 28px', borderBottom: '1px solid #475569', backgroundColor: '#1e293b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>Fund simulation</div>
            <h1 style={{ fontSize: '24px', margin: 0, color: '#e2e8f0' }}>
              Build Funds for {industryName ? `${industryName} (${sectorName})` : sectorName}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handleBackClick}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #475569',
                color: '#d1d5db',
                padding: '10px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Back to Industry Details
            </button>
            <button
              onClick={handleContinueClick}
              disabled={selectionCount === 0}
              style={{
                backgroundColor: selectionCount === 0 ? '#334155' : '#00917C',
                color: selectionCount === 0 ? '#94a3b8' : '#ffffff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '6px',
                cursor: selectionCount === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Continue to Parameters
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '28px', maxWidth: '1100px', margin: '0 auto' }}>
        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #475569',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#e2e8f0' }}>Fund Construction Strategies</h2>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
                Select up to {effectiveMaxStrategies} strategies for side-by-side simulation.
              </p>
            </div>
            <div style={{
              padding: '6px 12px',
              borderRadius: '9999px',
              backgroundColor: '#0f172a',
              border: '1px solid #475569',
              fontSize: '13px',
              color: selectionCount >= effectiveMaxStrategies ? '#FFCE7B' : '#00FFDA',
              fontWeight: 600
            }}>
              Currently selected: {selectionStatus}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {cards.map((strategy) => {
            const isSelected = selectedStrategies.includes(strategy.key);
            const isDisabled = !isSelected && selectionCount >= effectiveMaxStrategies;
            const borderColor = isSelected ? '#00917C' : '#475569';

            return (
              <div
                key={strategy.key}
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid ' + borderColor,
                  borderRadius: '12px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: isSelected ? '0 14px 30px rgba(0, 145, 124, 0.25)' : 'none',
                  opacity: isDisabled ? 0.6 : 1,
                  transition: 'border-color 0.2s ease'
                }}
              >
                <button
                  onClick={() => onStrategyToggle(strategy.key)}
                  disabled={isDisabled}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    padding: 0
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                    {isSelected ? (
                      <CheckCircle2 style={{ color: '#00FFDA', width: '20px', height: '20px' }} />
                    ) : (
                      <Circle style={{ color: '#64748b', width: '20px', height: '20px' }} />
                    )}
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>
                        {strategy.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#ffffff' }}>
                        {strategy.subtitle}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: isSelected ? '#00FFDA' : '#94a3b8',
                    fontWeight: 600
                  }}>
                    {isSelected ? 'Selected' : 'Select'}
                  </div>
                </button>

                <div style={{ fontSize: '13px', color: '#ffffff', minHeight: '36px' }}>
                  {strategy.description}
                </div>

                <button
                  onClick={() => handleLearnMore(strategy)}
                  style={{
                    border: '1px solid #475569',
                    backgroundColor: '#0f172a',
                    color: '#e2e8f0',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info style={{ width: '14px', height: '14px' }} />
                    Learn More
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {activeStrategy && (
        <StrategyDetailModal strategy={activeStrategy} onClose={handleCloseModal} />
      )}
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div>
    <div style={{ fontSize: '11px', letterSpacing: '0.04em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '2px' }}>
      {label}
    </div>
    <div style={{ fontSize: '13px', color: '#e2e8f0' }}>{value}</div>
  </div>
);

const BulletRow = ({ title, items = [], accent }) => (
  <div>
    <div style={{ fontSize: '11px', letterSpacing: '0.04em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}>
      {title}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {items?.map((item, index) => (
        <div key={`${title}-${index}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: '#f8fafc', fontSize: '13px' }}>
          <span style={{ color: accent, lineHeight: '20px' }}>-</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  </div>
);

const StrategyDetailModal = ({ strategy, onClose }) => {
  if (!strategy) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        zIndex: 999
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: '#0f172a',
          borderRadius: '12px',
          border: '1px solid #475569',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)',
          color: '#e2e8f0',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>{strategy.subtitle}</div>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '22px', color: '#f8fafc' }}>{strategy.name}</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid #475569',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
            aria-label="Close strategy details"
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        <div style={{ fontSize: '14px', color: '#ffffff' }}>{strategy.description}</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <DetailRow label="Selection" value={strategy.selection} />
          <DetailRow label="Weighting" value={strategy.weighting} />
          <DetailRow label="Best For" value={strategy.bestFor} />
          <DetailRow label="Risk" value={strategy.risk} />
        </div>

        <BulletRow title="Pros" items={strategy.pros} accent="#00FFDA" />
        <BulletRow title="Cons" items={strategy.cons} accent="#FF7A18" />

        <button
          onClick={onClose}
          style={{
            marginTop: '8px',
            alignSelf: 'flex-end',
            backgroundColor: '#00917C',
            border: 'none',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 600,
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default FundConstructionView;
