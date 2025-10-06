import httpClient from '../configurations/httpClient';
import { getToken } from "./localStorageService";

const PROJECT_API_BASE = 'http://localhost:8888/api/v1/project/projects';

// Helper function to get authorization headers
const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

const projectService = {
  // Get all projects
  getAllProjects: async () => {
    try {
      const response = await httpClient.get(PROJECT_API_BASE, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  // Get project by ID
  getProjectById: async (id) => {
    try {
      const response = await httpClient.get(`${PROJECT_API_BASE}/${id}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error fetching project ${id}:`, error);
      throw error;
    }
  },

  // Create new project
  createProject: async (projectData) => {
    try {
      const response = await httpClient.post(PROJECT_API_BASE, projectData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  // Update project
  updateProject: async (id, projectData) => {
    try {
      const response = await httpClient.put(`${PROJECT_API_BASE}/${id}`, projectData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error updating project ${id}:`, error);
      throw error;
    }
  },

  // Delete project
  deleteProject: async (id) => {
    try {
      const response = await httpClient.delete(`${PROJECT_API_BASE}/${id}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error deleting project ${id}:`, error);
      throw error;
    }
  },

  // Update project status
  updateProjectStatus: async (id, status) => {
    try {
      const response = await httpClient.patch(`${PROJECT_API_BASE}/${id}/status`, null, {
        ...getAuthHeaders(),
        params: { status }
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating project status ${id}:`, error);
      throw error;
    }
  },

  // Get project progress
  getProjectProgress: async (id) => {
    try {
      const response = await httpClient.get(`${PROJECT_API_BASE}/${id}/progress`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error fetching project progress ${id}:`, error);
      throw error;
    }
  },

  // Calculate project progress
  calculateProjectProgress: async (id) => {
    try {
      const response = await httpClient.put(`${PROJECT_API_BASE}/${id}/progress/calculate`, {}, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error calculating project progress ${id}:`, error);
      throw error;
    }
  },

  // Get projects by status
  getProjectsByStatus: async (status) => {
    try {
      const response = await httpClient.get(`${PROJECT_API_BASE}/status/${status}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error fetching projects by status ${status}:`, error);
      throw error;
    }
  },

  // Get projects by leader
  getProjectsByLeader: async (leaderId) => {
    try {
      const response = await httpClient.get(`${PROJECT_API_BASE}/leader/${leaderId}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error fetching projects by leader ${leaderId}:`, error);
      throw error;
    }
  },

  // Get projects by date range
  getProjectsByDateRange: async (startDate, endDate) => {
    try {
      const response = await httpClient.get(`${PROJECT_API_BASE}/date-range`, {
        ...getAuthHeaders(),
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching projects by date range:', error);
      throw error;
    }
  },

  // Search projects
  searchProjects: async (keyword) => {
    try {
      const response = await httpClient.get(`${PROJECT_API_BASE}/search`, {
        ...getAuthHeaders(),
        params: { keyword }
      });
      return response.data;
    } catch (error) {
      console.error(`Error searching projects with keyword ${keyword}:`, error);
      throw error;
    }
  },

  // Get project analytics
  getProjectAnalytics: async () => {
    try {
      const response = await httpClient.get(`${PROJECT_API_BASE}/analytics`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching project analytics:', error);
      throw error;
    }
  },

  // Get project summaries
  getProjectSummaries: async () => {
    try {
      const response = await httpClient.get(`${PROJECT_API_BASE}/summaries`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching project summaries:', error);
      throw error;
    }
  },

  // Increment total tasks
  incrementTotalTasks: async (projectId) => {
    try {
      const response = await httpClient.put(`${PROJECT_API_BASE}/${projectId}/tasks/increment`, {}, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error incrementing total tasks for project ${projectId}:`, error);
      throw error;
    }
  },

  // Update project skills
  updateProjectSkills: async (projectId, skillsToAdd) => {
    try {
      const response = await httpClient.put(`${PROJECT_API_BASE}/${projectId}/skills`, {
        skillsToAdd
      }, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error updating project skills for project ${projectId}:`, error);
      throw error;
    }
  }
};

export default projectService;