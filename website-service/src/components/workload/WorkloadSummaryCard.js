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
  // console.log('Rendering WorkloadSummaryCard with data:', workloadData);
  if (!workloadData) {
    return (
      <div className={`bg-gray-50 rounded-lg p-3 border border-gray-200 ${className} dark:bg-gray-800 dark:border-gray-700`}>
        <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 text-center">
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
    console.log('Formatting date:', dateStr);
    if (!dateStr) return 'Unknown';
    
    try {
      const date = new Date(dateStr);
      
      // Kiểm tra ngày có hợp lệ không
      if (isNaN(date.getTime())) {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }
      
      // Chuẩn hóa về đầu ngày để tính toán chính xác
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      const diffTime = targetDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays > 0 && diffDays <= 7) return `${diffDays} days`;
      
      // Format ngày tháng năm cho các trường hợp khác
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateStr; // Trả về chuỗi gốc nếu có lỗi
    }
  };

  

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <WorkloadBadge
            availabilityPercentage={workloadData.result.availabilityPercentage}
            size="sm"
          />
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {workloadData.result.currentTasksCount} tasks
          </span>
        </div>
        <WorkloadProgressBar
          utilizationPercentage={workloadData.result.utilizationPercentage}
          currentLoad={workloadData.result.currentLoad}
          capacity={workloadData.result.weeklyCapacity}
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
        <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 dark:text-gray-500" />
          Workload Overview
        </h4>
        <WorkloadBadge
          availabilityPercentage={workloadData.result.availabilityPercentage}
          size="sm"
          showPercentage={true}
        />
      </div>

      {/* Utilization Progress */}
      <div className="mb-4">
        <WorkloadProgressBar
          utilizationPercentage={workloadData.result.utilizationPercentage}
          currentLoad={workloadData.result.currentLoad}
          capacity={workloadData.result.weeklyCapacity}
          size="md"
          showLabels={true}
        />
      </div>

      {/* Workload Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {currentTasksCount}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300">Active Tasks</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {upcomingWeekHours}h
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300">This Week</div>
        </div>
      </div>

      {/* Next Available */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
        <CalendarDaysIcon className="h-4 w-4" />
        <span>Available: {formatDate(workloadData.result.nextAvailableDate)}</span>
      </div>

      {/* Warning for overloaded users */}
      {utilizationPercentage > 100 && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md mb-3">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <span>User is overloaded ({(workloadData.result.utilizationPercentage - 100).toFixed(0)}% over capacity)</span>
        </div>
      )}

      {/* Refresh Button */}
      {onRefresh && (
        <button
          onClick={() => onRefresh(workloadData.result.userId)}
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
