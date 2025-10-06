import { getToken } from "./localStorageService";
import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8888/api/v1";

// Helper function to get authorization headers
const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Get current user information including role
export const getCurrentUser = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/identity/users/my-info`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

// Get projects based on user role
export const getProjectsForUser = async (userId, userRole) => {
  try {
    let url;

    if (userRole === 'TEAM_LEAD') {
      url = `${API_BASE_URL}/project/projects/team-lead/${userId}`;
    } else if (userRole === 'PROJECT_MANAGER') {
      // Use the specific endpoint for getting projects by project leader ID
      url = `${API_BASE_URL}/project/projects/leader/${userId}`;
    } else {
      // For other roles, get all projects
      url = `${API_BASE_URL}/project/projects`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    const data = await response.json();
    let projects = data.result || [];

    // Sort projects by creation date in descending order (most recent first)
    projects = projects.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.createdDate);
      const dateB = new Date(b.createdAt || b.createdDate);
      return dateB - dateA; // Descending order
    });

    return projects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

// Get tasks based on user role
export const getTasksForUser = async (userId, userRole) => {
  try {
    const url = userRole === 'TEAM_LEAD'
      ? `${API_BASE_URL}/task/tasks/team-lead/${userId}`
      : `${API_BASE_URL}/task/tasks`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }

    const data = await response.json();
    return data.result || data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

// Check if user is TeamLead
export const isTeamLead = (userRole) => {
  return userRole === 'TEAM_LEAD';
};

export const getMyInfo = async () => {
  return await httpClient.get(API.MY_INFO, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const updateProfile = async (profileData) => {
  return await httpClient.put(API.UPDATE_PROFILE, profileData, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
  });
};

export const uploadAvatar = async (formData) => {
  return await httpClient.put(API.UPDATE_AVATAR, formData, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

// User Management APIs - Admin can create users
export const createUser = async (userData) => {
  try {
    const response = await httpClient.post('/identity/users/admin/create', userData, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const response = await httpClient.get('/identity/users', {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const response = await httpClient.get(`/identity/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
      const response = await httpClient.put(`/identity/users/${userId}`, userData, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await httpClient.delete(`/identity/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw error;
  }
};

export const search = async (keyword) => {
  return await httpClient.post(
    API.SEARCH_USER,
    { keyword: keyword },
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    }
  );
};

// Get users by role for dropdown selection
export const getUsersByRole = async (roleName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/identity/users/role/${roleName}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users by role');
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error fetching users by role:', error);
    throw error;
  }
};

// Get all active users
export const getAllActiveUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/identity/users/active`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch active users');
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error fetching active users:', error);
    throw error;
  }
};
