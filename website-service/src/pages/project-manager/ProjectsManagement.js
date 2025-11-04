import React, { useState, useEffect } from 'react';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  FunnelIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CheckCircleIcon,
  Bars3BottomLeftIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';
import { useApiNotifications } from '../../hooks/useApiNotifications';

const ProjectsManagement = () => {
  const { user } = useAuth();
  const notify = useApiNotifications();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [users, setUsers] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectLeaderId: '',
    teamLeadId: '',
    status: 'PLANNING',
    priority: 'MEDIUM',
    budget: '',
    startDate: '',
    endDate: ''
  });

  // Project statuses
  const PROJECT_STATUSES = ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];

  // User option component with enhanced display
  const UserOption = ({ user, isSelected }) => {
    const getRoleBadgeColor = (roleName) => {
      switch (roleName) {
        case 'PROJECT_MANAGER': return 'bg-blue-100 text-blue-800';
        case 'TEAM_LEAD': return 'bg-green-100 text-green-800';
        case 'ADMIN': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer rounded-md ${isSelected ? 'bg-blue-50 border border-blue-200' : ''}`}>
        <div className="flex-shrink-0 mr-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-white">
              {user.firstName?.[0] || '?'}{user.lastName?.[0] || ''}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900 truncate">
              {user.firstName} {user.lastName}
            </span>
            {user.roleName && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.roleName)}`}>
                {user.roleName.replace('_', ' ')}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 truncate mt-1">
            <span>{user.email}</span>
            {user.departmentName && (
              <>
                <span className="mx-1">•</span>
                <span className="font-medium">{user.departmentName}</span>
              </>
            )}
            {user.positionTitle && (
              <>
                <span className="mx-1">•</span>
                <span>{user.positionTitle}</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (user) {
      loadProjects();
      loadAnalytics();
    }
  }, [user]);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter]);

  useEffect(() => {
    if (showCreateModal) {
      loadUsers();
    }
  }, [showCreateModal]);

  const loadProjects = async () => {
    console.log("Call api load Projects");
    try {
      setLoading(true);
      
      // Call actual API with role-based filtering
      const params = {
        userId: user?.id,
        userRole: user?.role
      };
      
      console.log("API params:", params);
      const response = await apiService.getProjects(params);
      console.log("API response:", response);
      
      // Enrich projects with additional data
      const enrichedProjects = await enrichProjectsWithUserData(response.result || []);
      setProjects(enrichedProjects);
      setLoading(false);
      
    } catch (error) {
      console.warn('API failed, using mock data:', error);
      notify.load.warning('Unable to connect to server. Showing sample data.');
      
      // Fallback to mock data if API fails
      const mockProjects = [
        {
          id: 'proj-1',
          name: 'Mobile Banking App',
          description: 'Complete mobile banking solution with AI-powered features',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          progress: 75,
          startDate: '2024-09-01',
          endDate: '2024-12-15',
          budget: 150000,
          spentBudget: 112500,
          teamLeadId: 'tl-1',
          teamLeadName: 'John Smith',
          memberCount: 8,
          totalTasks: 45,
          completedTasks: 34,
          skills: ['React Native', 'Node.js', 'AI/ML', 'Security'],
          client: 'First National Bank'
        },
        {
          id: 'proj-2',
          name: 'E-commerce Platform',
          description: 'Multi-vendor e-commerce platform with advanced analytics',
          status: 'PLANNING',
          priority: 'MEDIUM',
          progress: 15,
          startDate: '2024-10-15',
          endDate: '2025-03-30',
          budget: 200000,
          spentBudget: 15000,
          teamLeadId: 'tl-2',
          teamLeadName: 'Sarah Johnson',
          memberCount: 12,
          totalTasks: 67,
          completedTasks: 8,
          skills: ['React', 'Django', 'PostgreSQL', 'AWS'],
          client: 'RetailCorp Inc.'
        },
        {
          id: 'proj-3',
          name: 'IoT Monitoring System',
          description: 'Real-time IoT device monitoring and management system',
          status: 'COMPLETED',
          priority: 'HIGH',
          progress: 100,
          startDate: '2024-06-01',
          endDate: '2024-09-30',
          budget: 80000,
          spentBudget: 76000,
          teamLeadId: 'tl-3',
          teamLeadName: 'Mike Chen',
          memberCount: 6,
          totalTasks: 32,
          completedTasks: 32,
          skills: ['Python', 'MongoDB', 'Docker', 'IoT'],
          client: 'Industrial Solutions Ltd.'
        },
        {
          id: 'proj-4',
          name: 'Healthcare Management System',
          description: 'Comprehensive healthcare management and patient tracking system',
          status: 'ON_HOLD',
          priority: 'CRITICAL',
          progress: 45,
          startDate: '2024-08-01',
          endDate: '2025-01-15',
          budget: 300000,
          spentBudget: 135000,
          teamLeadId: 'tl-4',
          teamLeadName: 'Dr. Emily Davis',
          memberCount: 15,
          totalTasks: 89,
          completedTasks: 40,
          skills: ['Angular', 'Spring Boot', 'MySQL', 'HIPAA Compliance'],
          client: 'MedCare Systems'
        }
      ];

      setProjects(mockProjects);
      setLoading(false);
    } finally {
      // Ensure loading is always set to false
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await apiService.getProjectAnalytics();
      setAnalytics(response.result);
    } catch (error) {
      console.warn('Analytics API failed, using mock data:', error);
      // Fallback to mock data
      setAnalytics({
        totalProjects: 12,
        activeProjects: 8,
        completedProjects: 3,
        onHoldProjects: 1,
        totalBudget: 850000,
        spentBudget: 625000,
        averageProgress: 68,
        totalTeamMembers: 45,
        overdueTasks: 12,
        completionRate: 78
      });
    }
  };

  // Function to enrich projects with user names and member counts
  const enrichProjectsWithUserData = async (projects) => {
    try {
      const enrichedProjects = await Promise.all(
        projects.map(async (project) => {
          const enrichedProject = { ...project };
          
          // Get team lead name if teamLeadId exists
          if (project.teamLeadId) {
            try {
              const teamLeadResponse = await apiService.getUser(project.teamLeadId);
              if (teamLeadResponse.result) {
                enrichedProject.teamLeadName = `${teamLeadResponse.result.firstName} ${teamLeadResponse.result.lastName}`;
              }
            } catch (error) {
              console.warn(`Failed to fetch team lead for project ${project.id}:`, error);
              enrichedProject.teamLeadName = 'Unknown';
            }
          }
          
          // Get project leader name if projectLeaderId exists
          if (project.projectLeaderId) {
            try {
              const projectLeaderResponse = await apiService.getUser(project.projectLeaderId);
              if (projectLeaderResponse.result) {
                enrichedProject.projectLeaderName = `${projectLeaderResponse.result.firstName} ${projectLeaderResponse.result.lastName}`;
              }
            } catch (error) {
              console.warn(`Failed to fetch project leader for project ${project.id}:`, error);
              enrichedProject.projectLeaderName = 'Unknown';
            }
          }
          
          // Get member count and check if leaders are already members
          try {
            const [memberCountResponse, membersResponse] = await Promise.all([
              apiService.getProjectMemberCount(project.id),
              apiService.getProjectMembers(project.id).catch(() => ({ result: [] }))
            ]);
            
            const actualMembers = memberCountResponse.result || 0;
            const membersList = membersResponse.result || [];
            const memberUserIds = new Set(membersList.map(m => m.userId));
            
            // Count unique leaders who are NOT already members
            const uniqueLeaders = [project.teamLeadId, project.projectLeaderId]
              .filter(id => id && id.trim() !== '') // Remove null/undefined/empty
              .filter((id, index, arr) => arr.indexOf(id) === index) // Remove duplicates
              .filter(id => !memberUserIds.has(id)); // Remove leaders who are already members
            
            const leadersCount = uniqueLeaders.length;
            
            // Store counts for display
            enrichedProject.memberCount = actualMembers;
            enrichedProject.leadersCount = leadersCount;
            enrichedProject.totalPeople = actualMembers + leadersCount;
          } catch (error) {
            console.warn(`Failed to fetch member count for project ${project.id}:`, error);
            // Fallback: count unique leaders
            const uniqueLeaders = [project.teamLeadId, project.projectLeaderId]
              .filter(id => id && id.trim() !== '')
              .filter((id, index, arr) => arr.indexOf(id) === index);
            
            enrichedProject.memberCount = 0;
            enrichedProject.leadersCount = uniqueLeaders.length;
            enrichedProject.totalPeople = uniqueLeaders.length;
          }
          
          return enrichedProject;
        })
      );
      
      return enrichedProjects;
    } catch (error) {
      console.error('Error enriching projects:', error);
      return projects;
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.client && project.client.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    setFilteredProjects(filtered);
  };

  const getStatusColor = (status) => {
    const colors = {
      PLANNING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      ON_HOLD: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: 'text-green-600 bg-green-100',
      MEDIUM: 'text-yellow-600 bg-yellow-100',
      HIGH: 'text-orange-600 bg-orange-100',
      CRITICAL: 'text-red-600 bg-red-100'
    };
    return colors[priority] || 'text-gray-600 bg-gray-100';
  };

  const calculateBudgetUsage = (spent, total) => {
    if (!total || total === 0) return 0;
    const spentAmount = spent || 0;
    return Math.round((spentAmount / total) * 100);
  };

  const loadUsers = async () => {
    try {
      // Load all users for fallback
      const [allUsersResponse, projectManagersResponse, teamLeadsResponse] = await Promise.all([
        apiService.getAllUsers().catch(() => ({ result: [] })),
        apiService.getProjectManagers().catch(() => ({ result: [] })),
        apiService.getTeamLeads().catch(() => ({ result: [] }))
      ]);

      setUsers(allUsersResponse.result || []);
      setProjectManagers(projectManagersResponse.result || []);
      setTeamLeads(teamLeadsResponse.result || []);

      console.log('Loaded users:', {
        all: allUsersResponse.result?.length || 0,
        projectManagers: projectManagersResponse.result?.length || 0,
        teamLeads: teamLeadsResponse.result?.length || 0
      });
    } catch (error) {
      console.error('Failed to load users:', error);
      notify.load.error('user information');
    }
  };

  const handleCreateProject = () => {
    setFormData({
      name: '',
      description: '',
      projectLeaderId: user?.id || '',
      teamLeadId: '',
      status: 'PLANNING',
      priority: 'MEDIUM',
      budget: '',
      startDate: '',
      endDate: ''
    });
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setFormData({
      name: '',
      description: '',
      projectLeaderId: '',
      teamLeadId: '',
      status: 'PLANNING',
      priority: 'MEDIUM',
      budget: '',
      startDate: '',
      endDate: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      // Prepare data for API
      const projectData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      };

      console.log('Creating project:', projectData);
      
      const response = await apiService.createProject(projectData);
      console.log('Project created successfully:', response);

      // Reload projects
      await loadProjects();

      // Close modal and reset form
      handleCloseCreateModal();

      // Show success notification
      notify.create.success('Project');
    } catch (error) {
      console.error('Failed to create project:', error);
      notify.create.error('Project');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
  };

  const handleEditProject = async (project) => {
    console.log('Editing project:', project);
    console.log('Current users loaded:', {
      allUsers: users.length,
      projectManagers: projectManagers.length,
      teamLeads: teamLeads.length
    });
    
    // Ensure users are loaded first
    if (users.length === 0 || projectManagers.length === 0 || teamLeads.length === 0) {
      console.log('Loading users for edit modal...');
      await loadUsers();
    }
    
    const editData = {
      ...project,
      budget: project.budget || '',
      startDate: project.startDate ? new Date(project.startDate).toISOString().slice(0, 16) : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().slice(0, 16) : '',
      // Ensure we have the correct IDs for the form
      projectLeaderId: project.projectLeaderId || '',
      teamLeadId: project.teamLeadId || ''
    };
    
    console.log('Edit form data:', editData);
    setEditFormData(editData);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditFormData(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitEditProject = async (e) => {
    e.preventDefault();
    if (!editFormData) return;
    try {
      const updateData = {
        ...editFormData,
        budget: editFormData.budget ? parseFloat(editFormData.budget) : null,
        startDate: editFormData.startDate ? new Date(editFormData.startDate).toISOString() : null,
        endDate: editFormData.endDate ? new Date(editFormData.endDate).toISOString() : null,
      };
      await apiService.updateProject(editFormData.id, updateData);
      await loadProjects();
      handleCloseEditModal();
      notify.update.success('Project');
    } catch (error) {
      console.error('Failed to update project:', error);
      notify.update.error('Project');
    }
  };

  const handleDeleteProject = async (project) => {
    if (window.confirm(`Are you sure you want to delete project "${project.name}"?\n\nThis action cannot be undone.`)) {
      try {
        await apiService.deleteProject(project.id);
        await loadProjects();
        notify.delete.success('Project');
      } catch (error) {
        console.error('Failed to delete project:', error);
        notify.delete.error('Project');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
              <p className="text-gray-600 mt-2">Manage and monitor all your projects</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="btn-secondary flex items-center"
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Analytics
              </button>
              <button
                onClick={handleCreateProject}
                className="btn-primary flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Project
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Panel */}
        {showAnalytics && analytics && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Project Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Total Projects</p>
                    <p className="text-2xl font-bold">{analytics.totalProjects}</p>
                  </div>
                  <Bars3BottomLeftIcon className="h-8 w-8 text-blue-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Active Projects</p>
                    <p className="text-2xl font-bold">{analytics.activeProjects}</p>
                  </div>
                  <CheckCircleIcon className="h-8 w-8 text-green-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Team Members</p>
                    <p className="text-2xl font-bold">{analytics.totalTeamMembers}</p>
                  </div>
                  <UserGroupIcon className="h-8 w-8 text-purple-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100">Avg Progress</p>
                    <p className="text-2xl font-bold">{analytics.averageProgress}%</p>
                  </div>
                  <ChartBarIcon className="h-8 w-8 text-yellow-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100">Budget Usage</p>
                    <p className="text-2xl font-bold">{Math.round((analytics.spentBudget / analytics.totalBudget) * 100)}%</p>
                  </div>
                  <DocumentTextIcon className="h-8 w-8 text-indigo-200" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  {PROJECT_STATUSES.map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
              {/* Project Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {project.name}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(project.priority)}`}>
                    {project.priority}
                  </span>
                </div>
              </div>

              {/* Project Description */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {project.description}
              </p>

              {/* Project Stats */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{project.completionPercentage || project.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600"
                    style={{ width: `${project.completionPercentage || project.progress || 0}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <UserGroupIcon className="h-4 w-4 mr-1" />
                    <span title={`${project.memberCount || 0} members + ${project.leadersCount || 0} leaders`}>
                      {project.totalPeople || 0} members
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    {project.completedTasks || 0}/{project.totalTasks || 0} tasks
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Budget Used</span>
                  <span className={`font-medium ${calculateBudgetUsage(project.actualCost || project.spentBudget || 0, project.budget || 0) > 90 ? 'text-red-600' : 'text-green-600'}`}>
                    ${(project.actualCost || project.spentBudget || 0).toLocaleString()} / ${(project.budget || 0).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center">
                      <CalendarDaysIcon className="h-4 w-4 mr-1" />
                      {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No deadline'}
                    </div>
                  </div>
                  {project.teamLeadName && (
                    <div className="text-sm text-gray-600">
                      <span>Team Lead: {project.teamLeadName}</span>
                    </div>
                  )}
                  {project.projectLeaderName && (
                    <div className="text-sm text-gray-600">
                      <span>Project Manager: {project.projectLeaderName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {(project.requiredSkills || project.skills || []).slice(0, 3).map((skill, index) => (
                    <span key={index} className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded">
                      {skill}
                    </span>
                  ))}
                  {(project.requiredSkills || project.skills || []).length > 3 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      +{(project.requiredSkills || project.skills || []).length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleViewProject(project)}
                  className="flex items-center text-primary-600 hover:text-primary-500 text-sm font-medium"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View
                </button>
                <button
                  onClick={() => handleEditProject(project)}
                  className="flex items-center text-gray-600 hover:text-gray-500 text-sm font-medium"
                >
                  <PencilSquareIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteProject(project)}
                  className="flex items-center text-red-600 hover:text-red-500 text-sm font-medium"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <Bars3BottomLeftIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first project'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <button onClick={handleCreateProject} className="btn-primary">
                Create Project
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      {showEditModal && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Edit Project</h2>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmitEditProject} className="space-y-4">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project name"
                  />
                </div>
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Project description"
                  />
                </div>
                {/* Row for Project Leader and Team Lead */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Project Leader */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Leader <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="projectLeaderId"
                      value={editFormData.projectLeaderId}
                      onChange={handleEditInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select project leader</option>
                      {(projectManagers.length > 0 ? projectManagers : users.filter(u => u.roleName === 'PROJECT_MANAGER')).map(user => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} - {user.departmentName || 'No Department'} ({user.email})
                        </option>
                      ))}
                      {projectManagers.length === 0 && users.filter(u => u.roleName === 'PROJECT_MANAGER').length === 0 && (
                        <option value="" disabled>No project managers found</option>
                      )}
                    </select>
                    {editFormData.projectLeaderId && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-md">
                        {(() => {
                          const selectedUser = [...projectManagers, ...users].find(u => u.id === editFormData.projectLeaderId);
                          return selectedUser ? (
                            <UserOption user={selectedUser} isSelected={true} />
                          ) : (
                            <div className="text-sm text-gray-500">
                              Loading user information...
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  {/* Team Lead */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team Lead
                    </label>
                    <select
                      name="teamLeadId"
                      value={editFormData.teamLeadId}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select team lead (optional)</option>
                      {(teamLeads.length > 0 ? teamLeads : users.filter(u => u.roleName === 'TEAM_LEAD')).map(user => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} - {user.departmentName || 'No Department'} ({user.email})
                        </option>
                      ))}
                    </select>
                    {editFormData.teamLeadId && (
                      <div className="mt-2 p-2 bg-green-50 rounded-md">
                        {(() => {
                          const selectedUser = [...teamLeads, ...users].find(u => u.id === editFormData.teamLeadId);
                          return selectedUser ? (
                            <UserOption user={selectedUser} isSelected={true} />
                          ) : (
                            <div className="text-sm text-gray-500">
                              Loading user information...
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
                {/* Row for Status and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={editFormData.status}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {PROJECT_STATUSES.map(status => (
                        <option key={status} value={status}>
                          {status.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={editFormData.priority}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>
                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget ($)
                  </label>
                  <input
                    type="number"
                    name="budget"
                    value={editFormData.budget}
                    onChange={handleEditInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Project budget"
                  />
                </div>
                {/* Row for Start Date and End Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={editFormData.startDate}
                      onChange={handleEditInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="endDate"
                      value={editFormData.endDate}
                      onChange={handleEditInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
                <button
                  onClick={handleCloseCreateModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmitProject} className="space-y-4">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project name"
                  />
                </div>
                
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Project description"
                  />
                </div>
                
                {/* Row for Project Leader and Team Lead */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Project Leader */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Leader <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="projectLeaderId"
                      value={formData.projectLeaderId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select project leader</option>
                      {(projectManagers.length > 0 ? projectManagers : users.filter(u => u.roleName === 'PROJECT_MANAGER')).map(user => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} - {user.departmentName || 'No Department'} ({user.email})
                        </option>
                      ))}
                      {projectManagers.length === 0 && users.filter(u => u.roleName === 'PROJECT_MANAGER').length === 0 && (
                        <option value="" disabled>No project managers found</option>
                      )}
                    </select>
                    {formData.projectLeaderId && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-md">
                        {(() => {
                          const selectedUser = [...projectManagers, ...users].find(u => u.id === formData.projectLeaderId);
                          return selectedUser ? (
                            <UserOption user={selectedUser} isSelected={true} />
                          ) : (
                            <div className="text-sm text-gray-500">
                              Loading user information...
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  
                  {/* Team Lead */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team Lead
                    </label>
                    <select
                      name="teamLeadId"
                      value={formData.teamLeadId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select team lead (optional)</option>
                      {(teamLeads.length > 0 ? teamLeads : users.filter(u => u.roleName === 'TEAM_LEAD')).map(user => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} - {user.departmentName || 'No Department'} ({user.email})
                        </option>
                      ))}
                    </select>
                    {formData.teamLeadId && (
                      <div className="mt-2 p-2 bg-green-50 rounded-md">
                        {(() => {
                          const selectedUser = [...teamLeads, ...users].find(u => u.id === formData.teamLeadId);
                          return selectedUser ? (
                            <UserOption user={selectedUser} isSelected={true} />
                          ) : (
                            <div className="text-sm text-gray-500">
                              Loading user information...
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Row for Status and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {PROJECT_STATUSES.map(status => (
                        <option key={status} value={status}>
                          {status.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>
                
                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget ($)
                  </label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Project budget"
                  />
                </div>
                
                {/* Row for Start Date and End Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCloseCreateModal}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  >
                    {createLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create Project'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsManagement;