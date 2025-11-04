import { useNotification } from '../contexts/NotificationContext';

/**
 * Custom hook for API notifications
 * Provides consistent notification patterns for common API operations
 */
export const useApiNotifications = () => {
  const { success, error, warning, info } = useNotification();

  return {
    // Generic notifications
    success,
    error,
    warning,
    info,

    // CRUD operation notifications
    create: {
      success: (itemName = 'Item') => 
        success(`${itemName} has been created successfully!`, `${itemName} Created`),
      error: (itemName = 'Item') => 
        error(`Failed to create ${itemName.toLowerCase()}. Please check your input and try again.`, 'Creation Failed'),
    },

    update: {
      success: (itemName = 'Item') => 
        success(`${itemName} has been updated successfully!`, `${itemName} Updated`),
      error: (itemName = 'Item') => 
        error(`Failed to update ${itemName.toLowerCase()}. Please check your input and try again.`, 'Update Failed'),
    },

    delete: {
      success: (itemName = 'Item') => 
        success(`${itemName} has been deleted successfully!`, `${itemName} Deleted`),
      error: (itemName = 'Item') => 
        error(`Failed to delete ${itemName.toLowerCase()}. Please try again later.`, 'Deletion Failed'),
    },

    load: {
      error: (itemName = 'data') => 
        error(`Failed to load ${itemName}. Please refresh the page to try again.`, 'Loading Failed'),
      warning: (message) => 
        warning(message, 'Connection Issue'),
    },

    // Authentication notifications
    auth: {
      loginSuccess: () => success('Welcome back!', 'Login Successful'),
      loginError: () => error('Invalid credentials. Please try again.', 'Login Failed'),
      logoutSuccess: () => info('You have been logged out successfully.', 'Logged Out'),
      sessionExpired: () => warning('Your session has expired. Please log in again.', 'Session Expired'),
    },

    // Form validation notifications
    validation: {
      required: (fieldName) => error(`${fieldName} is required.`, 'Validation Error'),
      invalid: (fieldName) => error(`Please enter a valid ${fieldName.toLowerCase()}.`, 'Invalid Input'),
      success: () => success('Form submitted successfully!', 'Success'),
    },

    // File operation notifications
    file: {
      uploadSuccess: (fileName) => success(`${fileName} uploaded successfully!`, 'Upload Complete'),
      uploadError: (fileName) => error(`Failed to upload ${fileName}. Please try again.`, 'Upload Failed'),
      downloadError: () => error('Failed to download file. Please try again.', 'Download Failed'),
      invalidType: () => error('Invalid file type. Please select a supported file.', 'Invalid File'),
      tooLarge: (maxSize) => error(`File is too large. Maximum size is ${maxSize}.`, 'File Too Large'),
    },

    // Permission notifications
    permission: {
      denied: () => error('You do not have permission to perform this action.', 'Access Denied'),
      restricted: () => warning('This feature is restricted for your role.', 'Restricted Access'),
    },

    // Network notifications
    network: {
      offline: () => warning('You appear to be offline. Some features may not work.', 'Connection Lost'),
      reconnected: () => success('Connection restored!', 'Back Online'),
      timeout: () => error('Request timed out. Please check your connection and try again.', 'Connection Timeout'),
    },
  };
};