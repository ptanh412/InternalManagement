import React from 'react';
import PropTypes from 'prop-types';

/**
 * WorkloadProgressBar Component - Shows utilization as progress bar
 * @param {Object} props
 * @param {number} props.utilizationPercentage - Current utilization (0-100+)
 * @param {number} props.currentLoad - Hours currently assigned
 * @param {number} props.capacity - Total weekly capacity hours
 * @param {string} props.size - Bar size: 'sm', 'md', 'lg'
 * @param {boolean} props.showLabels - Whether to show numeric labels
 */
const WorkloadProgressBar = ({
  utilizationPercentage = 0,
  currentLoad = 0,
  capacity = 40,
  size = 'md',
  showLabels = true,
  className = ''
}) => {
  const getBarColor = (utilization) => {
    if (utilization <= 50) return 'bg-green-500';
    if (utilization <= 75) return 'bg-yellow-500';
    if (utilization <= 100) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getSizeClasses = (size) => {
    const sizes = {
      sm: 'h-2',
      md: 'h-3',
      lg: 'h-4'
    };
    return sizes[size] || sizes.md;
  };

  const barColor = getBarColor(utilizationPercentage);
  const sizeClass = getSizeClasses(size);
  const clampedUtilization = Math.min(utilizationPercentage, 100);

  return (
    <div className={`${className}`}>
      {showLabels && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-gray-700">
            Workload
          </span>
          <span className="text-xs text-gray-600">
            {currentLoad}h / {capacity}h ({utilizationPercentage.toFixed(0)}%)
          </span>
        </div>
      )}

      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClass}`}>
        <div
          className={`${barColor} ${sizeClass} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${clampedUtilization}%` }}
        />
        {utilizationPercentage > 100 && (
          <div
            className="bg-red-600 h-full opacity-75 animate-pulse"
            style={{
              width: `${Math.min(utilizationPercentage - 100, 50)}%`,
              marginLeft: '100%',
              marginTop: `-${sizeClass.split('-')[1]}`
            }}
          />
        )}
      </div>

      {utilizationPercentage > 100 && (
        <div className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
          ⚠️ Overloaded by {(utilizationPercentage - 100).toFixed(0)}%
        </div>
      )}
    </div>
  );
};

WorkloadProgressBar.propTypes = {
  utilizationPercentage: PropTypes.number.isRequired,
  currentLoad: PropTypes.number,
  capacity: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showLabels: PropTypes.bool,
  className: PropTypes.string
};

export default WorkloadProgressBar;
