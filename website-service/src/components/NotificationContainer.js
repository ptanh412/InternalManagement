import React from 'react';
import { useNotification } from '../contexts/NotificationContext';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-400" />;
      case 'error':
        return <XCircleIcon className="h-6 w-6 text-red-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />;
      case 'info':
      default:
        return <InformationCircleIcon className="h-6 w-6 text-blue-400" />;
    }
  };

  const getStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out
            transform animate-slide-in-right
            ${getStyles(notification.type)}
          `}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon(notification.type)}
            </div>
            <div className="ml-3 flex-1">
              {notification.title && (
                <p className="text-sm font-semibold">
                  {notification.title}
                </p>
              )}
              <p className={`text-sm ${notification.title ? 'mt-1' : ''}`}>
                {notification.message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={() => removeNotification(notification.id)}
                className={`
                  rounded-md inline-flex focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${notification.type === 'success' ? 'text-green-400 hover:text-green-500 focus:ring-green-500' : ''}
                  ${notification.type === 'error' ? 'text-red-400 hover:text-red-500 focus:ring-red-500' : ''}
                  ${notification.type === 'warning' ? 'text-yellow-400 hover:text-yellow-500 focus:ring-yellow-500' : ''}
                  ${notification.type === 'info' ? 'text-blue-400 hover:text-blue-500 focus:ring-blue-500' : ''}
                `}
              >
                <span className="sr-only">Dismiss</span>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;