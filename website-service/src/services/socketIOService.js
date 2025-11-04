import { io } from 'socket.io-client';

class SocketIOService {
  constructor() {
    this.projectSocket = null;
    this.taskSocket = null;
    this.isProjectConnected = false;
    this.isTaskConnected = false;
    this.listeners = new Map();
  }

  connect() {
    this.connectToProjectService();
    this.connectToTaskService();
  }

  connectToProjectService() {
    if (this.projectSocket && this.isProjectConnected) {
      return this.projectSocket;
    }

    // Connect to the project-service Socket.IO server
    this.projectSocket = io('http://localhost:9095', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.projectSocket.on('connect', () => {
      console.log('Connected to Project-service Socket.IO server:', this.projectSocket.id);
      this.isProjectConnected = true;
    });

    this.projectSocket.on('disconnect', (reason) => {
      console.log('Disconnected from Project-service Socket.IO server:', reason);
      this.isProjectConnected = false;
    });

    this.projectSocket.on('connect_error', (error) => {
      console.error('Project-service Socket.IO connection error:', error);
      this.isProjectConnected = false;
    });

    // Set up project-related event listeners
    this.setupProjectEventListeners();

    return this.projectSocket;
  }

  connectToTaskService() {
    if (this.taskSocket && this.isTaskConnected) {
      return this.taskSocket;
    }

    // Connect to the task-service Socket.IO server
    this.taskSocket = io('http://localhost:9093', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.taskSocket.on('connect', () => {
      console.log('Connected to Task-service Socket.IO server:', this.taskSocket.id);
      this.isTaskConnected = true;
    });

    this.taskSocket.on('disconnect', (reason) => {
      console.log('Disconnected from Task-service Socket.IO server:', reason);
      this.isTaskConnected = false;
    });

    this.taskSocket.on('connect_error', (error) => {
      console.error('Task-service Socket.IO connection error:', error);
      this.isTaskConnected = false;
    });

    // Set up task-related event listeners
    this.setupTaskEventListeners();

    return this.taskSocket;
  }

  setupProjectEventListeners() {
    if (!this.projectSocket) return;

    // Listen for project creation notifications
    this.projectSocket.on('project-created', (data) => {
      console.log('New project created:', data);
      this.notifyListeners('project-created', data);
    });

    // Listen for project update notifications
    this.projectSocket.on('project-updated', (data) => {
      console.log('Project updated:', data);
      this.notifyListeners('project-updated', data);
    });

    // Listen for project status change notifications
    this.projectSocket.on('project-status-changed', (data) => {
      console.log('Project status changed:', data);
      this.notifyListeners('project-status-changed', data);
    });
  }

  setupTaskEventListeners() {
    if (!this.taskSocket) return;

    // Listen for task assignment notifications
    this.taskSocket.on('task-assigned', (data) => {
      console.log('Task assigned:', data);
      this.notifyListeners('task-assigned', data);
    });

    this.taskSocket.on('task-transferred', (data) => {
      console.log('Task transferred:', data);
      this.notifyListeners('task-transferred', data);
    });

    this.taskSocket.on('task-status-update', (data) => {
      console.log('Task status update:', data);
      this.notifyListeners('task-status-update', data);
    });


    // Listen for task status change notifications
    this.taskSocket.on('task-status-changed', (data) => {
      console.log('Task status changed:', data);
      this.notifyListeners('task-status-changed', data);
    });

    // Listen for task update notifications
    this.taskSocket.on('task-updated', (data) => {
      console.log('Task updated:', data);
      this.notifyListeners('task-updated', data);
    });
  }

  disconnect() {
    if (this.projectSocket) {
      this.projectSocket.disconnect();
      this.projectSocket = null;
      this.isProjectConnected = false;
    }

    if (this.taskSocket) {
      this.taskSocket.disconnect();
      this.taskSocket = null;
      this.isTaskConnected = false;
    }

    this.listeners.clear();
  }

  // Subscribe to specific events
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  // Notify all listeners for a specific event
  notifyListeners(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in Socket.IO listener for event ${event}:`, error);
        }
      });
    }
  }

  // Send a message to the server (if needed)
  emit(event, data) {
    if (this.projectSocket && this.isProjectConnected) {
      this.projectSocket.emit(event, data);
    } else if (this.taskSocket && this.isTaskConnected) {
      this.taskSocket.emit(event, data);
    } else {
      console.warn('Socket.IO not connected. Cannot emit event:', event);
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isProjectConnected: this.isProjectConnected,
      isTaskConnected: this.isTaskConnected,
      projectSocketId: this.projectSocket?.id || null,
      taskSocketId: this.taskSocket?.id || null,
    };
  }
}

// Create a singleton instance
const socketIOService = new SocketIOService();

export default socketIOService;
