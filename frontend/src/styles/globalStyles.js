export const injectGlobalStyles = () => {
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
};