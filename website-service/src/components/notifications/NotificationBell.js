import React, { useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useProjectNotifications, useSocketConnection } from '../../hooks/useSocket';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, markAsRead, clearAll, unreadCount } = useProjectNotifications();
  const { isConnected } = useSocketConnection();

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    // You can add navigation logic here if needed
    // For example: navigate to project details page
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'project-created':
        return '🆕';
      case 'project-updated':
        return '📝';
      case 'project-status-changed':
        return '🔄';
      case 'task-assigned':
        return '📋';
      case 'task-status-changed':
        return '✅';
      case 'task-updated':
        return '📝';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'project-created':
        return 'bg-green-100 border-green-200';
      case 'project-updated':
        return 'bg-blue-100 border-blue-200';
      case 'project-status-changed':
        return 'bg-yellow-100 border-yellow-200';
      case 'task-assigned':
        return 'bg-purple-100 border-purple-200';
      case 'task-status-changed':
        return 'bg-emerald-100 border-emerald-200';
      case 'task-updated':
        return 'bg-indigo-100 border-indigo-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="relative">
      {/* Connection Status Indicator */}
      <div className={`absolute -top-1 -left-1 w-3 h-3 rounded-full ${
        isConnected ? 'bg-green-500' : 'bg-red-500'
      }`} title={isConnected ? 'Connected' : 'Disconnected'} />

      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Project Notifications
              </h3>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isConnected 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isConnected ? 'Live' : 'Offline'}
                </span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <BellIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No notifications yet</p>
                <p className="text-sm">You'll see real-time project updates here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className={`p-3 rounded-lg border ${getNotificationColor(notification.type)}`}>
                      <div className="flex items-start space-x-3">
                        <span className="text-lg flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            {notification.message}
                          </p>
                          {notification.project && (
                            <div className="mt-2 p-2 bg-white rounded border">
                              <p className="text-xs font-medium text-gray-600">Project Details:</p>
                              <p className="text-sm text-gray-900">{notification.project.name}</p>
                              <p className="text-xs text-gray-500">
                                Status: {notification.project.status} |
                                Priority: {notification.project.priority}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {notification.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 10 && (
            <div className="p-3 text-center border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing latest 10 notifications
              </p>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
