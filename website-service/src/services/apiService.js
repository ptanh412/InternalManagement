import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8888/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 100000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a separate axios instance for AI operations with longer timeout
const aiApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for AI operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token for main API
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Request interceptor to add auth token for AI API
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // console.log('🔐 Interceptor - Token:', token ? 'Present' : 'Missing');
    // console.log('🔐 Interceptor - URL:', config.url);
    
    if (token) {
      // ✅ QUAN TRỌNG: Set Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No token found in localStorage!');
    }
    
    // Đừng override Content-Type nếu đã được set
    if (config.headers['Content-Type'] === 'multipart/form-data') {
      delete config.headers['Content-Type']; // Let browser set boundary
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for AI API
aiApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Authentication - Updated to match backend endpoints
  login: (credentials) => api.post('/identity/auth/token', credentials),
  refreshToken: (refreshToken) => api.post('/identity/auth/refresh', { token: refreshToken }),
  logout: (token) => api.post('/identity/auth/logout', { token }),
  introspect: (token) => api.post('/identity/auth/introspect', { token }),
  
  // User Registration
  register: (userData) => api.post('/identity/users', userData),

  // User management
  getProfile: () => api.get('/identity/users/my-info'),
  getUser: (userId) => api.get(`/identity/users/${userId}`),
  getAllUsers: () => api.get('/identity/users'),
  updateProfile: (id, data) => api.put(`/identity/users/${id}`, data),
  changePassword: (data) => api.put('/identity/users/change-password', data),

  // Profile management

  getMyProfile: () => api.get('/profile/users/my-profile'),
  
  updateMyProfile: (data) => api.put('/profile/users/my-profile', data),
  
  updateAvatar: (formData) => api.put('/profile/users/avatar', formData),
  
  getUserProfile: (userId) => api.get(`/profile/api/profiles/${userId}`),
  
  // User Skills Methods
  getAllSkills: () => api.get('/profile/skills'),
  
  getSkillById: (skillId) => api.get(`/profile/skills/${skillId}`),
  
  createSkill: (skillData) => api.post('/profile/skills', skillData),
  
  updateSkill: (skillId, skillData) => api.put(`/profile/skills/${skillId}`, skillData),
  
  deleteSkill: (skillId) => api.delete(`/profile/skills/${skillId}`),
  
  searchSkills: (skillName) => api.get(`/profile/skills/search?skillName=${skillName}`),
  
  getSkillsByType: (skillType) => api.get(`/profile/skills/type/${skillType}`),
  
  getSkillsByProficiency: (proficiencyLevel) => api.get(`/profile/skills/proficiency/${proficiencyLevel}`),
  
  // AI Assignment System Methods
  getCandidatesBySkills: (skills) => api.get('/profile/api/profiles/skills', {
    params: { skills }
  }),
  
  getAvailableCandidates: () => api.get('/profile/api/profiles/available'),
  
  getCandidatesByDepartment: (department) => api.get(`/profile/api/profiles/department/${department}`),
  
  getCandidatesByWorkload: (maxWorkload) => api.get('/profile/api/profiles/workload', {
    params: { maxWorkload }
  }),
  
  getCandidatesByPerformance: (minRating) => api.get('/profile/api/profiles/performance', {
    params: { minRating }
  }),
  
  // Search Users
  searchUsers: (searchRequest) => api.post('/profile/users/search', searchRequest),
  
  // Get users with specific roles for project management
  getProjectManagers: () => api.get('/identity/users/role/PROJECT_MANAGER'),
  getTeamLeads: () => api.get('/identity/users/role/TEAM_LEAD'),
  getUsersByRole: (roleName) => api.get(`/identity/users/role/${roleName}`),

  // Projects - Updated with all project-service endpoints
  getProjects: (params) => api.get('/project/projects', { params }),
  getProjectsForUser: (userId, userRole) => api.get('/project/projects', { params: { userId, userRole } }),
  getProject: (id) => api.get(`/project/projects/${id}`),
  createProject: (data) => api.post('/project/projects', data),
  updateProject: (id, data) => api.put(`/project/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/project/projects/${id}`),
  updateProjectStatus: (id, status) => api.patch(`/project/projects/${id}/status?status=${status}`),
  getProjectProgress: (id) => api.get(`/project/projects/${id}/progress`),
  calculateProjectProgress: (id) => api.put(`/project/projects/${id}/progress/calculate`),
  getProjectsByStatus: (status) => api.get(`/project/projects/status/${status}`),
  getProjectsByLeader: (leaderId) => api.get(`/project/projects/leader/${leaderId}`),
  getProjectsByTeamLead: (teamLeadId) => api.get(`/project/projects/team-lead/${teamLeadId}`),
  getProjectsByDateRange: (startDate, endDate) => api.get(`/project/projects/date-range?startDate=${startDate}&endDate=${endDate}`),
  searchProjects: (keyword) => api.get(`/project/projects/search?keyword=${keyword}`),
  getProjectAnalytics: () => api.get('/project/projects/analytics'),
  getProjectSummaries: () => api.get('/project/projects/summaries'),
  incrementTotalTasks: (projectId) => api.put(`/project/projects/${projectId}/tasks/increment`),
  updateProjectSkills: (projectId, skills) => api.put(`/project/projects/${projectId}/skills`, { skillsToAdd: skills }),

  // Project Members
  getProjectMembers: (projectId) => api.get(`/project/project-members/projects/${projectId}`),
  getUserProjects: (userId) => api.get(`/project/project-members/users/${userId}`),
  addProjectMember: (data) => api.post('/project/project-members', data),
  removeProjectMember: (projectId, userId) => api.delete(`/project/project-members/projects/${projectId}/users/${userId}`),
  updateProjectMemberRole: (projectId, userId, data) => api.put(`/project/project-members/projects/${projectId}/users/${userId}`, data),
  getProjectMembersByRole: (projectId, role) => api.get(`/project/project-members/projects/${projectId}/roles/${role}`),
  getProjectMember: (projectId, userId) => api.get(`/project/project-members/projects/${projectId}/users/${userId}`),
  // Get project member count
  getProjectMemberCount: (projectId) => api.get(`/project/project-members/projects/${projectId}/count`),

  // Tasks - Updated with all task-service endpoints
  getTasks: (params) => api.get('/task/tasks', { params }),
  getTasksByProject: (projectId) => api.get('/task/tasks', { params: { projectId } }),
  getTask: (id) => api.get(`/task/tasks/${id}`),
  createTask: (data) => api.post('/task/tasks', data),
  updateTask: (id, data) => api.put(`/task/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/task/tasks/${id}`),
  updateTaskStatus: (id, data) => api.put(`/task/tasks/${id}/status`, data),
  assignTask: (taskId, userId) => api.put(`/task/tasks/${taskId}/assign/${userId}`),
  updateTaskProgress: (id, data) => api.put(`/task/tasks/${id}/progress`, data),
  getTasksByTeamLead: (teamLeadId) => api.get(`/task/tasks/team-lead/${teamLeadId}`),
  getTasksAssignedToUser: (userId) => api.get(`/task/tasks/assigned/${userId}`),
  getMyTasks: () => api.get('/task/tasks/my-tasks'),

    // Time Tracking APIs
  getTimerStatus: (taskId) => api.get(`/task/tasks/${taskId}/timer/status`),
  startTimer: (taskId) => api.post(`/task/tasks/${taskId}/timer/start`),
  stopTimer: (taskId, data) => api.post(`/task/tasks/${taskId}/timer/stop`, data),
  getTimeLogs: (taskId) => api.get(`/task/tasks/${taskId}/timer/logs`),
  updateTimeLog: (taskId, logId, data) => api.put(`/task/tasks/${taskId}/timer/logs/${logId}`, data),
  deleteTimeLog: (taskId, logId) => api.delete(`/task/tasks/${taskId}/timer/logs/${logId}`),

  // Task Dependencies
  getTaskDependencies: (taskId) => api.get(`/task/tasks/${taskId}/dependencies`),
  addTaskDependency: (taskId, data) => api.post(`/task/tasks/${taskId}/dependencies`, data),
  removeTaskDependency: (taskId, dependencyId) => api.delete(`/task/tasks/${taskId}/dependencies/${dependencyId}`),

  // Task Skills
  getTaskSkills: (taskId) => api.get(`/task/tasks/${taskId}/skills`),
  addTaskSkill: (taskId, data) => api.post(`/task/tasks/${taskId}/skills`, data),
  removeTaskSkill: (taskId, skillId) => api.delete(`/task/tasks/${taskId}/skills/${skillId}`),

  // Task Submissions
  submitTask: (taskId, data) => api.post(`/task/tasks/${taskId}/submissions`, data),
  getTaskSubmissions: (taskId) => api.get(`/task/tasks/${taskId}/submissions`),
  getMySubmissions: () => api.get('/task/my-submissions'),

  reviewSubmission: (taskId, submissionId, status, comments) => 
    api.put(`/task/tasks/${taskId}/submissions/${submissionId}/review`, null, { 
      params: { status, comments } 
  }),
  getPendingSubmissions: () => api.get('/task/submissions/pending'),
  getMyReviews: () => api.get('/task/submissions/my-reviews'),

  editReview: (taskId, submissionId, status, comments) => 
    api.patch(`/task/tasks/${taskId}/submissions/${submissionId}/review`, null, {
    params: {
      status,
      comments
    }
  }),
  // NEW: Edit submission (for employees to update their submission)
  editSubmission: (taskId, submissionId, updateRequest) => 
    api.patch(`/task/tasks/${taskId}/submissions/${submissionId}`, updateRequest),

  // AI Task Recommendations
  analyzeTextForTasks: (data) => api.post('/ai/requirements/import/text', data),
  analyzeFileForTasks: (formData) => api.post('/ai/requirements/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getSupportedFileFormats: () => api.get('/ai/tasks/supported-formats'),

  // AI Employee Recommendations
  getTaskRecommendations: (taskId) => api.post(`/ai/recommendations/task/${taskId}`),
  getEmergencyRecommendations: (taskId) => api.post(`/ai/recommendations/task/${taskId}/emergency`),
  getTeamRecommendations: (taskId, teamId) => api.post(`/ai/recommendations/task/${taskId}/team/${teamId}`),

  // Notifications
  getNotifications: () => api.get('/notifications'),
  markNotificationRead: (id) => api.put(`/notifications/${id}/read`),

  // Performance Management
  getPerformanceScore: (userId) => api.get(`/identity/performance/score/${userId}`),
  getPerformanceDetails: (userId) => api.get(`/identity/performance/details/${userId}`),
  recalculatePerformanceScore: (userId) => api.post(`/identity/performance/recalculate/${userId}`),
  recalculateAllPerformanceScores: () => api.post('/identity/performance/recalculate-all'),

  // File uploads
  uploadFile: (formData) => api.post('/file/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),

  dowloadFile: (fileId) => {
  // Tạo một axios instance mới không có interceptor
  const axiosInstance = axios.create({
    baseURL: api.defaults.baseURL,
    headers: api.defaults.headers
  });
  
  return axiosInstance.get(`/file/media/download/${fileId}`, {
      responseType: 'blob'
    });
  },

  // Dashboard stats
  getDashboardStats: () => api.get('/dashboard/stats'),

  // Chat API methods
  chat: {
    // Conversations
    getConversations: () => api.get('/chat/conversations/my-conversations'),
    createConversation: (data) => api.post('/chat/conversations/create', data),
    createProjectGroup: (data) => api.post('/chat/conversations/project-group', data),
    addMembersToGroup: (conversationId, data) => api.post(`/chat/conversations/${conversationId}/add-members`, data),
    removeMembersFromGroup: (conversationId, data) => api.post(`/chat/conversations/${conversationId}/remove-members`, data),
    leaveGroup: (conversationId) => api.post(`/chat/conversations/${conversationId}/leave`),

    // Messages
    getMessages: (conversationId) => api.get(`/chat/messages?conversationId=${conversationId}`),
    sendMessage: (data) => api.post('/chat/messages/create', data),
    markAsRead: (conversationId) => api.put(`/chat/messages/mark-as-read?conversationId=${conversationId}`),

    // File upload
    uploadFile: (formData) => api.post('/file/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

    // Message reactions (if supported)
    addReaction: (messageId, emoji) => api.post(`/chat-service/messages/${messageId}/react`, { emoji }),
    removeReaction: (messageId, emoji) => api.delete(`/chat-service/messages/${messageId}/react`, { data: { emoji } }),

    // Message operations
    pinMessage: (messageId) => api.post(`/chat-service/messages/${messageId}/pin`),
    unpinMessage: (messageId) => api.delete(`/chat-service/messages/${messageId}/pin`),
    recallMessage: (messageId, type) => api.post(`/chat-service/messages/${messageId}/recall`, { type })
  },

  // Admin API methods
  admin: {
  // User Management
  getAllUsers: () => api.get('/identity/users'),
  getUserById: (userId) => api.get(`/identity/users/${userId}`),
  createUser: (data) => api.post('/identity/users', data),
  updateUser: (userId, data) => api.put(`/identity/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/identity/users/${userId}`),
  updateUserStatus: (userId, data) => api.post(`/identity/users/${userId}/status`, data),
  getUsersByDepartment: (departmentId) => api.get(`/identity/users/department/${departmentId}`),
  getUsersByRole: (roleName) => api.get(`/identity/users/role/${roleName}`),
  getActiveUsers: () => api.get('/identity/users/active'),
  getInactiveUsers: () => api.get('/identity/users/inactive'),
  getMyInfo: () => api.get('/identity/users/my-info'),

  // Role Management
  getAllRoles: () => api.get('/identity/roles'),
  getRoleById: (roleId) => api.get(`/identity/roles/${roleId}`),
  createRole: (data) => api.post('/identity/roles', data),
  updateRole: (roleId, data) => api.put(`/identity/roles/${roleId}`, data),
  deleteRole: (roleName) => api.delete(`/identity/roles/${roleName}`),

  // Department Management
  getAllDepartments: () => api.get('/identity/departments'),
  getDepartmentById: (departmentId) => api.get(`/identity/departments/${departmentId}`),
  createDepartment: (data) => api.post('/identity/departments', data),
  updateDepartment: (departmentId, data) => api.put(`/identity/departments/${departmentId}`, data),
  deleteDepartment: (departmentId) => api.delete(`/identity/departments/${departmentId}`),

  //Position Management
  getAllPositions: () => api.get('/identity/business-management/positions'), 

  // CV Analysis
  analyzeCV: (formData) => {
      const token = localStorage.getItem('token');
      console.log('📤 Sending CV analysis request with token:', token ? 'Present' : 'Missing');
      
      return api.post('/ai/cv/analyze', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          // Token sẽ được tự động add bởi interceptor, nhưng có thể force:
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
    },
  batchAnalyzeCV: (formData) => api.post('/ai/cv/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  createProfileFromCV: (data) => api.post('/ai/cv/create-profile', data),
  getCVAnalysisHistory: (params) => api.get('/ai/cv/history', { params }),
  getCVAnalysisStats: () => api.get('/ai/cv/history/stats'),
  // File uploads
  uploadFile: (formData) => api.post('/file/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Performance Analytics APIs
  performance: {
    // Individual performance reports
    getUserReport: (userId) => api.get(`/performance/reports/${userId}`),
    getMyPerformance: () => api.get('/performance/reports/my-performance'),
    getBatchReports: (userIds) => api.post('/performance/reports/batch', { userIds }),
    getDepartmentReports: (departmentId) => api.get(`/performance/reports/department/${departmentId}`),
  },

  // Work Time Statistics APIs
  workTime: {
    // Individual work time statistics
    getUserStats: (userId) => api.get(`/work-time/statistics/${userId}`),
    getMyTimeStats: () => api.get('/work-time/statistics/my-time'),
    getBatchStats: (userIds) => api.post('/work-time/statistics/batch', { userIds }),
    getDepartmentStats: (departmentId) => api.get(`/work-time/statistics/department/${departmentId}`),
    getTeamProductivity: (teamId) => api.get(`/work-time/productivity/team/${teamId}`),
  },

  // Project Progress APIs
  projectProgress: {
    // Project progress tracking
    getProjectProgress: (projectId) => api.get(`/projects/progress/${projectId}`),
    getProgressOverview: () => api.get('/projects/progress/overview'),
    getProjectTimeline: (projectId) => api.get(`/projects/progress/${projectId}/timeline`),
    getProjectDependencies: (projectId) => api.get(`/projects/progress/${projectId}/dependencies`),
    getProgressDashboard: () => api.get('/projects/progress/dashboard'),
    getUserParticipation: (userId) => api.get(`/projects/progress/participation/${userId}`),
  },

  // Resource Planning APIs
  resources: {
    // Resource planning and optimization
    getProjectResourcePlanning: (projectId) => api.get(`/projects/resources/planning/${projectId}`),
    getResourcePlanningOverview: () => api.get('/projects/resources/planning/overview'),
    getAllocationSummary: () => api.get('/projects/resources/allocation/summary'),
    getSkillsGapAnalysis: () => api.get('/projects/resources/skills/gap-analysis'),
    getUtilizationMetrics: () => api.get('/projects/resources/utilization/metrics'),
    getBudgetOptimization: (projectId) => api.get(`/projects/resources/budget/optimization/${projectId}`),
    getCapacityForecast: () => api.get('/projects/resources/capacity/forecast'),
  },

  // Generic API methods
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config),
  }
}

export default api;