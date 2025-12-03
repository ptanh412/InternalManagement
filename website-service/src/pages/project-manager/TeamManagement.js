import React, { useState, useEffect } from 'react';
import { 
  UserPlusIcon,
  MagnifyingGlassIcon,
  UserMinusIcon,
  PencilSquareIcon,
  FunnelIcon,
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import WorkloadSummaryCard from '../../components/workload/WorkloadSummaryCard';
import { apiService } from '../../services/apiService';

const TeamManagement = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [workloadData, setWorkloadData] = useState({}); // Store workload data for all members

  // Project roles from the controller
  const PROJECT_ROLES = ['DEVELOPER', 'DESIGNER', 'TESTER', 'ANALYST', 'ARCHITECT', 'LEAD'];

  useEffect(() => {
    loadProjects();
    loadAllUsers();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadTeamMembers(selectedProject);
    }
  }, [selectedProject]);

  const fetchWorkloadForMember = async (userId) => {
    try {
      const response = await apiService.workload.getUserWorkload(userId);
      return response.data;
    } catch (error) {
      console.error(`Failed to load workload for user ${userId}:`, error);
      return null;
    }
  };

  const refreshWorkload = async (userId) => {
    const workload = await fetchWorkloadForMember(userId);
    if (workload) {
      setWorkloadData(prev => ({
        ...prev,
        [userId]: workload
      }));
    }
  };

  const loadProjects = async () => {
    try {
      // Call actual API to get projects
      const response = await apiService.getProjectsForUser(user.id, user.role);
      const projects = response.result || [];

      setProjects(projects);
      if (projects.length > 0) {
        setSelectedProject(projects[0].id);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      // Call actual API to get all available users
      const response = await apiService.getAllUsers();
      const users = response.result || [];
      console.log("All users loaded:", users);
      setAllUsers(users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadTeamMembers = async (projectId) => {
    try {
      setLoading(true);
      
      // Call actual API to get project members
      const response = await apiService.getProjectMembers(projectId);
      const members = response.result || [];

      setTeamMembers(members);
      setLoading(false);

      // Fetch workload data for all team members
      const workloadPromises = members.map(member => 
        fetchWorkloadForMember(member.userId)
      );
      const workloads = await Promise.all(workloadPromises);
      
      const workloadMap = {};
      members.forEach((member, index) => {
        if (workloads[index]) {
          workloadMap[member.userId] = workloads[index];
        }
      });
      setWorkloadData(workloadMap);
      
    } catch (error) {
      console.error('Failed to load team members:', error);
      setLoading(false);
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    // Find the corresponding user from allUsers based on userId
    const userDetails = allUsers.find(u => u.id === member.userId);
    
    if (!userDetails) {
      console.log("No user details found for member:", member);
      return false;
    }
    
    const matchesSearch = userDetails.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userDetails.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userDetails.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userDetails.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${userDetails.firstName} ${userDetails.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  }).map(member => {
    // Enrich team member with user details
    const userDetails = allUsers.find(u => u.id === member.userId);
    return {
      ...member,
      user: userDetails || {}
    };
  });


  const getRoleColor = (role) => {
    const colors = {
      LEAD: 'bg-purple-100 text-purple-800',
      ARCHITECT: 'bg-blue-100 text-blue-800',
      DEVELOPER: 'bg-green-100 text-green-800',
      DESIGNER: 'bg-pink-100 text-pink-800',
      TESTER: 'bg-yellow-100 text-yellow-800',
      ANALYST: 'bg-indigo-100 text-indigo-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getExperienceColor = (level) => {
    const colors = {
      'JUNIOR': 'text-green-600',
      'MID_LEVEL': 'text-yellow-600',
      'SENIOR': 'text-blue-600',
      'LEAD': 'text-purple-600',
      'Junior': 'text-green-600',
      'Mid-Level': 'text-yellow-600',
      'Senior': 'text-blue-600',
      'Lead': 'text-purple-600'
    };
    return colors[level] || 'text-gray-600';
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleAddMember = () => {
    setShowAddMemberModal(true);
  };

  const handleRemoveMember = async (member) => {
    if (window.confirm(`Are you sure you want to remove ${member.user.name} from this project?`)) {
      try {
        // API call to DELETE /project-members/projects/{projectId}/users/{userId}
        await apiService.removeProjectMember(selectedProject, member.userId);
        
        // Update local state
        setTeamMembers(teamMembers.filter(m => m.id !== member.id));
      } catch (error) {
        console.error('Failed to remove member:', error);
        alert('Failed to remove team member. Please try again.');
      }
    }
  };

  const handleUpdateMemberRole = async (member, newRole) => {
    try {
      // API call to PUT /project-members/projects/{projectId}/users/{userId}
      await apiService.updateProjectMemberRole(selectedProject, member.userId, { role: newRole });
      
      // Update local state
      setTeamMembers(teamMembers.map(m => 
        m.id === member.id ? { ...m, role: newRole } : m
      ));
    } catch (error) {
      console.error('Failed to update member role:', error);
      alert('Failed to update member role. Please try again.');
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
              <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
              <p className="text-gray-600 mt-2">Manage project team members and their roles</p>
            </div>
            <button
              onClick={handleAddMember}
              className="btn-primary flex items-center"
            >
              <UserPlusIcon className="h-4 w-4 mr-2" />
              Add Member
            </button>
          </div>
        </div>

        {/* Project Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="ml-8 flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{teamMembers.length}</div>
                <div className="text-gray-600">Total Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {teamMembers.filter(m => m.role === 'TEAM_LEAD' || m.role === 'LEAD').length}
                </div>
                <div className="text-gray-600">Team Leads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {teamMembers.length > 0 && teamMembers.some(m => m.performance?.efficiency)
                    ? Math.round(teamMembers.reduce((acc, m) => acc + (m.performance?.efficiency || 0), 0) / teamMembers.length)
                    : 'N/A'}
                  {teamMembers.length > 0 && teamMembers.some(m => m.performance?.efficiency) && '%'}
                </div>
                <div className="text-gray-600">Avg Efficiency</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search team members..."
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
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  {PROJECT_ROLES.map(role => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => {
            const userName = `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || 'Unknown User';
            const userInitials = `${member.user.firstName?.[0] || ''}${member.user.lastName?.[0] || ''}`.toUpperCase() || '??';
            
            return (
              <div key={member.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                {/* Member Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {userInitials}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{userName}</h3>
                      <p className="text-sm text-gray-600">{member.user.departmentName || 'N/A'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                    {member.role}
                  </span>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    {member.user.email || 'N/A'}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    {member.user.phoneNumber || 'N/A'}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarDaysIcon className="h-4 w-4 mr-2" />
                    Joined {member.joinedDate ? new Date(member.joinedDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>

                {/* Experience Level */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Experience</span>
                    <span className={`font-medium ${getExperienceColor(member.user.seniorityLevel)}`}>
                      {member.user.seniorityLevel || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Performance Metrics */}
                {member.performance && (
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tasks Completed</span>
                      <span className="text-sm font-medium">
                        {member.performance.tasksCompleted || 0}/{member.performance.tasksAssigned || 0}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Efficiency</span>
                      <span className={`text-sm font-medium ${getPerformanceColor(member.performance.efficiency || 0)}`}>
                        {member.performance.efficiency || 0}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Quality Score</span>
                      <div className="flex items-center">
                        <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className={`text-sm font-medium ${getPerformanceColor(member.performance.qualityScore || 0)}`}>
                          {member.performance.qualityScore || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Skills */}
                {member.user.skills && member.user.skills.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {member.user.skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded">
                          {skill}
                        </span>
                      ))}
                      {member.user.skills.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          +{member.user.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Workload Summary */}
                <div className="mb-4">
                  <WorkloadSummaryCard
                    workloadData={workloadData[member.userId]}
                    compact={true}
                    onRefresh={() => refreshWorkload(member.userId)}
                    className="w-full"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <div className="relative">
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateMemberRole(member, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500"
                    >
                      {PROJECT_ROLES.map(role => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => setSelectedMember(member)}
                    className="flex items-center text-primary-600 hover:text-primary-500 text-sm font-medium"
                  >
                    <PencilSquareIcon className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleRemoveMember(member)}
                    className="flex items-center text-red-600 hover:text-red-500 text-sm font-medium"
                  >
                    <UserMinusIcon className="h-4 w-4 mr-1" />
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || roleFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Start building your team by adding members to this project'
              }
            </p>
            {(!searchTerm && roleFilter === 'all') && (
              <button onClick={handleAddMember} className="btn-primary">
                Add Team Member
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManagement;