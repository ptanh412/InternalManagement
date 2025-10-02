import httpClient from '../configurations/httpClient';

const TASK_SERVICE_BASE_URL = 'http://localhost:8888/api/v1/task';

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

  // ===== EMPLOYEE SPECIFIC METHODS =====

  // Get current user's assigned tasks
  async getMyTasks() {
    try {
      const response = await httpClient.get(`${TASK_SERVICE_BASE_URL}/internal/tasks/user/current`);
      return response.data;
    } catch (error) {
      console.error('Error fetching my tasks:', error);
      throw error;
    }
  }

  // Get tasks created by current user  
  async getMyCreatedTasks() {
    try {
      const response = await httpClient.get(`${TASK_SERVICE_BASE_URL}/internal/tasks/history/current`);
      return response.data;
    } catch (error) {
      console.error('Error fetching my created tasks:', error);
      throw error;
    }
  }

  // Get tasks by specific user (for internal use)
  async getTasksByUser(userId, limit = 10) {
    try {
      const response = await httpClient.get(`${TASK_SERVICE_BASE_URL}/internal/tasks/user/${userId}?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks by user:', error);
      throw error;
    }
  }

  // Get task history for a user
  async getTaskHistory(userId, limit = 20) {
    try {
      const response = await httpClient.get(`${TASK_SERVICE_BASE_URL}/internal/tasks/history/${userId}?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching task history:', error);
      throw error;
    }
  }

  // Employee Task Workflow Methods
  
  // Start working on a task (change status to IN_PROGRESS)
  async startTask(taskId) {
    try {
      const response = await httpClient.put(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/status`, {
        status: 'IN_PROGRESS'
      });
      return response.data;
    } catch (error) {
      console.error('Error starting task:', error);
      throw error;
    }
  }

  // Mark task as ready for review
  async markTaskForReview(taskId) {
    try {
      const response = await httpClient.put(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/status`, {
        status: 'REVIEW'
      });
      return response.data;
    } catch (error) {
      console.error('Error marking task for review:', error);
      throw error;
    }
  }

  // Complete a task (change status to DONE)
  async completeTask(taskId) {
    try {
      const response = await httpClient.put(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/status`, {
        status: 'DONE'
      });
      return response.data;
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }

  // Submit completed work for a task
  async submitTask(taskId, submissionData) {
    try {
      const response = await httpClient.post(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/submit`, submissionData);
      return response.data;
    } catch (error) {
      console.error('Error submitting task:', error);
      throw error;
    }
  }

  // Get submissions for a task
  async getTaskSubmissions(taskId) {
    try {
      const response = await httpClient.get(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/submissions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching task submissions:', error);
      throw error;
    }
  }

  // Update task progress (for employees working on tasks)
  async updateTaskProgress(taskId, progressData) {
    try {
      const response = await httpClient.put(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/progress`, progressData);
      return response.data;
    } catch (error) {
      console.error('Error updating task progress:', error);
      throw error;
    }
  }

  // Get task dependencies (useful for employees to understand task flow)
  async getTaskDependencies(taskId) {
    try {
      const response = await httpClient.get(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/dependencies`);
      return response.data;
    } catch (error) {
      console.error('Error fetching task dependencies:', error);
      throw error;
    }
  }

  // Get required skills for a task (helps employees understand requirements)
  async getTaskSkills(taskId) {
    try {
      const response = await httpClient.get(`${TASK_SERVICE_BASE_URL}/tasks/${taskId}/skills`);
      return response.data;
    } catch (error) {
      console.error('Error fetching task skills:', error);
      throw error;
    }
  }

  // Employee Dashboard Analytics
  async getMyTaskStats() {
    try {
      const myTasks = await this.getMyTasks();
      
      const stats = {
        total: myTasks.length,
        todo: myTasks.filter(task => task.status === 'TODO').length,
        inProgress: myTasks.filter(task => task.status === 'IN_PROGRESS').length,
        review: myTasks.filter(task => task.status === 'REVIEW').length,
        done: myTasks.filter(task => task.status === 'DONE').length,
        overdue: myTasks.filter(task => {
          if (!task.dueDate) return false;
          return new Date(task.dueDate) < new Date() && task.status !== 'DONE';
        }).length,
        highPriority: myTasks.filter(task => task.priority === 'HIGH' || task.priority === 'URGENT').length
      };

      return stats;
    } catch (error) {
      console.error('Error fetching my task stats:', error);
      throw error;
    }
  }

  // Get tasks assigned to me by priority
  async getMyTasksByPriority() {
    try {
      const myTasks = await this.getMyTasks();
      
      return {
        urgent: myTasks.filter(task => task.priority === 'URGENT'),
        high: myTasks.filter(task => task.priority === 'HIGH'),
        medium: myTasks.filter(task => task.priority === 'MEDIUM'),
        low: myTasks.filter(task => task.priority === 'LOW')
      };
    } catch (error) {
      console.error('Error fetching my tasks by priority:', error);
      throw error;
    }
  }

  // Get my overdue tasks
  async getMyOverdueTasks() {
    try {
      const myTasks = await this.getMyTasks();
      
      return myTasks.filter(task => {
        if (!task.dueDate) return false;
        return new Date(task.dueDate) < new Date() && task.status !== 'DONE';
      });
    } catch (error) {
      console.error('Error fetching my overdue tasks:', error);
      throw error;
    }
  }

  // Get my upcoming tasks (due in next 7 days)
  async getMyUpcomingTasks() {
    try {
      const myTasks = await this.getMyTasks();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      return myTasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= new Date() && dueDate <= nextWeek && task.status !== 'DONE';
      });
    } catch (error) {
      console.error('Error fetching my upcoming tasks:', error);
      throw error;
    }
  }
}

const taskService = new TaskService();
export default taskService;