import httpClient from './httpClient';

const TASK_SERVICE_BASE_URL = 'http://localhost:8088/task';

class TaskService {
  // Basic CRUD operations
  async createTask(taskData) {
    try {
      const response = await httpClient.post(`${TASK_SERVICE_BASE_URL}/tasks`, taskData);
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async updateTask(taskId, taskData) {
    try {
      const response = await httpClient.put(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(taskId) {
    try {
      await httpClient.delete(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  async getTask(taskId) {
    try {
      const response = await httpClient.get(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}`);
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

      const response = await httpClient.get(`${TASK_SERVICE_BASE_URL}/tasks?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  // Task workflow operations
  async updateTaskStatus(taskId, statusData) {
    try {
      const response = await httpClient.put(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  async assignTask(taskId, userId) {
    try {
      const response = await httpClient.put(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/assign/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error;
    }
  }

  async updateTaskProgress(taskId, progressData) {
    try {
      const response = await httpClient.put(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/progress`, progressData);
      return response.data;
    } catch (error) {
      console.error('Error updating task progress:', error);
      throw error;
    }
  }

  // Task dependencies
  async getTaskDependencies(taskId) {
    try {
      const response = await httpClient.get(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/dependencies`);
      return response.data;
    } catch (error) {
      console.error('Error fetching task dependencies:', error);
      throw error;
    }
  }

  async addTaskDependency(taskId, dependencyData) {
    try {
      const response = await httpClient.post(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/dependencies`, dependencyData);
      return response.data;
    } catch (error) {
      console.error('Error adding task dependency:', error);
      throw error;
    }
  }

  async removeTaskDependency(taskId, dependencyId) {
    try {
      await httpClient.delete(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/dependencies/${dependencyId}`);
      return { success: true };
    } catch (error) {
      console.error('Error removing task dependency:', error);
      throw error;
    }
  }

  // Task skills
  async getTaskSkills(taskId) {
    try {
      const response = await httpClient.get(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/skills`);
      return response.data;
    } catch (error) {
      console.error('Error fetching task skills:', error);
      throw error;
    }
  }

  async addTaskSkill(taskId, skillData) {
    try {
      const response = await httpClient.post(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/skills`, skillData);
      return response.data;
    } catch (error) {
      console.error('Error adding task skill:', error);
      throw error;
    }
  }

  async removeTaskSkill(taskId, skillId) {
    try {
      await httpClient.delete(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/skills/${skillId}`);
      return { success: true };
    } catch (error) {
      console.error('Error removing task skill:', error);
      throw error;
    }
  }

  // Task submissions
  async submitTask(taskId, submissionData) {
    try {
      const response = await httpClient.post(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/submit`, submissionData);
      return response.data;
    } catch (error) {
      console.error('Error submitting task:', error);
      throw error;
    }
  }

  async getTaskSubmissions(taskId) {
    try {
      const response = await httpClient.get(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/submissions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching task submissions:', error);
      throw error;
    }
  }

  // Utility methods for TeamLead functionality
  async getTasksByTeamMember(userId) {
    try {
      return await this.getAllTasks({ assigneeId: userId });
    } catch (error) {
      console.error('Error fetching tasks by team member:', error);
      throw error;
    }
  }

  async getTasksByProject(projectId) {
    try {
      return await this.getAllTasks({ projectId });
    } catch (error) {
      console.error('Error fetching tasks by project:', error);
      throw error;
    }
  }

  async getTasksByStatus(status) {
    try {
      return await this.getAllTasks({ status });
    } catch (error) {
      console.error('Error fetching tasks by status:', error);
      throw error;
    }
  }

  // Team lead specific methods
  async assignTaskToTeamMember(taskId, userId) {
    try {
      return await this.assignTask(taskId, userId);
    } catch (error) {
      console.error('Error assigning task to team member:', error);
      throw error;
    }
  }

  async updateTaskPriority(taskId, priority) {
    try {
      const response = await httpClient.put(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}`, {
        priority: priority
      });
      return response.data;
    } catch (error) {
      console.error('Error updating task priority:', error);
      throw error;
    }
  }

  async reviewTaskSubmission(taskId, submissionId, reviewData) {
    try {
      const response = await httpClient.put(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/submissions/${submissionId}/review`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error reviewing task submission:', error);
      throw error;
    }
  }

  // Analytics methods for team lead dashboard
  async getTeamTaskStats(teamMemberIds = []) {
    try {
      const allTasks = await this.getAllTasks();
      const teamTasks = allTasks.result?.filter(task => 
        teamMemberIds.length === 0 || teamMemberIds.includes(task.assignedTo)
      ) || [];

      const stats = {
        total: teamTasks.length,
        todo: teamTasks.filter(task => task.status === 'TODO').length,
        inProgress: teamTasks.filter(task => task.status === 'IN_PROGRESS').length,
        review: teamTasks.filter(task => task.status === 'REVIEW').length,
        done: teamTasks.filter(task => task.status === 'DONE').length,
        cancelled: teamTasks.filter(task => task.status === 'CANCELLED').length,
        overdue: teamTasks.filter(task => 
          task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
        ).length,
        highPriority: teamTasks.filter(task => 
          task.priority === 'HIGH' || task.priority === 'URGENT'
        ).length
      };

      return { result: stats };
    } catch (error) {
      console.error('Error calculating team task stats:', error);
      throw error;
    }
  }

  async getProjectTaskBreakdown(projectId) {
    try {
      const response = await this.getTasksByProject(projectId);
      const tasks = response.result || [];

      const breakdown = {
        total: tasks.length,
        byStatus: tasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {}),
        byPriority: tasks.reduce((acc, task) => {
          acc[task.priority] = (acc[task.priority] || 0) + 1;
          return acc;
        }, {}),
        byAssignee: tasks.reduce((acc, task) => {
          if (task.assignedTo) {
            acc[task.assignedTo] = (acc[task.assignedTo] || 0) + 1;
          }
          return acc;
        }, {}),
        overallProgress: tasks.length > 0 
          ? tasks.reduce((sum, task) => sum + (task.progressPercentage || 0), 0) / tasks.length
          : 0
      };

      return { result: breakdown };
    } catch (error) {
      console.error('Error getting project task breakdown:', error);
      throw error;
    }
  }
}

const taskService = new TaskService();
export default taskService;