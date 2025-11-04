import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  EyeIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Bars3BottomLeftIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';
import { useApiNotifications } from '../../hooks/useApiNotifications';
import { useSocketEvent } from '../../hooks/useSocket';

const TeamLeadProjectsManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const notify = useApiNotifications();
  
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Project statuses
  const PROJECT_STATUSES = ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];

  useEffect(() => {
    if (user) {
      loadTeamLeadProjects();
    }
  }, [user]);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter]);

  // Socket.IO event listeners for real-time updates
  useSocketEvent('project-created', async (data) => {
    console.log('Real-time project created:', data);
    // Check if this project is assigned to the current team lead
    if (data.project && data.project.teamLeadId === user?.id) {
      try {
        // Enrich the new project with user data
        const enrichedProject = await enrichProjectsWithUserData([data.project]);
        if (enrichedProject.length > 0) {
          // Add the new project to the beginning of the list
          setProjects(prev => [enrichedProject[0], ...prev]);
          notify.success('New project assigned to you: ' + data.project.name);
        }
      } catch (error) {
        console.error('Error enriching new project:', error);
        // Fallback to reloading all projects
        loadTeamLeadProjects();
      }
    }
  });

  useSocketEvent('project-updated', async (data) => {
    console.log('Real-time project updated:', data);
    // Check if this project is assigned to the current team lead
    if (data.project && data.project.teamLeadId === user?.id) {
      try {
        // Update the specific project in the list
        const enrichedProject = await enrichProjectsWithUserData([data.project]);
        if (enrichedProject.length > 0) {
          setProjects(prev => prev.map(p => 
            p.id === data.project.id ? enrichedProject[0] : p
          ));
          notify.info('Project updated: ' + data.project.name);
        }
      } catch (error) {
        console.error('Error updating project:', error);
        // Fallback to reloading all projects
        loadTeamLeadProjects();
      }
    }
  });

  useSocketEvent('project-status-changed', async (data) => {
    console.log('Real-time project status changed:', data);
    // Check if this project is assigned to the current team lead
    if (data.project && data.project.teamLeadId === user?.id) {
      try {
        // Update the specific project in the list
        const enrichedProject = await enrichProjectsWithUserData([data.project]);
        if (enrichedProject.length > 0) {
          setProjects(prev => prev.map(p => 
            p.id === data.project.id ? enrichedProject[0] : p
          ));
          notify.info(`Project status changed to ${data.project.status}: ${data.project.name}`);
        }
      } catch (error) {
        console.error('Error updating project status:', error);
        // Fallback to reloading all projects
        loadTeamLeadProjects();
      }
    }
  });

  const loadTeamLeadProjects = async () => {
    console.log("Loading projects for team lead:", user.id);
    try {
      setLoading(true);
      
      // Get projects where user is team lead
      const response = await apiService.getProjectsForUser(user.id, 'TEAM_LEAD');
      console.log("Team lead projects response:", response);
      
      if (response.result) {
        const enrichedProjects = await enrichProjectsWithUserData(response.result);
        // Calculate progress cho từng project
        const projectsWithProgress = await Promise.all(
          enrichedProjects.map(async (project) => {
            try {
              const progressResponse = await apiService.calculateProjectProgress(project.id);
              console.log(`Progress for project ${project.id}:`, progressResponse);
              
              return {
                ...project,
                progress: progressResponse.result || 0 // Lấy result từ response
              };
            } catch (error) {
              console.warn(`Failed to calculate progress for project ${project.id}:`, error);
              return {
                ...project,
                progress: project.completionPercentage || 0 // Fallback to existing value
              };
            }
          })
        );
        setProjects(projectsWithProgress);
      } else {
        setProjects([]);
      }
      
    } catch (error) {
      console.warn('API failed, using mock data:', error);
      notify.load.warning('Unable to connect to server. Showing sample data.');
      
      // Fallback to mock data for team lead
      const mockProjects = [
        {
          id: 'proj-tl-1',
          name: 'Mobile App Testing',
          description: 'Lead testing phase for mobile banking app',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          progress: 60,
          startDate: '2024-10-01',
          endDate: '2024-11-30',
          budget: 50000,
          spentBudget: 30000,
          teamLeadId: user.id,
          teamLeadName: user.firstName + ' ' + user.lastName,
          projectLeaderId: 'pm-1',
          projectLeaderName: 'Sarah Johnson',
          memberCount: 4, // Regular members
          leadersCount: 2, // Project manager + team lead
          totalPeople: 6, // Total including leaders
          totalTasks: 25,
          completedTasks: 15,
          skills: ['Testing', 'QA', 'Mobile'],
        },
        {
          id: 'proj-tl-2',
          name: 'API Documentation',
          description: 'Create comprehensive API documentation',
          status: 'PLANNING',
          priority: 'MEDIUM',
          progress: 20,
          startDate: '2024-11-01',
          endDate: '2024-12-15',
          budget: 30000,
          spentBudget: 6000,
          teamLeadId: user.id,
          teamLeadName: user.firstName + ' ' + user.lastName,
          projectLeaderId: 'pm-2',
          projectLeaderName: 'Mike Wilson',
          memberCount: 3, // Regular members
          leadersCount: 2, // Project manager + team lead
          totalPeople: 5, // Total including leaders
          totalTasks: 15,
          completedTasks: 3,
          skills: ['Documentation', 'API', 'Technical Writing'],
        }
      ];
      
      const enrichedMockProjects = await enrichProjectsWithUserData(mockProjects);
      setProjects(enrichedMockProjects);
      
    } finally {
      setLoading(false);
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

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }
    setFilteredProjects(filtered);
  };

  // Refresh progress cho một project cụ thể
  const refreshProjectProgress = async (projectId) => {
    try {
      const progressResponse = await apiService.calculateProjectProgress(projectId);
      
      // Cập nhật lại state
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId 
            ? { ...project, progress: progressResponse.result || 0 }
            : project
        )
      );
      
      notify.success('Progress updated successfully');
    } catch (error) {
      console.error('Failed to refresh progress:', error);
      notify.error('Failed to refresh progress');
    }
  };

  const handleViewProjectTasks = (project) => {
    // Navigate to project tasks page
    navigate(`/team-lead/projects/${project.id}/tasks`, { 
      state: { 
        projectId: project.id,
        projectName: project.name 
      } 
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLANNING': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateBudgetUsage = (budget, spentBudget) => {
    if (!budget || budget === 0) return 0;
    return Math.min((spentBudget / budget) * 100, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slideInFromBottom">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">My Projects</h1>
        <p className="text-gray-600">Projects where you are assigned as Team Lead</p>
      </div>

      {/* Filters */}
      <div className="card p-6 mb-8 animate-slideInFromLeft">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative animate-slideInFromLeft animation-delay-200">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 pr-4 py-3 min-w-64"
              />
            </div>

            {/* Status Filter */}
            <div className="relative animate-slideInFromLeft animation-delay-300">
              <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field pl-10 pr-8 py-3 appearance-none"
              >
                <option value="all">All Status</option>
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
      <div className="space-y-6">
        {filteredProjects.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3 animate-slideInFromBottom">
            {filteredProjects.map((project, index) => (
              <div 
                key={project.id} 
                className={`card hover-lift animate-slideInFromBottom`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                    </div>
                  </div>

                  {/* Status and Priority */}
                  <div className="flex gap-2 mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status?.replace('_', ' ')}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                      {project.priority}
                    </span>
                  </div>

                   {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {Math.round(project.progress || 0)}%
                        </span>
                        <button
                          onClick={() => refreshProjectProgress(project.id)}
                          className="text-blue-500 hover:text-blue-700"
                          title="Refresh progress"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 animate-glow"
                        style={{ width: `${project.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="flex items-center text-gray-600">
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      {project.totalPeople || project.memberCount || 0} members
                    </div>
                    <div className="flex items-center text-gray-600">
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      {project.completedTasks || 0}/{project.totalTasks || 0} tasks
                    </div>
                  </div>

                  {/* Budget */}
                  {project.budget && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Budget Used</span>
                        <span>${project.spentBudget?.toLocaleString() || 0} / ${project.budget?.toLocaleString() || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${calculateBudgetUsage(project.budget, project.spentBudget)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="text-xs text-gray-500 mb-4">
                    <div className="flex items-center mb-1">
                      <CalendarDaysIcon className="h-3 w-3 mr-1" />
                      {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No deadline'}
                    </div>
                    <div>Project Manager: {project.projectLeaderName || 'Not assigned'}</div>
                  </div>

                  {/* Action */}
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleViewProjectTasks(project)}
                      className="w-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View Tasks
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bars3BottomLeftIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'You are not assigned as team lead to any projects yet'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamLeadProjectsManagement;