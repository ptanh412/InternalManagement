import React from 'react';
import PropTypes from 'prop-types';
import { CalendarDaysIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import WorkloadBadge from './WorkloadBadge';
import WorkloadProgressBar from './WorkloadProgressBar';

/**
 * WorkloadSummaryCard Component - Compact workload overview for team members
 * @param {Object} props
 * @param {Object} props.workloadData - User workload information
 * @param {boolean} props.compact - Whether to show compact version
 * @param {Function} props.onRefresh - Callback to refresh workload data
 */
const WorkloadSummaryCard = ({
  workloadData,
  compact = false,
  onRefresh,
  className = ''
}) => {
  if (!workloadData) {
    return (
      <div className={`bg-gray-50 rounded-lg p-3 border border-gray-200 ${className}`}>
        <div className="text-sm text-gray-500 text-center">
          No workload data available
        </div>
      </div>
    );
  }

  const {
    availabilityPercentage = 0,
    utilizationPercentage = 0,
    currentLoad = 0,
    weeklyCapacity = 40,
    currentTasksCount = 0,
    nextAvailableDate,
    upcomingWeekHours = 0
  } = workloadData;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days`;
    return date.toLocaleDateString();
  };

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <WorkloadBadge
            availabilityPercentage={availabilityPercentage}
            size="sm"
          />
          <span className="text-xs text-gray-600">
            {currentTasksCount} tasks
          </span>
        </div>
        <WorkloadProgressBar
          utilizationPercentage={utilizationPercentage}
          currentLoad={currentLoad}
          capacity={weeklyCapacity}
          size="sm"
          showLabels={false}
        />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-gray-500" />
          Workload Overview
        </h4>
        <WorkloadBadge
          availabilityPercentage={availabilityPercentage}
          size="sm"
          showPercentage={true}
        />
      </div>

      {/* Utilization Progress */}
      <div className="mb-4">
        <WorkloadProgressBar
          utilizationPercentage={utilizationPercentage}
          currentLoad={currentLoad}
          capacity={weeklyCapacity}
          size="md"
          showLabels={true}
        />
      </div>

      {/* Workload Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {currentTasksCount}
          </div>
          <div className="text-xs text-gray-600">Active Tasks</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {upcomingWeekHours}h
          </div>
          <div className="text-xs text-gray-600">This Week</div>
        </div>
      </div>

      {/* Next Available */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
        <CalendarDaysIcon className="h-4 w-4" />
        <span>Available: {formatDate(nextAvailableDate)}</span>
      </div>

      {/* Warning for overloaded users */}
      {utilizationPercentage > 100 && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md mb-3">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <span>User is overloaded ({(utilizationPercentage - 100).toFixed(0)}% over capacity)</span>
        </div>
      )}

      {/* Refresh Button */}
      {onRefresh && (
        <button
          onClick={() => onRefresh(workloadData.userId)}
          className="w-full text-xs text-blue-600 hover:text-blue-700 transition-colors"
        >
          Refresh Workload Data
        </button>
      )}
    </div>
  );
};

WorkloadSummaryCard.propTypes = {
  workloadData: PropTypes.shape({
    userId: PropTypes.string,
    availabilityPercentage: PropTypes.number,
    utilizationPercentage: PropTypes.number,
    currentLoad: PropTypes.number,
    weeklyCapacity: PropTypes.number,
    currentTasksCount: PropTypes.number,
    nextAvailableDate: PropTypes.string,
    upcomingWeekHours: PropTypes.number
  }),
  compact: PropTypes.bool,
  onRefresh: PropTypes.func,
  className: PropTypes.string
};

export default WorkloadSummaryCard;
