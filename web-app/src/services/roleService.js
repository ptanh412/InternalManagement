import httpClient from '../configurations/httpClient';
import { getToken } from './localStorageService';

const ROLE_API_BASE = '/identity/roles';
const BUSINESS_API_BASE = '/identity/business-management';
const PERMISSION_API_BASE = '/identity/permissions';

// Role Management API
export const roleService = {
  // Get all roles
  getAllRoles: async () => {
    try {
      const response = await httpClient.get(ROLE_API_BASE, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  // Create new role
  createRole: async (roleData) => {
    try {
      const response = await httpClient.post(ROLE_API_BASE, roleData, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  },

  // Update role permissions (send only new permissions array)
  updateRole: async (roleName, newPermissionsArray) => {
    try {
      console.log("Role name:", roleName);
      console.log("New permissions:", newPermissionsArray);
      const response = await httpClient.put(
        `${ROLE_API_BASE}/${roleName}`,
        newPermissionsArray,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  },

  // Delete role
  deleteRole: async (roleId) => {
    try {
      const response = await httpClient.delete(`${ROLE_API_BASE}/${roleId}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting role ${roleId}:`, error);
      throw error;
    }
  },

  // Get business roles
  getBusinessRoles: async () => {
    try {
      const response = await httpClient.get(`${BUSINESS_API_BASE}/roles`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      console.log('Business roles:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching business roles:', error);
      throw error;
    }
  },

  // Get users by business role
  getUsersByBusinessRole: async (businessRole) => {
    try {
      const response = await httpClient.get(`${BUSINESS_API_BASE}/users/business-role/${businessRole}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      // console.log(`Users for business role ${businessRole}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching users for business role ${businessRole}:`, error);
      throw error;
    }
  },

  // Get organizational hierarchy
  getOrganizationalHierarchy: async () => {
    try {
      const response = await httpClient.get(`${BUSINESS_API_BASE}/hierarchy`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching organizational hierarchy:', error);
      throw error;
    }
  },

  // Get all permissions
  getAllPermissions: async () => {
    try {
      const response = await httpClient.get(PERMISSION_API_BASE, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  },
};

export default roleService;
