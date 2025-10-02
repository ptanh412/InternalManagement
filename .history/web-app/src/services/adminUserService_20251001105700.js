import httpClient from '../configurations/httpClient';
import { getToken } from './localStorageService';

const IDENTITY_API_BASE = '/identity';

const adminUserService = {
  // ===== USER MANAGEMENT =====
  
  // Get all users
  getAllUsers: async () => {
    try {
      const response = await httpClient.get(`${IDENTITY_API_BASE}/users`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  },

  // Get user by ID
  getUser: async (userId) => {
    try {
      const response = await httpClient.get(`${IDENTITY_API_BASE}/users/${userId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      throw error;
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      const response = await httpClient.post(`${IDENTITY_API_BASE}/users`, userData, {
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json"
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    try {
      console.log('Updating user:', userId, userData);
      const response = await httpClient.put(`${IDENTITY_API_BASE}/users/${userId}`, userData, {
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json"
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const response = await httpClient.delete(`${IDENTITY_API_BASE}/users/${userId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // ===== USER STATUS MANAGEMENT =====

  // Update user status (activate/deactivate/etc.)
  updateUserStatus: async (userId, statusData) => {
    try {
      const response = await httpClient.post(`${IDENTITY_API_BASE}/users/${userId}/status`, statusData, {
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json"
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },

  // Activate user
  activateUser: async (userId) => {
    try {
      const response = await httpClient.put(`${IDENTITY_API_BASE}/users/${userId}/activate`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error activating user:', error);
      throw error;
    }
  },

  // Deactivate user
  deactivateUser: async (userId) => {
    try {
      const response = await httpClient.put(`${IDENTITY_API_BASE}/users/${userId}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  },

  // ===== USER FILTERING =====

  // Get users by department
  getUsersByDepartment: async (departmentId) => {
    try {
      const response = await httpClient.get(`${IDENTITY_API_BASE}/users/department/${departmentId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching users by department ${departmentId}:`, error);
      throw error;
    }
  },

  // Get active users
  getActiveUsers: async () => {
    try {
      const response = await httpClient.get(`${IDENTITY_API_BASE}/users/active`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching active users:', error);
      throw error;
    }
  },

  // Get inactive users
  getInactiveUsers: async () => {
    try {
      const response = await httpClient.get(`${IDENTITY_API_BASE}/users/inactive`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching inactive users:', error);
      throw error;
    }
  },

  // Get online users
  getOnlineUsers: async () => {
    try {
      const response = await httpClient.get(`${IDENTITY_API_BASE}/users/online`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching online users:', error);
      throw error;
    }
  },

  // ===== BUSINESS MANAGEMENT INTEGRATION =====

  // Get all positions
  getAllPositions: async () => {
    try {
      const response = await httpClient.get(`${IDENTITY_API_BASE}/business-management/positions`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  },

  // Get all permissions
  getAllPermissions: async () => {
    try {
      const response = await httpClient.get(`${IDENTITY_API_BASE}/business-management/permissions`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  },

  // Get all seniority levels
  getAllSeniorityLevels: async () => {
    try {
      const response = await httpClient.get(`${IDENTITY_API_BASE}/business-management/seniority-levels`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching seniority levels:', error);
      throw error;
    }
  },

  // ===== USER ANALYTICS =====

  // Get user statistics for dashboard
  getUserStats: async () => {
    try {
      const [allUsers, activeUsers, inactiveUsers, onlineUsers] = await Promise.all([
        adminUserService.getAllUsers(),
        adminUserService.getActiveUsers(),
        adminUserService.getInactiveUsers(),
        adminUserService.getOnlineUsers()
      ]);

      return {
        total: allUsers.result?.length || 0,
        active: activeUsers.result?.length || 0,
        inactive: inactiveUsers.result?.length || 0,
        online: onlineUsers.result?.length || 0,
        activationRate: allUsers.result?.length > 0 ? 
          Math.round((activeUsers.result?.length / allUsers.result?.length) * 100) : 0
      };
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      throw error;
    }
  }
};

export default adminUserService;
