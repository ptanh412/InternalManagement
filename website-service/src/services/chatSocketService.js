import { io } from 'socket.io-client';

class ChatSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventHandlers = new Map();
    this.currentConversationId = null;
    this.chatListenersSetup = false; // ✅ Track setup state
  }

  // Connect to the chat service Socket.IO server
  connect(token) {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected');
      return;
    }

    console.log('Connecting to chat service...');
    
    this.socket = io('http://localhost:8099', {
      query: { token },
      transports: ['websocket'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    this.setupEventListeners();
  }

  // Disconnect from the socket
  disconnect() {
    if (this.socket) {
      console.log('Disconnecting from chat service...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentConversationId = null;
    }
  }

  // Setup built-in socket event listeners
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to chat service:', this.socket.id);
      this.isConnected = true;
      this.triggerHandler('connected', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from chat service:', reason);
      this.isConnected = false;
      this.triggerHandler('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.triggerHandler('connection_error', { error });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to chat service, attempt:', attemptNumber);
      this.triggerHandler('reconnected', { attemptNumber });
    });

    // Chat-specific events
    this.setupChatEventListeners();
  }

  // Setup chat-specific event listeners
  setupChatEventListeners() {
     if (!this.socket || this.chatListenersSetup) {
      console.log('⚠️ Chat listeners already setup or socket not ready');
      return;
    }

    console.log('🔧 Setting up chat event listeners...');

    // ✅ Remove ALL existing listeners trước khi đăng ký mới
    this.socket.off('message');
    this.socket.off('media-message-success');
    this.socket.off('media-message-error');
    this.socket.off('reply-message');
    this.socket.off('message-status-update');
    this.socket.off('conversation-updated');
    this.socket.off('reaction-update');
    this.socket.off('message-recalled');
    this.socket.off('message-pinned');
    this.socket.off('message-unpinned');
    this.socket.off('media-reply-success');
    this.socket.off('media-reply-error');
    this.socket.off('delete-media-success');
    this.socket.off('delete-media-error');
    this.socket.off('create-group-success');
    this.socket.off('create-group-error');
    this.socket.off('add-participants-success');
    this.socket.off('add-participants-error');
    this.socket.off('remove-participants-success');
    this.socket.off('remove-participants-error');
    this.socket.off('leave-group-success');
    this.socket.off('leave-group-error');
    this.socket.off('pin-message-success');
    this.socket.off('unpin-message-success');
    this.socket.off('pin-message-error');
    this.socket.off('reply-message-error');
    this.socket.off('react-message-error');
    this.socket.off('remove-reaction-error');
    this.socket.off('recall-message-error');
    this.socket.off('recall-message-success');

    this.chatListenersSetup = true; // Đánh dấu đã setup

    // Core message events (matching web-app patterns)
    this.socket.on('message', (message) => {
      console.log('New message received via socket:', message);
      try {
        const messageObject = typeof message === 'string' ? JSON.parse(message) : message;
        this.triggerHandler('message', messageObject);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    this.socket.on('reaction-update', (data) => {
      console.log('Reaction update received via socket:', data);
      try {
        const updateObject = typeof data === 'string' ? JSON.parse(data) : data;
        this.triggerHandler('reaction-update', updateObject);
      } catch (error) {
        console.error('Error parsing reaction update:', error);
      }
    });

    this.socket.on('reply-message', (replyMessage) => {
      console.log('New reply message received via socket:', replyMessage);
      try {
        const messageObject = typeof replyMessage === 'string' ? JSON.parse(replyMessage) : replyMessage;
        this.triggerHandler('reply-message', messageObject);
      } catch (error) {
        console.error('Error parsing reply message:', error);
      }
    });

    // Message status events
    this.socket.on('message-status-update', (statusUpdate) => {
      console.log('Message status update received:', statusUpdate);
      try {
        const statusObject = typeof statusUpdate === 'string' ? JSON.parse(statusUpdate) : statusUpdate;
        this.triggerHandler('message-status-update', statusObject);
      } catch (error) {
        console.error('Error parsing status update:', error);
      }
    });

    this.socket.on('message-recalled', (data) => {
      console.log('Message recalled:', data);
      this.triggerHandler('message-recalled', data);
    });

    this.socket.on('message-pinned', (data) => {
      console.log('Message pinned/unpinned:', data);
      this.triggerHandler('message-pinned', data);
    });

    this.socket.on('message-unpinned', (data) => {
      console.log('Message unpinned:', data);
      this.triggerHandler('message-unpinned', data);
    });

    // Conversation events
    this.socket.on('conversation-updated', (data) => {
      console.log('Conversation updated:', data);
      this.triggerHandler('conversation-updated', data);
    });

    // Media message events
    this.socket.on('media-message-success', (data) => {
      console.log('Media message sent successfully:', data);
      this.triggerHandler('media-message-success', data);
    });

    this.socket.on('media-message-error', (error) => {
      console.error('Media message error:', error);
      this.triggerHandler('media-message-error', { error });
    });

    this.socket.on('media-reply-success', (data) => {
      console.log('Media reply sent successfully:', data);
      this.triggerHandler('media-reply-success', data);
    });

    this.socket.on('media-reply-error', (error) => {
      console.error('Media reply error:', error);
      this.triggerHandler('media-reply-error', { error });
    });

    this.socket.on('delete-media-success', (messageId) => {
      console.log('Media message deleted successfully:', messageId);
      this.triggerHandler('delete-media-success', { messageId });
    });

    this.socket.on('delete-media-error', (error) => {
      console.error('Delete media error:', error);
      this.triggerHandler('delete-media-error', { error });
    });

    // Group conversation events
    this.socket.on('create-group-success', (data) => {
      console.log('Group created successfully:', data);
      this.triggerHandler('create-group-success', data);
    });

    this.socket.on('create-group-error', (error) => {
      console.error('Create group error:', error);
      this.triggerHandler('create-group-error', { error });
    });

    this.socket.on('add-participants-success', (data) => {
      console.log('Participants added successfully:', data);
      this.triggerHandler('add-participants-success', data);
    });

    this.socket.on('add-participants-error', (error) => {
      console.error('Add participants error:', error);
      this.triggerHandler('add-participants-error', { error });
    });

    this.socket.on('remove-participants-success', (data) => {
      console.log('Participants removed successfully:', data);
      this.triggerHandler('remove-participants-success', data);
    });

    this.socket.on('remove-participants-error', (error) => {
      console.error('Remove participants error:', error);
      this.triggerHandler('remove-participants-error', { error });
    });

    this.socket.on('leave-group-success', (data) => {
      console.log('Left group successfully:', data);
      this.triggerHandler('leave-group-success', data);
    });

    this.socket.on('leave-group-error', (error) => {
      console.error('Leave group error:', error);
      this.triggerHandler('leave-group-error', { error });
    });

    // Pin/Unpin message events
    this.socket.on('pin-message-success', (data) => {
      console.log('Message pinned successfully:', data);
      this.triggerHandler('pin-message-success', data);
    });

    this.socket.on('unpin-message-success', (data) => {
      console.log('Message unpinned successfully:', data);
      this.triggerHandler('unpin-message-success', data);
    });

    this.socket.on('pin-message-error', (error) => {
      console.error('Pin message error:', error);
      this.triggerHandler('pin-message-error', { error });
    });

    // Error events
    this.socket.on('reply-message-error', (error) => {
      console.error('Reply message error:', error);
      this.triggerHandler('reply-message-error', { error });
    });

    this.socket.on('react-message-error', (error) => {
      console.error('React message error:', error);
      this.triggerHandler('react-message-error', { error });
    });

    this.socket.on('remove-reaction-error', (error) => {
      console.error('Remove reaction error:', error);
      this.triggerHandler('remove-reaction-error', { error });
    });

    this.socket.on('recall-message-error', (error) => {
      console.error('Recall message error:', error);
      this.triggerHandler('recall-message-error', { error });
    });

    this.socket.on('recall-message-success', (data) => {
      console.log('Message recalled successfully:', data);
      this.triggerHandler('recall-message-success', data);
    });
  }

  // Event handler management
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

   // ✅ Sửa method off() để XÓA TẤT CẢ handlers cho event
  off(event, handler) {
    if (!this.eventHandlers.has(event)) return;

    if (handler) {
      // Xóa specific handler
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      // ✅ Xóa TẤT CẢ handlers cho event này
      this.eventHandlers.set(event, []);
      console.log(`🗑️ Cleared all handlers for event: ${event}`);
    }
  }

  // ✅ Method mới: Clear tất cả event handlers
  clearAllHandlers() {
    this.eventHandlers.clear();
    console.log('🗑️ Cleared all event handlers');
  }

  triggerHandler(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Chat actions
  joinConversation(conversationId) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log('Joining conversation:', conversationId);
    this.socket.emit('join-conversation', conversationId);
    this.currentConversationId = conversationId;
    return true;
  }

  leaveConversation(conversationId) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log('Leaving conversation:', conversationId);
    this.socket.emit('leave-conversation', conversationId);
    if (this.currentConversationId === conversationId) {
      this.currentConversationId = null;
    }
    return true;
  }

  sendReplyMessage(request) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log('Sending reply message:', request);
    this.socket.emit('reply-message', request);
    return true;
  }

  reactToMessage(messageId, icon) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    const request = { messageId, icon };
    console.log('Reacting to message:', request);
    this.socket.emit('react-message', request);
    return true;
  }

  removeReaction(messageId, icon) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    const request = { messageId, icon };
    console.log('Removing reaction from message:', request);
    this.socket.emit('remove-reaction', request);
    return true;
  }

  recallMessage(messageId, recallType = 'self') {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    const request = { messageId, recallType };
    console.log('Recalling message:', request);
    this.socket.emit('recall-message', request);
    return true;
  }

  pinMessage(messageId, pin = true) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    const request = { messageId, pin };
    console.log('Pinning/unpinning message:', request);
    this.socket.emit('pin-message', request);
    return true;
  }

  updateMessageStatus(conversationId) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log('Updating message status for conversation:', conversationId);
    this.socket.emit('message-status-update', conversationId);
    return true;
  }

  // ✅ Prevent double emit
  sendMediaMessage(request) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    // ✅ Log để debug
    console.log('📤 Emitting send-media-message (once):', request);
    
    // ✅ Emit ĐÚNG 1 LẦN
    this.socket.emit('send-media-message', request);
    return true;
  }

  sendMediaReply(request) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log('Sending media reply:', request);
    this.socket.emit('send-media-reply', request);
    return true;
  }

  deleteMediaMessage(messageId) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log('Deleting media message:', messageId);
    this.socket.emit('delete-media-message', messageId);
    return true;
  }

  // Group conversation actions
  createGroupConversation(request) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log('Creating group conversation:', request);
    this.socket.emit('create-group-conversation', request);
    return true;
  }

  addParticipants(request) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log('Adding participants:', request);
    this.socket.emit('add-participants', request);
    return true;
  }

  removeParticipants(request) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log('Removing participants:', request);
    this.socket.emit('remove-participants', request);
    return true;
  }

  leaveGroup(request) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log('Leaving group:', request);
    this.socket.emit('leave-group', request);
    return true;
  }

  // Typing indicators
  sendTypingIndicator(conversationId) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log('Sending typing indicator for conversation:', conversationId);
    this.socket.emit('typing', conversationId);
    return true;
  }

  sendStopTypingIndicator(conversationId) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log('Sending stop typing indicator for conversation:', conversationId);
    this.socket.emit('stop-typing', conversationId);
    return true;
  }

  // Enhanced conversation management
  editGroupInfo(request) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log('Editing group info:', request);
    this.socket.emit('edit-group-info', request);
    return true;
  }

  forwardMessage(request) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log('Forwarding message:', request);
    this.socket.emit('forward-message', request);
    return true;
  }

  editMessage(request) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log('Editing message:', request);
    this.socket.emit('edit-message', request);
    return true;
  }

  // Utility methods
  isSocketConnected() {
    return this.socket && this.isConnected;
  }

  getCurrentConversation() {
    return this.currentConversationId;
  }

  getSocketId() {
    return this.socket ? this.socket.id : null;
  }
}

// Export singleton instance
const chatSocketService = new ChatSocketService();
export default chatSocketService;