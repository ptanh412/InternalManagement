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
