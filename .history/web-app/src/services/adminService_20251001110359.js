import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import { getToken } from "./localStorageService";

// Dashboard Statistics
export const getDashboardStats = async () => {
  return await httpClient.get(`${API.BASE_URL}/admin/dashboard/stats`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

// User Management
export const getAllUsers = async (page = 0, size = 20, sort = 'id') => {
  return await httpClient.get(`${API.BASE_URL}/admin/users`, {
    params: { page, size, sort },
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const searchUsers = async (keyword) => {
  return await httpClient.post(
    `${API.BASE_URL}/admin/users/search`,
    { keyword },
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const createUser = async (userData) => {
  return await httpClient.post(
    `${API.BASE_URL}/admin/users`,
    userData,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const updateUser = async (userId, userData) => {
  return await httpClient.put(
    `${API.BASE_URL}/admin/users/${userId}`,
    userData,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const deleteUser = async (userId) => {
  return await httpClient.delete(`${API.BASE_URL}/admin/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const blockUser = async (userId) => {
  return await httpClient.post(
    `${API.BASE_URL}/admin/users/${userId}/block`,
    {},
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );
};

export const unblockUser = async (userId) => {
  return await httpClient.post(
    `${API.BASE_URL}/admin/users/${userId}/unblock`,
    {},
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );
};

// Group Management
export const getAllGroups = async (page = 0, size = 20, sort = 'id') => {
  return await httpClient.get(`${API.BASE_URL}/admin/groups`, {
    params: { page, size, sort },
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const getGroupDetails = async (groupId) => {
  return await httpClient.get(`${API.BASE_URL}/admin/groups/${groupId}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const deleteGroup = async (groupId) => {
  return await httpClient.delete(`${API.BASE_URL}/admin/groups/${groupId}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const suspendGroup = async (groupId) => {
  return await httpClient.post(
    `${API.BASE_URL}/admin/groups/${groupId}/suspend`,
    {},
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );
};

// System Settings
export const getSystemSettings = async () => {
  return await httpClient.get(`${API.BASE_URL}/admin/settings`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const updateSystemSettings = async (settings) => {
  return await httpClient.put(
    `${API.BASE_URL}/admin/settings`,
    settings,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    }
  );
};

// System Operations
export const clearCache = async () => {
  return await httpClient.post(
    `${API.BASE_URL}/admin/cache/clear`,
    {},
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );
};

export const exportLogs = async () => {
  return await httpClient.get(`${API.BASE_URL}/admin/logs/export`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
    responseType: 'blob',
  });
};

export const createDatabaseBackup = async () => {
  return await httpClient.post(
    `${API.BASE_URL}/admin/database/backup`,
    {},
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );
};

// Reports and Analytics
export const getUserActivityReport = async (startDate, endDate) => {
  return await httpClient.get(`${API.BASE_URL}/admin/reports/user-activity`, {
    params: { startDate, endDate },
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const getMessageStatistics = async (period = '7d') => {
  return await httpClient.get(`${API.BASE_URL}/admin/reports/messages`, {
    params: { period },
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

// System Health
export const getSystemHealth = async () => {
  return await httpClient.get(`${API.BASE_URL}/admin/health`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const getServerMetrics = async () => {
  return await httpClient.get(`${API.BASE_URL}/admin/metrics`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

// =====  IDENTITY SERVICE INTEGRATION =====

// Enhanced User Management with Identity Service
export const createUserWithIdentity = async (userData) => {
  try {
    const response = await httpClient.post(`${API.BASE_URL}/identity/users`, userData, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating user via identity service:', error);
    throw error;
  }
};

export const updateUserWithIdentity = async (userId, userData) => {
  try {
    const response = await httpClient.put(`${API.BASE_URL}/identity/users/${userId}`, userData, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user via identity service:', error);
    throw error;
  }
};

// Role Management
export const getAllRoles = async () => {
  try {
    const response = await httpClient.get(`${API.BASE_URL}/identity/roles`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

export const createRole = async (roleData) => {
  try {
    const response = await httpClient.post(`${API.BASE_URL}/identity/roles`, roleData, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
};

export const deleteRole = async (roleName) => {
  try {
    const response = await httpClient.delete(`${API.BASE_URL}/identity/roles/${roleName}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting role:', error);
    throw error;
  }
};

// Department Management
export const getAllDepartments = async () => {
  try {
    const response = await httpClient.get(`${API.BASE_URL}/identity/departments`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
};

export const createDepartment = async (departmentData) => {
  try {
    const response = await httpClient.post(`${API.BASE_URL}/identity/departments`, departmentData, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating department:', error);
    throw error;
  }
};

export const updateDepartment = async (departmentId, departmentData) => {
  try {
    const response = await httpClient.put(`${API.BASE_URL}/identity/departments/${departmentId}`, departmentData, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating department:', error);
    throw error;
  }
};

export const deleteDepartment = async (departmentId) => {
  try {
    const response = await httpClient.delete(`${API.BASE_URL}/identity/departments/${departmentId}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting department:', error);
    throw error;
  }
};

// User Status Management
export const activateUser = async (userId) => {
  try {
    const response = await httpClient.put(`${API.BASE_URL}/identity/users/${userId}/activate`, {}, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error activating user:', error);
    throw error;
  }
};

export const deactivateUser = async (userId) => {
  try {
    const response = await httpClient.put(`${API.BASE_URL}/identity/users/${userId}/deactivate`, {}, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deactivating user:', error);
    throw error;
  }
};

// Advanced User Filtering
export const getActiveUsers = async () => {
  try {
    const response = await httpClient.get(`${API.BASE_URL}/identity/users/active`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching active users:', error);
    throw error;
  }
};

export const getInactiveUsers = async () => {
  try {
    const response = await httpClient.get(`${API.BASE_URL}/identity/users/inactive`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching inactive users:', error);
    throw error;
  }
};

export const getOnlineUsers = async () => {
  try {
    const response = await httpClient.get(`${API.BASE_URL}/identity/users/online`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching online users:', error);
    throw error;
  }
};

export const getUsersByDepartment = async (departmentId) => {
  try {
    const response = await httpClient.get(`${API.BASE_URL}/identity/users/department/${departmentId}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching users by department:', error);
    throw error;
  }
};

// Business Management Integration
export const getAllPositions = async () => {
  try {
    const response = await httpClient.get(`${API.BASE_URL}/identity/business-management/positions`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching positions:', error);
    throw error;
  }
};

export const getAllPermissions = async () => {
  try {
    const response = await httpClient.get(`${API.BASE_URL}/identity/business-management/permissions`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching permissions:', error);
    throw error;
  }
};

export const getAllSeniorityLevels = async () => {
  try {
    const response = await httpClient.get(`${API.BASE_URL}/identity/business-management/seniority-levels`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching seniority levels:', error);
    throw error;
  }
};
