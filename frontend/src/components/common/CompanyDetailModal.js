import React, { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import {
  X,
  Calendar,
  TrendingUp,
  Activity,
  BarChart2,
  RefreshCcw,
  Clock,
  Database,
} from 'lucide-react';
import { stockApi } from '../../services/api';

const COLORS = {
  backdrop: 'rgba(8, 15, 31, 0.82)',
  surface: '#0f172a',
  surfaceAlt: '#111c34',
  border: '#1e293b',
  primary: '#2dd4bf',
  accent: '#FFCE7B',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  danger: '#f87171',
};

const RANGE_OPTIONS = [
  { label: '1M', value: 30 },
  { label: '3M', value: 90 },
  { label: '6M', value: 180 },
  { label: '1Y', value: 365 },
  { label: '5Y', value: 1825 },
  { label: 'MAX', value: 'max' },
];

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '—';
  if (Math.abs(value) >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  return `$${Number(value).toFixed(2)}`;
};

const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined) return '—';
  return Number(value).toFixed(decimals);
};

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
};

const deriveRangeStart = (history, rangeValue) => {
  if (rangeValue === 'max' || !history.length) {
    return null;
  }

  const lastPoint = history[history.length - 1];
  if (!lastPoint) return null;
  const lastDate = new Date(lastPoint.date);
  if (Number.isNaN(lastDate.getTime())) return null;

  const startDate = new Date(lastDate.getTime());
  startDate.setDate(startDate.getDate() - Number(rangeValue));
  return startDate;
};

const filterHistoryByRange = (history, rangeValue) => {
  if (rangeValue === 'max') return history;
  const startDate = deriveRangeStart(history, rangeValue);
  if (!startDate) return history;
  return history.filter((point) => {
    const pointDate = new Date(point.date);
    if (Number.isNaN(pointDate.getTime())) return false;
    return pointDate >= startDate;
  });
};

const buildChartData = (history) => {
  if (!history.length) {
    return {
      labels: [],
      datasets: [],
    };
  }

  const labels = history.map((point) => point.date);
  const prices = history.map((point) => point.close_price ?? point.adjusted_close ?? null);

  return {
    labels,
    datasets: [
      {
        label: 'Close Price',
        data: prices,
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(45, 212, 191, 0.15)',
        pointRadius: 0,
        fill: true,
        tension: 0.25,
      },
    ],
  };
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: '#0f172a',
      borderColor: '#2dd4bf',
      borderWidth: 1,
      titleColor: COLORS.textPrimary,
      bodyColor: COLORS.textPrimary,
      callbacks: {
        label(context) {
          const value = context.raw;
          if (value === null) return 'Close: —';
          return `Close: $${Number(value).toFixed(2)}`;
        },
      },
    },
  },
  scales: {
    x: {
      ticks: {
        color: COLORS.textSecondary,
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 8,
      },
      grid: {
        color: 'rgba(148, 163, 184, 0.08)',
      },
    },
    y: {
      ticks: {
        color: COLORS.textSecondary,
        callback(value) {
          if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
          return `$${value}`;
        },
      },
      grid: {
        color: 'rgba(148, 163, 184, 0.05)',
      },
    },
  },
};

const CompanyDetailModal = ({
  isOpen,
  ticker,
  exchange,
  companyName,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedRange, setSelectedRange] = useState('max');

  useEffect(() => {
    if (!isOpen || !ticker) return;

    let isActive = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [profileResponse, historyResponse] = await Promise.all([
          stockApi.getStockProfile({ ticker, exchange }),
          stockApi.getStockHistory({ ticker, exchange, window: 'max' }),
        ]);

        if (!isActive) return;

        setProfile(profileResponse.data);
        setHistory(historyResponse.data.results || []);
      } catch (err) {
        if (!isActive) return;
        console.error('Error loading company detail', err);
        setError('Unable to load company detail. Please try again later.');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isActive = false;
    };
  }, [isOpen, ticker, exchange]);

  useEffect(() => {
    if (isOpen) {
      setSelectedRange('max');
    }
  }, [isOpen, ticker]);

  const filteredHistory = useMemo(
    () => filterHistoryByRange(history, selectedRange),
    [history, selectedRange],
  );

  const chartData = useMemo(() => buildChartData(filteredHistory), [filteredHistory]);

  const latestPrice = profile?.latest_price;
  const priceChange = profile?.price_change;
  const changeColor =
    priceChange?.absolute > 0 ? '#22c55e' :
    priceChange?.absolute < 0 ? COLORS.danger : COLORS.textSecondary;

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: COLORS.backdrop,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1100px',
          background: `linear-gradient(160deg, ${COLORS.surfaceAlt} 0%, ${COLORS.surface} 60%)`,
          borderRadius: '16px',
          border: `1px solid ${COLORS.border}`,
          boxShadow: '0 40px 120px rgba(15, 23, 42, 0.6)',
          color: COLORS.textPrimary,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 28px',
            borderBottom: `1px solid ${COLORS.border}`,
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '0.02em' }}>
                {companyName || profile?.stock?.company_name || ticker}
              </h2>
              <span style={{ color: COLORS.primary, fontSize: '18px', fontWeight: 600 }}>
                {profile?.stock?.ticker || ticker}
              </span>
            </div>
            <div style={{ color: COLORS.textSecondary, fontSize: '13px', marginTop: '6px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span>{profile?.stock?.exchange_name || exchange}</span>
              <span>Sector: {profile?.stock?.sector_name || 'N/A'}</span>
              <span>Industry: {profile?.stock?.industry_name || 'N/A'}</span>
              {profile?.metadata?.prices_last_synced_at && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCcw style={{ width: 14, height: 14, color: COLORS.textSecondary }} />
                  Synced {formatDate(profile.metadata.prices_last_synced_at)}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: `1px solid ${COLORS.border}`,
              color: COLORS.textSecondary,
              borderRadius: '8px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            aria-label="Close company detail"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div style={{ padding: '24px 28px', overflowY: 'auto' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: COLORS.textSecondary }}>
              Loading company insight...
            </div>
          )}

          {!loading && error && (
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: COLORS.danger,
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && profile && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '16px',
                  marginBottom: '28px',
                }}
              >
                <div
                  style={{
                    background: COLORS.surfaceAlt,
                    borderRadius: '12px',
                    padding: '16px',
                    border: `1px solid ${COLORS.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <span style={{ color: COLORS.textSecondary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Last Close</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '22px', fontWeight: 700 }}>
                      {latestPrice?.close_price !== undefined ? `$${Number(latestPrice.close_price).toFixed(2)}` : '—'}
                    </span>
                    {priceChange?.absolute !== null && priceChange?.absolute !== undefined && (
                      <span style={{ color: changeColor, fontSize: '14px', fontWeight: 600 }}>
                        {priceChange.absolute > 0 ? '+' : ''}{formatNumber(priceChange.absolute)}
                        {priceChange?.percent !== null && priceChange?.percent !== undefined && (
                          <span style={{ marginLeft: '6px' }}>
                            ({priceChange.percent > 0 ? '+' : ''}{formatNumber(priceChange.percent)}%)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <span style={{ color: COLORS.textSecondary, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar style={{ width: 14, height: 14 }} />
                    {formatDate(profile?.history?.latest_date)}
                  </span>
                </div>

                <div
                  style={{
                    background: COLORS.surfaceAlt,
                    borderRadius: '12px',
                    padding: '16px',
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  <span style={{ color: COLORS.textSecondary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Market Cap</span>
                  <div style={{ fontSize: '22px', fontWeight: 700 }}>
                    {profile?.stock?.market_cap ? formatCurrency(profile.stock.market_cap) : '—'}
                  </div>
                  <span style={{ color: COLORS.textSecondary, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BarChart2 style={{ width: 14, height: 14 }} />
                    P/E: {profile?.stock?.pe_ratio ? Number(profile.stock.pe_ratio).toFixed(2) : '—'}
                  </span>
                </div>

                <div
                  style={{
                    background: COLORS.surfaceAlt,
                    borderRadius: '12px',
                    padding: '16px',
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  <span style={{ color: COLORS.textSecondary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>52 Week Range</span>
                  <div style={{ fontSize: '22px', fontWeight: 700 }}>
                    <span style={{ color: COLORS.accent }}>{profile?.history?.low_close ? `$${Number(profile.history.low_close).toFixed(2)}` : '—'}</span>
                    <span style={{ color: COLORS.textSecondary, margin: '0 8px' }}>→</span>
                    <span style={{ color: COLORS.primary }}>{profile?.history?.high_close ? `$${Number(profile.history.high_close).toFixed(2)}` : '—'}</span>
                  </div>
                  <span style={{ color: COLORS.textSecondary, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity style={{ width: 14, height: 14 }} />
                    Volume: {latestPrice?.volume ? latestPrice.volume.toLocaleString() : '—'}
                  </span>
                </div>

                <div
                  style={{
                    background: COLORS.surfaceAlt,
                    borderRadius: '12px',
                    padding: '16px',
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  <span style={{ color: COLORS.textSecondary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>History Coverage</span>
                  <div style={{ fontSize: '22px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp style={{ width: 18, height: 18, color: COLORS.primary }} />
                    {filteredHistory.length}
                    <span style={{ fontSize: '12px', color: COLORS.textSecondary, fontWeight: 500 }}>points</span>
                  </div>
                  <span style={{ color: COLORS.textSecondary, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar style={{ width: 14, height: 14 }} />
                    Since {formatDate(profile?.history?.available_from)}
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.72)',
                  borderRadius: '16px',
                  border: `1px solid ${COLORS.border}`,
                  padding: '20px 20px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, letterSpacing: '0.03em' }}>
                      Daily Close Price
                    </h3>
                    <span style={{ color: COLORS.textSecondary, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <Clock style={{ width: 16, height: 16 }} />
                      {formatDate(filteredHistory[0]?.date)} → {formatDate(filteredHistory[filteredHistory.length - 1]?.date)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', background: 'rgba(30, 41, 59, 0.9)', padding: '4px', borderRadius: '999px', border: `1px solid ${COLORS.border}` }}>
                    {RANGE_OPTIONS.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => setSelectedRange(option.value)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '999px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          backgroundColor: selectedRange === option.value ? COLORS.primary : 'transparent',
                          color: selectedRange === option.value ? '#052e2b' : COLORS.textSecondary,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ height: '320px' }}>
                  {filteredHistory.length > 0 ? (
                    <Line data={chartData} options={chartOptions} />
                  ) : (
                    <div style={{ textAlign: 'center', color: COLORS.textSecondary, padding: '40px 0' }}>
                      No historical data available.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div
          style={{
            padding: '16px 28px',
            borderTop: `1px solid ${COLORS.border}`,
            background: 'rgba(15, 23, 42, 0.72)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: COLORS.textSecondary,
            fontSize: '12px',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database style={{ width: 14, height: 14 }} />
            Data source: Yahoo Finance (via yfinance)
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.primary,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailModal;
