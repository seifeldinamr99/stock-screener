export const formatNumber = (num) => {
  if (num === null || num === undefined) return 'N/A';
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  return num.toFixed(2);
};

export const formatMarketCap = (num) => {
  if (num === null || num === undefined) return 'N/A';
  if (num >= 1000000000000) return `$${(num / 1000000000000).toFixed(2)}T`;
  if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

export const parsePriceFilter = (priceFilter) => {
  if (priceFilter === 'Any') return { min: null, max: null };
  if (priceFilter.startsWith('Under $')) {
    return { min: null, max: parseFloat(priceFilter.replace('Under $', '')) };
  } else if (priceFilter.startsWith('Over $')) {
    return { min: parseFloat(priceFilter.replace('Over $', '')), max: null };
  }
  return { min: null, max: null };
};

export const parseMarketCapFilter = (minValue, maxValue, minUnit, maxUnit) => {
  const params = {};
  if (minValue && minValue !== '') {
    const numMin = parseFloat(minValue);
    if (!isNaN(numMin)) {
      const minMultiplier = minUnit === 'B' ? 1000000000 : 1000000;
      params.market_cap_min = numMin * minMultiplier;
    }
  }
  if (maxValue && maxValue !== '') {
    const numMax = parseFloat(maxValue);
    if (!isNaN(numMax)) {
      const maxMultiplier = maxUnit === 'B' ? 1000000000 : 1000000;
      params.market_cap_max = numMax * maxMultiplier;
    }
  }
  return params;
};

export const scrollToElement = (elementRef, offset = 80) => {
  setTimeout(() => {
    if (elementRef.current) {
      const elementRect = elementRef.current.getBoundingClientRect();
      const absoluteElementTop = elementRect.top + window.pageYOffset;
      window.scrollTo({
        top: absoluteElementTop - offset,
        behavior: 'smooth'
      });
    }
  }, 100);
};