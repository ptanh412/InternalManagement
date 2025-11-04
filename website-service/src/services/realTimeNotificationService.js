// Real-time notification client for React frontend
import io from 'socket.io-client';

class RealTimeNotificationService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Initialize connection to notification service
  connect(userId, token) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io('http://localhost:8100', {
      transports: ['websocket'],
      query: {
        userId: userId,
        token: token
      },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000
    });

    this.setupEventHandlers();
    return this.socket;
  }

  setupEventHandlers() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to notification service');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyListeners('connection', { status: 'connected' });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from notification service:', reason);
      this.isConnected = false;
      this.notifyListeners('connection', { status: 'disconnected', reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      this.reconnectAttempts++;
      this.notifyListeners('connection', { status: 'error', error });
    });

    // Real-time notification events
    this.socket.on('notification', (data) => {
      console.log('📩 New real-time notification:', data);
      this.handleNotification(data);
    });

    this.socket.on('pending_notification', (data) => {
      console.log('📬 Pending notification:', data);
      this.handleNotification(data, true);
    });

    // Task-specific notifications
    this.socket.on('task_assignment', (data) => {
      console.log('📋 Task assignment notification:', data);
      this.handleTaskAssignment(data);
    });

    this.socket.on('project_creation', (data) => {
      console.log('🏗️ Project creation notification:', data);
      this.handleProjectCreation(data);
    });

    this.socket.on('employee_report', (data) => {
      console.log('📊 Employee report notification:', data);
      this.handleEmployeeReport(data);
    });

    this.socket.on('group_chat_addition', (data) => {
      console.log('💬 Group chat addition notification:', data);
      this.handleGroupChatAddition(data);
    });
  }

  // Handle different types of notifications
  handleNotification(data, isPending = false) {
    const notification = {
      id: data.notificationId || Date.now(),
      type: data.type,
      title: data.title,
      message: data.message,
      timestamp: data.timestamp,
      actionUrl: data.actionUrl,
      priority: data.priority || 'MEDIUM',
      isPending,
      data: data
    };

    // Show browser notification if permission granted
    this.showBrowserNotification(notification);

    // Notify all listeners
    this.notifyListeners('notification', notification);
    this.notifyListeners(data.type, notification);
  }

  handleTaskAssignment(data) {
    const notification = {
      type: 'TASK_ASSIGNMENT',
      title: `New Task: ${data.taskTitle}`,
      message: `You have been assigned "${data.taskTitle}" in ${data.projectName}`,
      actionUrl: `/tasks/${data.taskId}`,
      priority: 'HIGH',
      data
    };

    this.showToast(notification, 'info');
    this.notifyListeners('task_assignment', notification);
  }

  handleProjectCreation(data) {
    const notification = {
      type: 'PROJECT_CREATION',
      title: `New Project: ${data.projectName}`,
      message: `You are now team lead for "${data.projectName}"`,
      actionUrl: `/projects/${data.projectId}`,
      priority: 'HIGH',
      data
    };

    this.showToast(notification, 'success');
    this.notifyListeners('project_creation', notification);
  }

  handleEmployeeReport(data) {
    const notification = {
      type: 'EMPLOYEE_REPORT',
      title: 'Employee Report Submitted',
      message: `${data.employeeName} submitted a ${data.reportType} report`,
      actionUrl: `/reports/${data.reportId}`,
      priority: 'MEDIUM',
      data
    };

    this.showToast(notification, 'warning');
    this.notifyListeners('employee_report', notification);
  }

  handleGroupChatAddition(data) {
    const notification = {
      type: 'GROUP_CHAT_ADDITION',
      title: 'Added to Project Chat',
      message: `You've been added to ${data.projectName} chat group`,
      actionUrl: `/chat/project/${data.projectId}`,
      priority: 'LOW',
      data
    };

    this.showToast(notification, 'info');
    this.notifyListeners('group_chat_addition', notification);
  }

  // Show browser notification
  showBrowserNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const options = {
        body: notification.message,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: notification.type,
        requireInteraction: notification.priority === 'HIGH',
        actions: notification.actionUrl ? [
          { action: 'view', title: 'View', icon: '/view-icon.png' }
        ] : []
      };

      const browserNotification = new Notification(notification.title, options);

      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        browserNotification.close();
      };

      // Auto-close after 5 seconds for low priority notifications
      if (notification.priority === 'LOW') {
        setTimeout(() => browserNotification.close(), 5000);
      }
    }
  }

  // Show in-app toast notification
  showToast(notification, type = 'info') {
    // This would integrate with your toast notification system
    // Example with popular libraries like react-toastify:

    const toastConfig = {
      position: "top-right",
      autoClose: notification.priority === 'HIGH' ? false : 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      onClick: () => {
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
      }
    };

    // You would call your toast library here
    console.log('🔔 Toast notification:', notification.title, notification.message);
  }

  // Listener management
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in notification listener:', error);
        }
      });
    }
  }

  // Utility methods
  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      return Notification.requestPermission();
    }
    return Promise.resolve(Notification.permission);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  isConnectionActive() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  // Send custom events (if needed)
  emit(event, data) {
    if (this.isConnectionActive()) {
      this.socket.emit(event, data);
    }
  }
}

// Singleton instance
const realTimeNotificationService = new RealTimeNotificationService();

// React Hook for using notifications
export const useRealTimeNotifications = (userId, token) => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [notifications, setNotifications] = React.useState([]);

  React.useEffect(() => {
    if (userId && token) {
      // Connect to notification service
      realTimeNotificationService.connect(userId, token);

      // Request notification permission
      realTimeNotificationService.requestNotificationPermission();

      // Set up connection listener
      const connectionListener = (data) => {
        setIsConnected(data.status === 'connected');
      };

      // Set up notification listener
      const notificationListener = (notification) => {
        setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
      };

      realTimeNotificationService.addEventListener('connection', connectionListener);
      realTimeNotificationService.addEventListener('notification', notificationListener);

      // Cleanup
      return () => {
        realTimeNotificationService.removeEventListener('connection', connectionListener);
        realTimeNotificationService.removeEventListener('notification', notificationListener);
      };
    }
  }, [userId, token]);

  React.useEffect(() => {
    // Cleanup on unmount
    return () => {
      realTimeNotificationService.disconnect();
    };
  }, []);

  return {
    isConnected,
    notifications,
    service: realTimeNotificationService
  };
};

export default realTimeNotificationService;
