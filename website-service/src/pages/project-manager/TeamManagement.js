import React, { useState, useEffect, useMemo } from 'react';
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
import CustomSelect from '../../components/CustomSelect';

const TeamManagement = ({ embedded = false, projectId = null }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(projectId || '');
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

  // ✅ Step 1: Load projects first (for non-embedded mode)
  useEffect(() => {
    if (!embedded) {
      loadProjects();
    }
  }, [embedded]);

  // ✅ Step 2: Sync selectedProject with projectId in embedded mode
  useEffect(() => {
    if (embedded && projectId && projectId !== selectedProject) {
      setSelectedProject(projectId);
    }
  }, [embedded, projectId]);

  // ✅ Step 3: Load team members when we have a project
  useEffect(() => {
    const initData = async () => {
      if (!selectedProject) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await loadTeamMembers(selectedProject);
      } catch (error) {
        console.error("Failed to load team members:", error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [selectedProject]);

  const fetchWorkloadForMember = async (userId) => {
    try {
      const response = await apiService.workload.getUserWorkload(userId);
      // console.log('Fetched workload for user:', userId, response);
      return response;
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
      // ✅ Auto-select first project if none selected (empty string is falsy)
      if (projects.length > 0 && (!selectedProject || selectedProject === '')) {
        console.log(`⚡ Auto-selecting first project: ${projects[0].name}`);
        setSelectedProject(projects[0].id);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadTeamMembers = async (projectId) => {
    try {
      // Step 1: Load project members
      const response = await apiService.getProjectMembers(projectId);
      console.log("Team members loaded:", response);
      const members = response.result || [];
      setTeamMembers(members);

      if (members.length === 0) {
        setAllUsers([]);
        setWorkloadData({});
        return;
      }

      // Step 2: Load profiles ONLY for these members (not all 832 users!)
      const memberUserIds = members.map(m => m.userId);
      console.log(`⚡ Loading profiles for ${memberUserIds.length} members only`);
      
      const profilePromises = memberUserIds.map(userId => 
        apiService.getProfileById(userId).catch(err => {
          console.error(`Failed to load profile for ${userId}:`, err);
          return null;
        })
      );
      const profiles = await Promise.all(profilePromises);
      
      // Filter out null responses and set to allUsers
      const validProfiles = profiles.filter(p => p !== null);
      console.log(`✅ Loaded ${validProfiles.length} profiles`);
      setAllUsers(validProfiles);

      // Step 3: Load workload for members
      const workloadPromises = members.map(member => fetchWorkloadForMember(member.userId));
      const workloads = await Promise.all(workloadPromises);
      
      const workloadMap = {};
      members.forEach((member, index) => {
        if (workloads[index]) workloadMap[member.userId] = workloads[index];
      });
      setWorkloadData(workloadMap);
    } catch (error) {
      console.error('Failed to load team members:', error);
      throw error;
    }
  };

  const filteredMembers = useMemo(() => {
    if (allUsers.length === 0 || teamMembers.length === 0) return [];

    return teamMembers.filter(member => {
      // ✅ Fix: allUsers now contains Profile objects directly
      const userProfile = allUsers.find(profile => {
        // Handle both response formats: {result: {...}} or direct object
        const profileData = profile.result || profile;
        const userData = profileData.user || profileData;
        return userData.id === member.userId;
      });
      
      if (!userProfile) {
        console.warn(`No profile found for member ${member.userId}`);
        return false;
      }
      
      // Extract user data from profile
      const profileData = userProfile.result || userProfile;
      const searchData = profileData.user || profileData;
      
      const matchesSearch = searchData.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          searchData.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          searchData.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          searchData.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          `${searchData.firstName} ${searchData.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      
      return matchesSearch && matchesRole;
    }).map(member => {
      const userProfile = allUsers.find(profile => {
        const profileData = profile.result || profile;
        const userData = profileData.user || profileData;
        return userData.id === member.userId;
      });
      
      return {
        ...member,
        user: userProfile ? (userProfile.result || userProfile) : {}
      };
    });
  }, [teamMembers, allUsers, searchTerm, roleFilter]);

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
    <div className={embedded ? "" : "min-h-screen bg-gray-50 dark:bg-gray-900 py-8"}>
      <div className={embedded ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}>
        {/* Header */}
        {!embedded && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Team Management</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Manage project team members and their roles</p>
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
        )}

        {/* Project Selection */}
        {!embedded && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-md">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Project
                </label>
                <CustomSelect
                  name="projectSelect"
                  value={selectedProject}
                  options={projects.map(proj => ({ value: proj.id, label: proj.name }))}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  placeholder="Select a project"
                />
              </div>
              
              <div className="ml-8 flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{teamMembers.length}</div>
                  <div className="text-gray-600 dark:text-gray-300">Total Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {teamMembers.filter(m => m.role === 'TEAM_LEAD' || m.role === 'LEAD').length}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">Team Leads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {teamMembers.length > 0 && teamMembers.some(m => m.performance?.efficiency)
                      ? Math.round(teamMembers.reduce((acc, m) => acc + (m.performance?.efficiency || 0), 0) / teamMembers.length)
                      : 'N/A'}
                    {teamMembers.length > 0 && teamMembers.some(m => m.performance?.efficiency) && '%'}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">Avg Efficiency</div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FunnelIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <CustomSelect
                  name="roleFilter"
                  value={roleFilter}
                  options={[{ value: 'all', label: 'All Roles' }].concat(
                    PROJECT_ROLES.map(role => ({ value: role, label: role }))
                  )}
                  onChange={(value) => setRoleFilter(value)}
                  Icon={FunnelIcon}
                  placeholder="Filter by Role"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => {
            const userName = `${member.user.user?.firstName || ''} ${member.user.user?.lastName || ''}`.trim() || 'Unknown User';
            const userInitials = `${member.user.user?.firstName?.[0] || ''}${member.user.user?.lastName?.[0] || ''}`.toUpperCase() || '??';
            
            return (
              <div key={member.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                {/* Member Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {userInitials}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{userName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{member.user.user.departmentName || 'N/A'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                    {member.role}
                  </span>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    {member.user.user?.email || 'N/A'} {/* Thêm .user vào giữa */}                  
                    </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    {member.user.user?.phoneNumber || 'N/A'}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <CalendarDaysIcon className="h-4 w-4 mr-2" />
                    Joined {member.user.user?.createdAt ? new Date(member.user.user.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>

                {/* Experience Level */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Experience</span>
                    <span className={`font-medium ${getExperienceColor(member.user.user?.seniorityLevel)}`}>
                      {member.user.user?.seniorityLevel || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Performance Metrics */}
                {member.performance && (
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Tasks Completed</span>
                      <span className="text-sm font-medium">
                        {member.performance.tasksCompleted || 0}/{member.performance.tasksAssigned || 0}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Efficiency</span>
                      <span className={`text-sm font-medium ${getPerformanceColor(member.performance.efficiency || 0)}`}>
                        {member.performance.efficiency || 0}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Quality Score</span>
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
                        <span 
                          key={skill.id || index} // Sử dụng skill.id làm key sẽ tốt hơn
                          className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded"
                        >
                          {skill.skillName} {/* SỬA TẠI ĐÂY: Thêm .skillName */}
                        </span>
                      ))}
                      {member.user.skills.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded">
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
                <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateMemberRole(member, e.target.value)}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
            <UserGroupIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No team members found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
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