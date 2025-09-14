import { format } from 'date-fns';

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US').format(number);
};

export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  return format(new Date(date), formatStr);
};

export const formatPercentage = (value, decimals = 1) => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const getDateRanges = () => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return {
    today: {
      start: startOfToday,
      end: now,
      label: 'Today'
    },
    last7Days: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: now,
      label: 'Last 7 days'
    },
    last30Days: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: now,
      label: 'Last 30 days'
    },
    last90Days: {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      end: now,
      label: 'Last 90 days'
    },
    thisMonth: {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: now,
      label: 'This month'
    },
    lastMonth: {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 0),
      label: 'Last month'
    }
  };
};

export const calculateGrowth = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const truncateText = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
