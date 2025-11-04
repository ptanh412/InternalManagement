import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import socketIOService from '../services/socketIOService';
import { useAuth } from '../hooks/useAuth';

const SocketIOContext = createContext();

export const useSocketIO = () => {
  const context = useContext(SocketIOContext);
  if (!context) {
    throw new Error('useSocketIO must be used within a SocketIOProvider');
  }
  return context;
};

export const SocketIOProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [projectNotifications, setProjectNotifications] = useState([]);
  const { user } = useAuth(); // Get user from auth context

  useEffect(() => {
    // Connect to Socket.IO server when component mounts
    socketIOService.connect();

    // Subscribe to connection status changes
    const checkConnection = () => {
      const status = socketIOService.getConnectionStatus();
      setIsConnected(status.isConnected);
    };

    // Check connection status periodically
    const interval = setInterval(checkConnection, 1000);
    checkConnection(); // Initial check

    // Subscribe to project-related events
    const unsubscribeProjectCreated = socketIOService.subscribe('project-created', (data) => {
      const notification = {
        id: Date.now(),
        type: 'project-created',
        title: 'New Project Created',
        message: data.message,
        project: data.project,
        timestamp: new Date(data.timestamp),
        read: false,
      };

      setNotifications(prev => [notification, ...prev]);
      setProjectNotifications(prev => [notification, ...prev]);
    });

    const unsubscribeProjectUpdated = socketIOService.subscribe('project-updated', (data) => {
      const notification = {
        id: Date.now(),
        type: 'project-updated',
        title: 'Project Updated',
        message: data.message,
        project: data.project,
        timestamp: new Date(data.timestamp),
        read: false,
      };

      setNotifications(prev => [notification, ...prev]);
      setProjectNotifications(prev => [notification, ...prev]);
    });

    const unsubscribeProjectStatusChanged = socketIOService.subscribe('project-status-changed', (data) => {
      const notification = {
        id: Date.now(),
        type: 'project-status-changed',
        title: 'Project Status Changed',
        message: data.message,
        project: data.project,
        timestamp: new Date(data.timestamp),
        read: false,
      };

      setNotifications(prev => [notification, ...prev]);
      setProjectNotifications(prev => [notification, ...prev]);
    });

    const unsubscribeTestMessage = socketIOService.subscribe('test-message', (data) => {
      const notification = {
        id: Date.now(),
        type: 'test-message',
        title: 'Test Message',
        message: data.message,
        timestamp: new Date(data.timestamp),
        read: false,
      };

      setNotifications(prev => [notification, ...prev]);
    });

    // Subscribe to task-related events
    const unsubscribeTaskAssigned = socketIOService.subscribe('task-assigned', (data) => {
      // Only show notification if the task is assigned to the current user
      const currentUserId = user?.id; // Assuming user object has an id field
      if (data.assignedTo === currentUserId) {
        const notification = {
          id: Date.now(),
          type: 'task-assigned',
          title: 'New Task Assigned',
          message: data.message,
          task: data.task,
          timestamp: new Date(data.timestamp),
          read: false,
        };

        setNotifications(prev => [notification, ...prev]);
        setProjectNotifications(prev => [notification, ...prev]);
      }
    });

    const unsubscribeTaskStatusChanged = socketIOService.subscribe('task-status-changed', (data) => {
      // Only show notification if the task is assigned to the current user
      const currentUserId = user?.id;
      if (data.assignedTo === currentUserId) {
        const notification = {
          id: Date.now(),
          type: 'task-status-changed',
          title: 'Task Status Updated',
          message: data.message,
          task: data.task,
          timestamp: new Date(data.timestamp),
          read: false,
        };

        setNotifications(prev => [notification, ...prev]);
      }
    });

    const unsubscribeTaskUpdated = socketIOService.subscribe('task-updated', (data) => {
      // Only show notification if the task is assigned to the current user
      const currentUserId = user?.id;
      if (data.assignedTo === currentUserId) {
        const notification = {
          id: Date.now(),
          type: 'task-updated',
          title: 'Task Updated',
          message: data.message,
          task: data.task,
          timestamp: new Date(data.timestamp),
          read: false,
        };

        setNotifications(prev => [notification, ...prev]);
      }
    });

    // Subscribe to task-status-update event (after review)
    const unsubscribeTaskStatusUpdate = socketIOService.subscribe('task-status-update', (data) => {
      if (user && data.submission && data.submission.submittedBy === user.id) {
        const notification = {
          id: Date.now(),
          type: 'task-status-update',
          title: 'Task Review Update',
          message: data.message,
          submission: data.submission,
          statusTask: data.statusTask,
          review: data.review,
          timestamp: new Date(data.timestamp),
          read: false,
        };

        setNotifications(prev => [notification, ...prev]);
  
      }
    });

    // Cleanup function
    return () => {
      clearInterval(interval);
      unsubscribeProjectCreated();
      unsubscribeProjectUpdated();
      unsubscribeProjectStatusChanged();
      unsubscribeTaskAssigned();
      unsubscribeTaskStatusChanged();
      unsubscribeTaskUpdated();
      unsubscribeTestMessage();
      unsubscribeTaskStatusUpdate();
      socketIOService.disconnect();
    };
  }, []);

  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    setProjectNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setProjectNotifications([]);
  }, []);

  const clearProjectNotifications = useCallback(() => {
    setProjectNotifications([]);
  }, []);

  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const getUnreadProjectCount = useCallback(() => {
    return projectNotifications.filter(n => !n.read).length;
  }, [projectNotifications]);

  const value = {
    isConnected,
    notifications,
    projectNotifications,
    markNotificationAsRead,
    clearNotifications,
    clearProjectNotifications,
    getUnreadCount,
    getUnreadProjectCount,
    socketService: socketIOService,
  };

  return (
    <SocketIOContext.Provider value={value}>
      {children}
    </SocketIOContext.Provider>
  );
};
