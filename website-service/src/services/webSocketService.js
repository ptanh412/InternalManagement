import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnected = false;
  }

  connect(userId, userRole) {
    try {
      const wsUrl = process.env.REACT_APP_WS_URL || 'http://localhost:8888';
      
      this.socket = io(wsUrl, {
        auth: {
          token: localStorage.getItem('token'),
          userId,
          userRole
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: this.maxReconnectAttempts
      });

      this.setupEventListeners();
      
      console.log('WebSocket connecting...', { userId, userRole });
      return this.socket;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      return null;
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection', { status: 'connected', socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('connection', { status: 'disconnected', reason });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.emit('connection', { status: 'reconnected', attempts: attemptNumber });
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error);
      this.reconnectAttempts++;
      this.emit('connection', { status: 'reconnect_error', error, attempts: this.reconnectAttempts });
    });

    // Real-time dashboard data events
    this.socket.on('dashboard_update', (data) => {
      console.log('Dashboard update received:', data);
      this.emit('dashboard_update', data);
    });

    // Performance metrics updates
    this.socket.on('performance_update', (data) => {
      console.log('Performance metrics update:', data);
      this.emit('performance_update', data);
    });

    // Task updates
    this.socket.on('task_update', (data) => {
      console.log('Task update received:', data);
      this.emit('task_update', data);
    });

    // Project updates
    this.socket.on('project_update', (data) => {
      console.log('Project update received:', data);
      this.emit('project_update', data);
    });

    // Team updates
    this.socket.on('team_update', (data) => {
      console.log('Team update received:', data);
      this.emit('team_update', data);
    });

    // System updates (for admin)
    this.socket.on('system_update', (data) => {
      console.log('System update received:', data);
      this.emit('system_update', data);
    });

    // Resource updates
    this.socket.on('resource_update', (data) => {
      console.log('Resource update received:', data);
      this.emit('resource_update', data);
    });

    // Work time updates
    this.socket.on('worktime_update', (data) => {
      console.log('Work time update received:', data);
      this.emit('worktime_update', data);
    });
  }

  // Subscribe to events
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

  // Emit events to listeners
  emit(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Send data to server
  send(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot send:', event, data);
    }
  }

  // Join specific rooms for targeted updates
  joinRoom(roomName) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_room', roomName);
      console.log('Joined room:', roomName);
    }
  }

  leaveRoom(roomName) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_room', roomName);
      console.log('Left room:', roomName);
    }
  }

  // Request real-time data for specific dashboard
  requestDashboardData(dashboardType, filters = {}) {
    this.send('request_dashboard_data', {
      type: dashboardType,
      filters,
      timestamp: new Date().toISOString()
    });
  }

  // Request performance data updates
  requestPerformanceData(userId, dateRange = {}) {
    this.send('request_performance_data', {
      userId,
      dateRange,
      timestamp: new Date().toISOString()
    });
  }

  // Request team data updates
  requestTeamData(teamId, metrics = []) {
    this.send('request_team_data', {
      teamId,
      metrics,
      timestamp: new Date().toISOString()
    });
  }

  // Check connection status
  isSocketConnected() {
    return this.socket && this.isConnected && this.socket.connected;
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
      console.log('WebSocket disconnected manually');
    }
  }

  // Get connection info
  getConnectionInfo() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      transport: this.socket?.io?.engine?.transport?.name,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;