import { useEffect, useRef } from 'react';
import { useSocketIO } from '../contexts/SocketIOContext';

// Hook for subscribing to specific Socket.IO events
export const useSocketEvent = (event, callback, dependencies = []) => {
  const { socketService } = useSocketIO();
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const wrappedCallback = (data) => {
      callbackRef.current(data);
    };

    const unsubscribe = socketService.subscribe(event, wrappedCallback);
    return unsubscribe;
  }, [event, socketService, ...dependencies]);
};

// Hook for real-time project notifications
export const useProjectNotifications = () => {
  const {
    projectNotifications,
    markNotificationAsRead,
    clearProjectNotifications,
    getUnreadProjectCount
  } = useSocketIO();

  return {
    notifications: projectNotifications,
    markAsRead: markNotificationAsRead,
    clearAll: clearProjectNotifications,
    unreadCount: getUnreadProjectCount(),
  };
};

// Hook for connection status
export const useSocketConnection = () => {
  const { isConnected } = useSocketIO();
  return { isConnected };
};
