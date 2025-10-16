import React from 'react';
import ClassifiersPage from './ClassifiersPage';

const AccessibleStocksPage = () => (
  <ClassifiersPage
    datasetKey="accessible"
    sectorsTitle="Accessible Stocks"
    sectorsEmptyMessage="No accessible stocks available yet."
  />
);

export default AccessibleStocksPage;
