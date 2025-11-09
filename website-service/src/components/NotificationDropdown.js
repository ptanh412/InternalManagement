import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon, 
  XMarkIcon,
  ClockIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import NotificationDetailCard from './NotificationDetailsCard';
import { useProjectNotifications } from '../hooks/useSocket';
import { useSocketConnection } from '../hooks/useSocket';

const NotificationDropdown = ({ 
  notifications, 
  unreadCount, 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onViewAll,
  loading 
}) => {
  const [localNotifications, setLocalNotifications] = useState(notifications);
  
  // Socket-based notifications
  const { 
    notifications: socketNotifications, 
    markAsRead: socketMarkAsRead, 
    clearAll: socketClearAll, 
    unreadCount: socketUnreadCount 
  } = useProjectNotifications();
  const { isConnected } = useSocketConnection();

  // Merge both notification sources
  const [mergedNotifications, setMergedNotifications] = useState([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    // Merge API notifications and socket notifications
    const apiNotifications = notifications.map(n => ({
      ...n,
      source: 'api',
      timestamp: n.createdAt ? new Date(n.createdAt) : new Date(),
      read: n.isRead
    }));

    const socketNots = socketNotifications.map(n => ({
      ...n,
      source: 'socket',
      isRead: n.read,
      createdAt: n.timestamp?.toISOString() || new Date().toISOString()
    }));

    // Combine and sort by timestamp (newest first)
    const combined = [...apiNotifications, ...socketNots].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    setMergedNotifications(combined);
    setTotalUnreadCount((unreadCount || 0) + (socketUnreadCount || 0));
  }, [notifications, socketNotifications, unreadCount, socketUnreadCount]);

  const getNotificationIcon = (type, source) => {
    // Handle socket notification types
    if (source === 'socket') {
      switch (type) {
        case 'project-created':
          return <span className="text-lg">🆕</span>;
        case 'project-updated':
          return <span className="text-lg">📝</span>;
        case 'project-status-changed':
          return <span className="text-lg">🔄</span>;
        case 'task-assigned':
        case 'TASK_ASSIGNMENT':
          return <span className="text-lg">📌</span>;
        case 'TASK_TRANSFER':
          return <span className="text-lg">📌</span>;
        case 'task-status-changed':
        case 'task-status-update':
        case 'TASK_REVIEW':
          return <span className="text-lg">👀</span>;
        case 'task-updated':
          return <span className="text-lg">📝</span>;
        default:
          return <span className="text-lg">📢</span>;
      }
    }

    // Handle API notification types
    switch (type?.toLowerCase()) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XMarkIcon className="h-5 w-5 text-red-500" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'task_review':
        return <span className="text-lg">👀</span>;
      case 'task_assignment':
        return <span className="text-lg">📌</span>;
      case 'task_transfer':
        return <span className="text-lg">📌</span>;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const handleNotificationClick = async (notification) => {
    const isUnread = notification.source === 'socket' ? !notification.read : !notification.isRead;
    
    if (isUnread) {
      // Mark as read locally for immediate UI feedback
      setMergedNotifications(prev => 
        prev.map(n => 
          n.id === notification.id 
            ? { 
                ...n, 
                isRead: true, 
                read: true,
                readAt: new Date().toISOString() 
              }
            : n
        )
      );
      
      // Mark as read based on source
      if (notification.source === 'socket') {
        socketMarkAsRead(notification.id);
      } else {
        await onMarkAsRead([notification.id]);
      }
    }

    // Handle notification action if there's a URL
    const actionUrl = notification.data?.actionUrl || notification.actionUrl;
    if (actionUrl) {
      window.location.href = actionUrl;
    }
  };

  const handleMarkAllAsRead = async () => {
    // Update local state immediately
    setMergedNotifications(prev => 
      prev.map(n => ({ 
        ...n, 
        isRead: true,
        read: true, 
        readAt: new Date().toISOString() 
      }))
    );
    
    // Update both sources
    await onMarkAllAsRead();
    socketClearAll();
  };

  const getNotificationPriorityColor = (notification) => {
    const priority = notification.priority || notification.data?.priority;
    
    if (priority === 'HIGH') {
      return 'border-l-red-500';
    } else if (priority === 'MEDIUM') {
      return 'border-l-yellow-500';
    }
    return 'border-l-blue-500';
  };

  if (loading) {
    return (
      <div className="w-80 bg-white rounded-xl shadow-2xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-white rounded-xl shadow-2xl border border-gray-200 animate-fadeInScale">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
            </h3>
            {totalUnreadCount > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {totalUnreadCount}
              </span>
            )}
            {/* Connection Status */}
            {/* <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isConnected   
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                isConnected ? 'bg-green-600' : 'bg-red-600'
              }`}></span>
              {isConnected ? 'Live' : 'Offline'}
            </span> */}
          </div>
          {totalUnreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1 transition-colors"
            >
              <CheckIcon className="h-4 w-4" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="max-h-[32rem] overflow-y-auto">
        {mergedNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircleIcon className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900">No notifications</p>
            <p className="text-xs text-gray-500 mt-1">You're all caught up!</p>
          </div>
        ) : (
          mergedNotifications.map((notification) => {
            const isUnread = notification.source === 'socket' ? !notification.read : !notification.isRead;
            
            return (
              <div
                key={`${notification.source}-${notification.id}`}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-all cursor-pointer ${
                  isUnread ? `bg-blue-50 border-l-4 ${getNotificationPriorityColor(notification)}` : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type, notification.source)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        {/* Show detailed notification card */}
                        <NotificationDetailCard 
                          notification={notification} 
                          getTimeAgo={getTimeAgo}
                        />
                        
                        <div className="flex items-center mt-2 space-x-2">
                          <ClockIcon className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-500">
                            {notification.source === 'socket' 
                              ? notification.timestamp?.toLocaleString() || 'Just now'
                              : getTimeAgo(notification.createdAt)
                            }
                          </p>
                          {/* Source badge */}
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            notification.source === 'socket' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {notification.source === 'socket' ? 'Real-time' : 'System'}
                          </span>
                        </div>
                      </div>
                      {isUnread && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-1 ml-2 flex-shrink-0 animate-pulse"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {mergedNotifications.length > 0 && (
        <div className="p-4 text-center border-t border-gray-200 bg-gray-50">
          <button 
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            View all notifications →
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;