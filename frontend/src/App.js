import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import ScreenerPage from './ScreenerPage';
import ClassifiersPage from './ClassifiersPage';
import LenovoPage from './LenovoPage';
import AccessibleStocksPage from './AccessibleStocksPage';
import keheilanLogo from './keheilan-logo.png';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Main App Component with Routing
const App = () => {
  const [currentPage, setCurrentPage] = useState('screener');

  // Add CSS styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .sector-row:hover {
        background-color: #334155 !important;
      }
      .industry-row:hover:not(.selected) {
        background-color: #475569 !important;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes fadeInUp {
        0% {
          opacity: 0;
          transform: translateY(30px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .chart-container {
        animation: fadeInUp 0.6s ease-out forwards;
      }
      .stats-card {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .stats-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 80px rgba(0, 0, 0, 0.3) !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white' }}>
      {/* Navigation Header */}
      <div style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #475569', padding: '12px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <img src={keheilanLogo} alt="Keheilan" style={{ height: '80px', width: 'auto' }} />
            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                onClick={() => setCurrentPage('screener')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage === 'screener' ? '#0d9488' : 'transparent',
                  color: currentPage === 'screener' ? 'white' : '#d1d5db',
                  border: '1px solid #475569',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Screener
              </button>
              <button
                onClick={() => setCurrentPage('classifiers')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage === 'classifiers' ? '#0d9488' : 'transparent',
                  color: currentPage === 'classifiers' ? 'white' : '#d1d5db',
                  border: '1px solid #475569',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Classifiers
              </button>
              <button
                onClick={() => setCurrentPage('accessible-stocks')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage === 'accessible-stocks' ? '#0d9488' : 'transparent',
                  color: currentPage === 'accessible-stocks' ? 'white' : '#d1d5db',
                  border: '1px solid #475569',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Accessible Stocks
              </button>
              <button
                onClick={() => setCurrentPage('lenovo')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage === 'lenovo' ? '#0d9488' : 'transparent',
                  color: currentPage === 'lenovo' ? 'white' : '#d1d5db',
                  border: '1px solid #475569',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Lenovo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      {currentPage === 'screener' && <ScreenerPage />}
      {currentPage === 'classifiers' && <ClassifiersPage />}
      {currentPage === 'accessible-stocks' && <AccessibleStocksPage />}
      {currentPage === 'lenovo' && <LenovoPage />}
    </div>
  );
};

export default App;
