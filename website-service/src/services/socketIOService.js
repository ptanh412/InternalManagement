import { io } from 'socket.io-client';

class SocketIOService {
  constructor() {
    this.projectSocket = null;
    this.taskSocket = null;
    this.postSocket = null;
    this.isProjectConnected = false;
    this.isTaskConnected = false;
    this.isPostConnected = false;
    this.listeners = new Map();
    this.currentRooms = new Set(); // Track joined rooms for reconnection
    this.connectionInitialized = false; // ✅ THÊM flag
  }

  connect() {
    if (this.connectionInitialized) {
      console.log('⚠️ Socket connections already initialized, skipping');
      return;
    }
    
    console.log('🔌 Initializing socket connections...');
    this.connectionInitialized = true;
    
    this.connectToProjectService();
    this.connectToTaskService();
    this.connectToPostService();
  }

  // ✅ THÊM: Method để force reconnect nếu cần
  forceReconnect() {
    console.log('🔄 Force reconnecting all sockets...');
    this.disconnect();
    this.connectionInitialized = false;
    this.connect();
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

  connectToPostService() {
    if (this.postSocket && this.isPostConnected) {
      console.log('⚠️ Post socket already connected, reusing existing connection');
      return this.postSocket;
    }

    // ✅ THÊM: Disconnect old socket nếu tồn tại
    if (this.postSocket) {
      console.log('⚠️ Disconnecting old post socket before creating new one');
      this.postSocket.disconnect();
      this.postSocket = null;
    }

    console.log('🔌 Creating NEW Post-service Socket.IO connection...');

    const token = localStorage.getItem('token');

    this.postSocket = io('http://localhost:8092', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      query: {
        token: token || ''
      }
    });

    this.postSocket.on('connect', () => {
      console.log('✅ Connected to Post-service Socket.IO server:', this.postSocket.id);
      this.isPostConnected = true;
      
      if (this.currentRooms.size > 0) {
        console.log('🔄 Rejoining rooms after reconnection:', Array.from(this.currentRooms));
        this.currentRooms.forEach(roomId => {
          this.postSocket.emit('room:join', roomId);
        });
      }
    });

    this.postSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Post-service Socket.IO server:', reason);
      this.isPostConnected = false;
    });

    this.postSocket.on('connect_error', (error) => {
      console.error('⚠️ Post-service Socket.IO connection error:', error);
      this.isPostConnected = false;
    });

    this.setupPostEventListeners();

    return this.postSocket;
  }
  setupPostEventListeners() {
    if (!this.postSocket) return;
    

    // Post events
    this.postSocket.on('post:created', (data) => {
      console.log('Post created:', data);
      this.notifyListeners('post:created', data);
    });

    this.postSocket.on('post:updated', (data) => {
      console.log('Post updated:', data);
      this.notifyListeners('post:updated', data);
    });

    this.postSocket.on('post:deleted', (data) => {
      console.log('Post deleted:', data);
      this.notifyListeners('post:deleted', data);
    });

    this.postSocket.on('post:error', (error) => {
      console.error('Post error:', error);
      this.notifyListeners('post:error', error);
    });

    // Comment events
    this.postSocket.on('comment:created', (data) => {
      console.log('Comment created:', data);
      this.notifyListeners('comment:created', data);
    });

    this.postSocket.on('comment:updated', (data) => {
      console.log('Comment updated:', data);
      this.notifyListeners('comment:updated', data);
    });

    this.postSocket.on('comment:deleted', (data) => {
      console.log('Comment deleted:', data);
      this.notifyListeners('comment:deleted', data);
    });

    this.postSocket.on('comment:error', (error) => {
      console.error('Comment error:', error);
      this.notifyListeners('comment:error', error);
    });

    // Reaction events
    this.postSocket.on('reaction:toggled', (data) => {
      console.log('Reaction toggled:', data);
      this.notifyListeners('reaction:toggled', data);
    });

    this.postSocket.on('reaction:error', (error) => {
      console.error('Reaction error:', error);
      this.notifyListeners('reaction:error', error);
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

    if (this.postSocket) {
      this.postSocket.disconnect();
      this.postSocket = null;
      this.isPostConnected = false;
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
  emit(event, ...args) {
    if (this.projectSocket && this.isProjectConnected) {
      this.projectSocket.emit(event, ...args);
    } else if (this.taskSocket && this.isTaskConnected) {
      this.taskSocket.emit(event, ...args);
    } else if (this.postSocket && this.isPostConnected) {
      this.postSocket.emit(event, ...args);
    } else {
      console.warn('Socket.IO not connected. Cannot emit event:', event);
    }
  }

  // Post-specific emit methods
  emitPost(event, ...args) {
    if (!this.postSocket || !this.isPostConnected) {
      console.warn('Post Socket.IO not connected. Cannot emit event:', event);
      return;
    }

    // ✅ THÊM: Log để debug  
    console.log(`[SocketIO] Emitting event: ${event}`, args);
    console.trace(); // Xem call stack
    
    this.postSocket.emit(event, ...args);
  }

  // Join a room (for department or post-specific updates)
  joinRoom(roomId) {
    // Track this room for reconnection
    this.currentRooms.add(roomId);
    
    if (this.postSocket && this.isPostConnected) {
      this.postSocket.emit('room:join', roomId);
      console.log('Joined room:', roomId);
    } else {
      // If not connected yet, join when connection is established
      console.log('Socket not connected yet, will join room on connect:', roomId);
      const joinOnConnect = () => {
        if (this.postSocket) {
          this.postSocket.emit('room:join', roomId);
          console.log('Joined room on connect:', roomId);
          this.postSocket.off('connect', joinOnConnect);
        }
      };
      
      if (this.postSocket) {
        this.postSocket.once('connect', joinOnConnect);
      }
    }
  }

  // Leave a room
  leaveRoom(roomId) {
    // Remove from tracked rooms
    this.currentRooms.delete(roomId);
    
    if (this.postSocket && this.isPostConnected) {
      this.postSocket.emit('room:leave', roomId);
      console.log('Left room:', roomId);
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isProjectConnected: this.isProjectConnected,
      isTaskConnected: this.isTaskConnected,
      isPostConnected: this.isPostConnected,
      projectSocketId: this.projectSocket?.id || null,
      taskSocketId: this.taskSocket?.id || null,
      postSocketId: this.postSocket?.id || null,
    };
  }
}

// Create a singleton instance
const socketIOService = new SocketIOService();

export default socketIOService;
