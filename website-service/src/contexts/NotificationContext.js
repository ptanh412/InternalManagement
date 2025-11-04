import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info', // success, error, warning, info
      title: '',
      message: '',
      duration: 5000, // 5 seconds default
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove notification after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const success = useCallback((message, title = 'Success') => {
    return addNotification({
      type: 'success',
      title,
      message,
    });
  }, [addNotification]);

  const error = useCallback((message, title = 'Error') => {
    return addNotification({
      type: 'error',
      title,
      message,
      duration: 7000, // Errors stay longer
    });
  }, [addNotification]);

  const warning = useCallback((message, title = 'Warning') => {
    return addNotification({
      type: 'warning',
      title,
      message,
    });
  }, [addNotification]);

  const info = useCallback((message, title = 'Info') => {
    return addNotification({
      type: 'info',
      title,
      message,
    });
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};