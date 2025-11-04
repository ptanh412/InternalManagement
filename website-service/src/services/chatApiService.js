import axios from 'axios';

// Base URL for chat service via API Gateway
const API_GATEWAY_URL = 'http://localhost:8888/api/v1';

class ChatApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_GATEWAY_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Conversation methods
  async getConversations() {
    try {
      const response = await this.api.get('/chat/conversations/my-conversations');
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  async createConversation(request) {
    try {
      const response = await this.api.post('/chat/conversations/create', request);
      return response.data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  async getConversationById(conversationId) {
    try {
      const response = await this.api.get(`/chat/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  }

  async deleteConversation(conversationId) {
    try {
      const response = await this.api.delete(`/chat/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  // Group conversation methods
  async createGroup(request) {
    try {
      const response = await this.api.post('/chat/conversations/create-group', request);
      return response.data;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  async addParticipants(conversationId, request) {
    try {
      const response = await this.api.post(`/chat/conversations/${conversationId}/add-participants`, request);
      return response.data;
    } catch (error) {
      console.error('Error adding participants:', error);
      throw error;
    }
  }

  async removeParticipants(conversationId, request) {
    try {
      const response = await this.api.post(`/chat/conversations/${conversationId}/remove-participants`, request);
      return response.data;
    } catch (error) {
      console.error('Error removing participants:', error);
      throw error;
    }
  }

  async leaveGroup(conversationId) {
    try {
      const response = await this.api.post(`/chat/conversations/${conversationId}/leave`);
      return response.data;
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  }

  async editGroupInfo(conversationId, request) {
    try {
      const response = await this.api.put(`/chat/conversations/${conversationId}/edit-info`, request);
      return response.data;
    } catch (error) {
      console.error('Error editing group info:', error);
      throw error;
    }
  }

  // Message methods
  async getMessages(conversationId) {
    try {
      const response = await this.api.get(`/chat/messages?conversationId=${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async sendMessage(request) {
    try {
      const response = await this.api.post('/chat/messages/create', request);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async forwardMessage(request) {
    try {
      const response = await this.api.post('/chat/messages/forward', request);
      return response.data;
    } catch (error) {
      console.error('Error forwarding message:', error);
      throw error;
    }
  }

  async uploadMedia(file, conversationId) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversationId);

      const response = await this.api.post('/chat/messages/media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }

  // Message reaction methods
  async getMessageReactions(messageId) {
    try {
      const response = await this.api.get(`/chat/messages/${messageId}/reactions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching message reactions:', error);
      throw error;
    }
  }

  // Search methods
  async searchMessages(query, conversationId = null) {
    try {
      const params = { query };
      if (conversationId) {
        params.conversationId = conversationId;
      }
      const response = await this.api.get('/chat/messages/search', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }

  // Pinned messages
  async getPinnedMessages(conversationId) {
    try {
      const response = await this.api.get(`/chat/messages/${conversationId}/pinned`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pinned messages:', error);
      throw error;
    }
  }

  // User methods (from profile service)
  async searchUsers(query) {
    try {
      const response = await this.api.get(`/profile/users/search?query=${query}`);
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      const response = await this.api.get(`/profile/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }
}

// Export singleton instance
const chatApiService = new ChatApiService();
export default chatApiService;