import React from 'react';
import { formatCurrency, formatNumber } from '../utils/helpers';

const StatCard = ({ title, value, change, changeType, icon, className = '' }) => {
  const getChangeColor = () => {
    if (!change) return 'text-gray-500';
    return changeType === 'positive' ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = () => {
    if (!change) return null;
    return changeType === 'positive' ? '↗' : '↘';
  };

  const formatValue = (val) => {
    if (typeof val === 'number' && val >= 1000000) {
      return formatCurrency(val);
    } else if (typeof val === 'number' && val >= 1000) {
      return formatNumber(val);
    }
    return val;
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">
            {formatValue(value)}
          </p>
          {change && (
            <p className={`text-sm mt-2 ${getChangeColor()}`}>
              <span className="inline-flex items-center">
                {getChangeIcon()}
                <span className="ml-1">
                  {Math.abs(change).toFixed(1)}% from last period
                </span>
              </span>
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-blue-50 rounded-full">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
