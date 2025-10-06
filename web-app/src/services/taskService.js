import httpClient from '../configurations/httpClient';
import { getToken } from "./localStorageService";

const TASK_SERVICE_BASE_URL = 'http://localhost:8888/api/v1/task';

// Helper function to get authorization headers
const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

class TaskService {
  // Basic CRUD operations
  async createTask(taskData) {
    try {
      const response = await httpClient.post(`${TASK_SERVICE_BASE_URL}/tasks`, taskData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async updateTask(taskId, taskData) {
    try {
      const response = await httpClient.put(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}`, taskData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(taskId) {
    try {
      await httpClient.delete(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}`, getAuthHeaders());
      return { success: true };
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  async getTask(taskId) {
    try {
      const response = await httpClient.get(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching task:', error);
      throw error;
    }
  }

  async getAllTasks(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.projectId) {
        params.append('projectId', filters.projectId);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.assigneeId) {
        params.append('assigneeId', filters.assigneeId);
      }
      if (filters.userId) {
        params.append('userId', filters.userId);
      }
      if (filters.userRole) {
        params.append('userRole', filters.userRole);
      }

      const response = await httpClient.get(`${TASK_SERVICE_BASE_URL}/tasks?${params.toString()}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  // Task workflow operations
  async updateTaskStatus(taskId, statusData) {
    try {
      const response = await httpClient.put(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/status`, statusData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  async assignTask(taskId, userId) {
    try {
      const response = await httpClient.put(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/assign/${userId}`, {}, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error;
    }
  }

  async updateTaskProgress(taskId, progressData) {
    try {
      const response = await httpClient.put(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/progress`, progressData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error updating task progress:', error);
      throw error;
    }
  }

  // Task dependencies operations
  async getTaskDependencies(taskId) {
    try {
      const response = await httpClient.get(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/dependencies`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching task dependencies:', error);
      throw error;
    }
  }

  async addTaskDependency(taskId, dependencyData) {
    try {
      const response = await httpClient.post(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/dependencies`, dependencyData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error adding task dependency:', error);
      throw error;
    }
  }

  async removeTaskDependency(taskId, dependencyId) {
    try {
      await httpClient.delete(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/dependencies/${dependencyId}`, getAuthHeaders());
      return { success: true };
    } catch (error) {
      console.error('Error removing task dependency:', error);
      throw error;
    }
  }

  // Task skills operations
  async getTaskSkills(taskId) {
    try {
      const response = await httpClient.get(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/skills`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching task skills:', error);
      throw error;
    }
  }

  async addTaskSkill(taskId, skillData) {
    try {
      const response = await httpClient.post(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/skills`, skillData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error adding task skill:', error);
      throw error;
    }
  }

  async removeTaskSkill(taskId, skillId) {
    try {
      await httpClient.delete(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/skills/${skillId}`, getAuthHeaders());
      return { success: true };
    } catch (error) {
      console.error('Error removing task skill:', error);
      throw error;
    }
  }

  // Task submission operations
  async submitTask(taskId, submissionData) {
    try {
      const response = await httpClient.post(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/submit`, submissionData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error submitting task:', error);
      throw error;
    }
  }

  async getTaskSubmissions(taskId) {
    try {
      const response = await httpClient.get(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/submissions`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching task submissions:', error);
      throw error;
    }
  }

  // Employee-specific methods for dashboard
  async getMyTasks() {
    try {
      const response = await httpClient.get(`${TASK_SERVICE_BASE_URL}/tasks/my-tasks`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching my tasks:', error);
      throw error;
    }
  }

  async getTasksAssignedToUser(userId) {
    try {
      const response = await httpClient.get(`${TASK_SERVICE_BASE_URL}/tasks/assigned/${userId}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks assigned to user:', error);
      throw error;
    }
  }

  // Helper methods for dashboard statistics
  async getMyTaskStats() {
    try {
      const tasks = await this.getMyTasks();
      const stats = {
        total: tasks.length,
        todo: tasks.filter(task => task.status === 'TODO').length,
        inProgress: tasks.filter(task => task.status === 'IN_PROGRESS').length,
        completed: tasks.filter(task => task.status === 'DONE').length,
        overdue: tasks.filter(task => {
          if (!task.dueDate) return false;
          return new Date(task.dueDate) < new Date() && task.status !== 'DONE';
        }).length,
      };
      return stats;
    } catch (error) {
      console.error('Error calculating task stats:', error);
      throw error;
    }
  }

  async getMyOverdueTasks() {
    try {
      const tasks = await this.getMyTasks();
      return tasks.filter(task => {
        if (!task.dueDate || task.status === 'DONE') return false;
        return new Date(task.dueDate) < new Date();
      });
    } catch (error) {
      console.error('Error fetching overdue tasks:', error);
      throw error;
    }
  }

  async getMyUpcomingTasks() {
    try {
      const tasks = await this.getMyTasks();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      return tasks.filter(task => {
        if (!task.dueDate || task.status === 'DONE') return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= new Date() && dueDate <= nextWeek;
      }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    } catch (error) {
      console.error('Error fetching upcoming tasks:', error);
      throw error;
    }
  }

  async getMyRecentActivity() {
    try {
      const tasks = await this.getMyTasks();
      return tasks
        .filter(task => task.modifiedDate)
        .sort((a, b) => new Date(b.modifiedDate) - new Date(a.modifiedDate))
        .slice(0, 10);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  }

  // Task priority and status helpers
  getPriorityColor(priority) {
    const colors = {
      LOW: '#4caf50',
      MEDIUM: '#ff9800',
      HIGH: '#f44336',
      URGENT: '#d32f2f'
    };
    return colors[priority] || '#757575';
  }

  getStatusColor(status) {
    const colors = {
      TODO: '#757575',
      IN_PROGRESS: '#2196f3',
      DONE: '#4caf50',
      BLOCKED: '#f44336'
    };
    return colors[status] || '#757575';
  }

  formatTaskForDisplay(task) {
    return {
      ...task,
      priorityColor: this.getPriorityColor(task.priority),
      statusColor: this.getStatusColor(task.status),
      isOverdue: task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE',
      daysUntilDue: task.dueDate ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null,
      progressPercentage: task.progressPercentage || 0,
    };
  }
}

const taskService = new TaskService();
export default taskService;
