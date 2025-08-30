import httpClient from '../configurations/httpClient';
import { getToken } from './localStorageService';

const DEPARTMENT_API_BASE = '/identity/departments';

// Department Management API
export const departmentService = {
  // Get all departments
  getAllDepartments: async () => {
    try {
      const response = await httpClient.get(DEPARTMENT_API_BASE, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },

  // Get department by ID
  getDepartment: async (departmentId) => {
    try {
      const response = await httpClient.get(`${DEPARTMENT_API_BASE}/${departmentId}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching department ${departmentId}:`, error);
      throw error;
    }
  },

  // Create new department
  createDepartment: async (departmentData) => {
    try {
      const response = await httpClient.post(DEPARTMENT_API_BASE, departmentData, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  },

  // Update department
  updateDepartment: async (departmentId, departmentData) => {
    try {
      const response = await httpClient.put(`${DEPARTMENT_API_BASE}/${departmentId}`, departmentData, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating department ${departmentId}:`, error);
      throw error;
    }
  },

  // Delete department
  deleteDepartment: async (departmentId) => {
    try {
      const response = await httpClient.delete(`${DEPARTMENT_API_BASE}/${departmentId}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting department ${departmentId}:`, error);
      throw error;
    }
  },

  // Get users by department
  getUsersByDepartment: async (departmentId) => {
    try {
      const response = await httpClient.get(`/identity/business/users/department/${departmentId}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching users for department ${departmentId}:`, error);
      throw error;
    }
  },
};

export default departmentService;
