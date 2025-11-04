import React, { useState, useEffect } from 'react';
import {
  CalendarDaysIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

const ChartFilters = ({ 
  onFiltersChange, 
  availableFilters = {},
  initialFilters = {},
  showDateRange = true,
  showCustomFilters = true,
  className = ""
}) => {
  const [dateRange, setDateRange] = useState({
    startDate: initialFilters.startDate || '',
    endDate: initialFilters.endDate || '',
    preset: initialFilters.preset || 'last30days'
  });

  const [customFilters, setCustomFilters] = useState(initialFilters.customFilters || {});
  const [isExpanded, setIsExpanded] = useState(false);

  // Predefined date ranges
  const datePresets = [
    { value: 'today', label: 'Today', days: 0 },
    { value: 'yesterday', label: 'Yesterday', days: 1 },
    { value: 'last7days', label: 'Last 7 Days', days: 7 },
    { value: 'last30days', label: 'Last 30 Days', days: 30 },
    { value: 'last90days', label: 'Last 90 Days', days: 90 },
    { value: 'thisweek', label: 'This Week', days: null },
    { value: 'thismonth', label: 'This Month', days: null },
    { value: 'thisquarter', label: 'This Quarter', days: null },
    { value: 'thisyear', label: 'This Year', days: null },
    { value: 'custom', label: 'Custom Range', days: null }
  ];

  // Calculate date range based on preset
  const calculateDateRange = (preset) => {
    const today = new Date();
    let startDate, endDate;

    switch (preset) {
      case 'today':
        startDate = endDate = today.toISOString().split('T')[0];
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = endDate = yesterday.toISOString().split('T')[0];
        break;
      case 'last7days':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'last30days':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'last90days':
        startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'thisweek':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startDate = startOfWeek.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'thismonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'thisquarter':
        const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
        startDate = quarterStart.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'thisyear':
        startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      default:
        return dateRange;
    }

    return { ...dateRange, startDate, endDate, preset };
  };

  // Handle preset change
  const handlePresetChange = (preset) => {
    const newDateRange = calculateDateRange(preset);
    setDateRange(newDateRange);
  };

  // Handle custom filter change
  const handleCustomFilterChange = (filterKey, value) => {
    setCustomFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    const defaultDateRange = {
      startDate: '',
      endDate: '',
      preset: 'last30days'
    };
    setDateRange(calculateDateRange('last30days'));
    setCustomFilters({});
  };

  // Apply filters
  useEffect(() => {
    const filters = {
      dateRange: dateRange.preset !== 'custom' ? calculateDateRange(dateRange.preset) : dateRange,
      customFilters,
      timestamp: new Date().toISOString()
    };

    onFiltersChange(filters);
  }, [dateRange, customFilters, onFiltersChange]);

  // Initialize with default date range
  useEffect(() => {
    if (!dateRange.startDate && !dateRange.endDate) {
      handlePresetChange('last30days');
    }
  }, []);

  const renderFilterOption = (filter) => {
    switch (filter.type) {
      case 'select':
        return (
          <select
            value={customFilters[filter.key] || ''}
            onChange={(e) => handleCustomFilterChange(filter.key, e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">All {filter.label}</option>
            {filter.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        const selectedValues = customFilters[filter.key] || [];
        return (
          <div className="mt-1">
            {filter.options?.map(option => (
              <label key={option.value} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter(v => v !== option.value);
                    handleCustomFilterChange(filter.key, newValues);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'range':
        return (
          <div className="mt-1 grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={customFilters[filter.key]?.min || ''}
              onChange={(e) => handleCustomFilterChange(filter.key, {
                ...customFilters[filter.key],
                min: e.target.value
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <input
              type="number"
              placeholder="Max"
              value={customFilters[filter.key]?.max || ''}
              onChange={(e) => handleCustomFilterChange(filter.key, {
                ...customFilters[filter.key],
                max: e.target.value
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        );

      case 'text':
        return (
          <input
            type="text"
            placeholder={`Filter by ${filter.label.toLowerCase()}`}
            value={customFilters[filter.key] || ''}
            onChange={(e) => handleCustomFilterChange(filter.key, e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Chart Filters</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearFilters}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <XMarkIcon className="h-3 w-3 mr-1" />
            Clear All
          </button>
          {showCustomFilters && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <AdjustmentsHorizontalIcon className="h-3 w-3 mr-1" />
              Advanced
              <ChevronDownIcon className={`h-3 w-3 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Date Range Filter */}
        {showDateRange && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              <CalendarDaysIcon className="inline h-4 w-4 mr-1" />
              Date Range
            </label>
            
            {/* Preset Selector */}
            <select
              value={dateRange.preset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {datePresets.map(preset => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>

            {/* Custom Date Inputs */}
            {dateRange.preset === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            )}
          </div>
        )}

        {/* Quick Filters */}
        {availableFilters.quickFilters?.map(filter => (
          <div key={filter.key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {filter.label}
            </label>
            {renderFilterOption(filter)}
          </div>
        ))}
      </div>

      {/* Advanced Filters */}
      {isExpanded && showCustomFilters && availableFilters.advancedFilters && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Advanced Filters</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableFilters.advancedFilters.map(filter => (
              <div key={filter.key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {filter.label}
                </label>
                {renderFilterOption(filter)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Summary */}
      {(Object.keys(customFilters).length > 0 || dateRange.startDate) && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {dateRange.startDate && dateRange.endDate && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {dateRange.startDate} to {dateRange.endDate}
              </span>
            )}
            {Object.entries(customFilters).map(([key, value]) => {
              if (!value || (Array.isArray(value) && value.length === 0)) return null;
              return (
                <span key={key} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {key}: {Array.isArray(value) ? value.join(', ') : 
                         typeof value === 'object' ? `${value.min || '0'}-${value.max || '∞'}` : 
                         value.toString()}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartFilters;