import React, { useState } from 'react';
import { getDateRanges } from '../utils/helpers';

const DateRangeSelector = ({ onDateRangeChange, selectedRange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customRange, setCustomRange] = useState({
    start: '',
    end: ''
  });
  const [showCustom, setShowCustom] = useState(false);

  const dateRanges = getDateRanges();

  const handleRangeSelect = (range, key) => {
    setIsOpen(false);
    setShowCustom(false);
    onDateRangeChange(range, key);
  };

  const handleCustomRangeApply = () => {
    if (customRange.start && customRange.end) {
      const range = {
        start: new Date(customRange.start),
        end: new Date(customRange.end),
        label: 'Custom Range'
      };
      handleRangeSelect(range, 'custom');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg
          className="w-4 h-4 mr-2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {selectedRange?.label || 'Select Date Range'}
        <svg
          className="w-4 h-4 ml-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            {Object.entries(dateRanges).map(([key, range]) => (
              <button
                key={key}
                onClick={() => handleRangeSelect(range, key)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {range.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustom(!showCustom)}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100"
            >
              Custom Range
            </button>
            
            {showCustom && (
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customRange.start}
                      onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customRange.end}
                      onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <button
                    onClick={handleCustomRangeApply}
                    disabled={!customRange.start || !customRange.end}
                    className="w-full px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector;
