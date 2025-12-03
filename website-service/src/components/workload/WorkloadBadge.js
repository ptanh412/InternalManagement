import PropTypes from 'prop-types';

/**
 * WorkloadBadge Component - Shows user availability status
 * @param {Object} props
 * @param {number} props.availabilityPercentage - User availability (0-100)
 * @param {string} props.size - Badge size: 'xs', 'sm', 'md', 'lg'
 * @param {boolean} props.showPercentage - Whether to show percentage text
 */
const WorkloadBadge = ({
  availabilityPercentage = 0,
  size = 'sm',
  showPercentage = false,
  className = ''
}) => {
  const getStatusConfig = (availability) => {
    if (availability >= 75) {
      return {
        color: 'green',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200',
        status: 'Available',
        icon: '🟢'
      };
    }
    if (availability >= 25) {
      return {
        color: 'yellow',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200',
        status: 'Busy',
        icon: '🟡'
      };
    }
    return {
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
      status: 'Overloaded',
      icon: '🔴'
    };
  };

  const getSizeClasses = (size) => {
    const sizes = {
      xs: 'px-1.5 py-0.5 text-xs',
      sm: 'px-2 py-1 text-xs',
      md: 'px-2.5 py-1.5 text-sm',
      lg: 'px-3 py-2 text-sm'
    };
    return sizes[size] || sizes.sm;
  };

  const config = getStatusConfig(availabilityPercentage);
  const sizeClasses = getSizeClasses(size);

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium border
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses} ${className}
      `}
      title={`${config.status}: ${availabilityPercentage.toFixed(1)}% available`}
    >
      <span className="text-xs">{config.icon}</span>
      {showPercentage ? (
        <span>{availabilityPercentage.toFixed(0)}%</span>
      ) : (
        <span>{config.status}</span>
      )}
    </span>
  );
};

WorkloadBadge.propTypes = {
  availabilityPercentage: PropTypes.number.isRequired,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  showPercentage: PropTypes.bool,
  className: PropTypes.string
};

export default WorkloadBadge;
