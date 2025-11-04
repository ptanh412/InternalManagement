import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useSocketEvent } from '../../hooks/useSocket';

const ToastNotification = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade animation
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastColor = (type) => {
    switch (type) {
      case 'project-created':
        return 'border-green-400 bg-green-50 text-green-800';
      case 'project-updated':
        return 'border-blue-400 bg-blue-50 text-blue-800';
      case 'project-status-changed':
        return 'border-yellow-400 bg-yellow-50 text-yellow-800';
      case 'task-assigned':
        return 'border-purple-400 bg-purple-50 text-purple-800';
      case 'task-status-changed':
        return 'border-emerald-400 bg-emerald-50 text-emerald-800';
      case 'task-updated':
        return 'border-indigo-400 bg-indigo-50 text-indigo-800';
      default:
        return 'border-gray-400 bg-gray-50 text-gray-800';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'project-created':
        return '🎉';
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

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`max-w-sm w-full border-l-4 rounded-lg shadow-lg p-4 ${getToastColor(notification.type)}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-lg">{getIcon(notification.type)}</span>
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium">{notification.title}</p>
            <p className="mt-1 text-sm opacity-90">{notification.message}</p>
            {notification.project && (
              <p className="mt-1 text-xs opacity-75">
                Project: {notification.project.name}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (data) => {
    const toast = {
      id: Date.now(),
      type: data.type,
      title: data.type === 'PROJECT_CREATED' ? 'New Project Created' :
             data.type === 'PROJECT_UPDATED' ? 'Project Updated' :
             data.type === 'PROJECT_STATUS_CHANGED' ? 'Project Status Changed' :
             data.type === 'TASK_ASSIGNED' ? 'Task Assigned' :
             data.type === 'TASK_STATUS_CHANGED' ? 'Task Status Changed' :
             data.type === 'TASK_UPDATED' ? 'Task Updated' :
             'Notification',
      message: data.message,
      project: data.project,
      timestamp: new Date(data.timestamp),
    };

    setToasts(prev => [...prev, toast]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Subscribe to Socket.IO events for toast notifications
  useSocketEvent('project-created', addToast);
  useSocketEvent('project-updated', addToast);
  useSocketEvent('project-status-changed', addToast);
  useSocketEvent('task-assigned', addToast);
  useSocketEvent('task-status-changed', addToast);
  useSocketEvent('task-updated', addToast);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          notification={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
