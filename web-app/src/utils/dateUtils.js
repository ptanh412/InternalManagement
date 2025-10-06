// Date utility functions for consistent formatting across the application

/**
 * Formats a date to dd/mm/yyyy format
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string in dd/mm/yyyy format
 */
export const formatDate = (date) => {
  if (!date) return '';

  const dateObj = new Date(date);

  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '';

  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Formats a date to dd/mm/yyyy hh:mm format
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string in dd/mm/yyyy hh:mm format
 */
export const formatDateTime = (date) => {
  if (!date) return '';

  const dateObj = new Date(date);

  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '';

  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Formats a date for display with fallback text
 * @param {string|Date} date - The date to format
 * @param {string} fallback - Text to show if date is invalid/empty
 * @returns {string} - Formatted date or fallback text
 */
export const formatDateWithFallback = (date, fallback = 'Not set') => {
  const formatted = formatDate(date);
  return formatted || fallback;
};

/**
 * Checks if a date is overdue (before current date)
 * @param {string|Date} date - The date to check
 * @returns {boolean} - True if the date is overdue
 */
export const isOverdue = (date) => {
  if (!date) return false;
  const dateObj = new Date(date);
  const now = new Date();
  // Set time to start of day for comparison
  now.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj < now;
};

/**
 * Checks if a date is today
 * @param {string|Date} date - The date to check
 * @returns {boolean} - True if the date is today
 */
export const isToday = (date) => {
  if (!date) return false;
  const dateObj = new Date(date);
  const today = new Date();
  return dateObj.toDateString() === today.toDateString();
};

/**
 * Gets ISO string for date (used for API calls)
 * @param {Date} date - The date object
 * @returns {string|null} - ISO string or null if invalid
 */
export const toISOString = (date) => {
  if (!date || !date.toISOString) return null;
  return date.toISOString();
};

/**
 * Gets ISO date string (YYYY-MM-DD format)
 * @param {Date} date - The date object
 * @returns {string|null} - ISO date string or null if invalid
 */
export const toISODateString = (date) => {
  if (!date || !date.toISOString) return null;
  return date.toISOString().split('T')[0];
};
