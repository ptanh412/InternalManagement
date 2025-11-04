import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes with tailwind-merge for deduplication
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to a readable string
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  return new Date(date).toLocaleDateString('en-US', defaultOptions);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  const units = [
    { name: 'year', seconds: 31536000 },
    { name: 'month', seconds: 2592000 },
    { name: 'week', seconds: 604800 },
    { name: 'day', seconds: 86400 },
    { name: 'hour', seconds: 3600 },
    { name: 'minute', seconds: 60 }
  ];

  for (const unit of units) {
    const count = Math.floor(diffInSeconds / unit.seconds);
    if (count >= 1) {
      return `${count} ${unit.name}${count > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

/**
 * Truncate text to a specified length
 */
export function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(str) {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Generate initials from a full name
 */
export function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate a random color for avatars, charts, etc.
 */
export function getRandomColor() {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Debounce function calls
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Deep clone an object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if user has permission
 */
export function hasPermission(userRole, requiredRole) {
  const roleHierarchy = {
    'ADMIN': 4,
    'PROJECT_MANAGER': 3,
    'TEAM_LEAD': 2,
    'EMPLOYEE': 1
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}