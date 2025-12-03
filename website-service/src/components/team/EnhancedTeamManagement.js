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
  StarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import WorkloadBadge from '../../components/workload/WorkloadBadge';
import WorkloadProgressBar from '../../components/workload/WorkloadProgressBar';
import WorkloadSummaryCard from '../../components/workload/WorkloadSummaryCard';

const EnhancedTeamManagement = ({ teamLeadMode = false }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [workloadData, setWorkloadData] = useState({}); // New: Store workload data
  const [loading, setLoading] = useState(true);
  const [workloadLoading, setWorkloadLoading] = useState(false); // New: Workload loading state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [workloadFilter, setWorkloadFilter] = useState('all'); // New: Filter by workload status
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showWorkloadDetails, setShowWorkloadDetails] = useState({}); // New: Toggle workload details

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

  // New: Load workload data for team members
  useEffect(() => {
    if (teamMembers.length > 0) {
      loadTeamWorkloadData();
    }
  }, [teamMembers]);

  const loadProjects = async () => {
    try {
      // Simulate API call to /projects with user filtering
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockProjects = [
        { id: 'proj-1', name: 'Mobile Banking App' },
        { id: 'proj-2', name: 'E-commerce Platform' },
        { id: 'proj-3', name: 'IoT Monitoring System' },
        { id: 'proj-4', name: 'Healthcare Management System' }
      ];

      setProjects(mockProjects);
      if (mockProjects.length > 0) {
        setSelectedProject(mockProjects[0].id);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      // Simulate API call to identity service to get available users
      await new Promise(resolve => setTimeout(resolve, 600));

      const mockUsers = [
        {
          id: 'user-1',
          name: 'Alice Johnson',
          email: 'alice.johnson@company.com',
          phone: '+1 (555) 123-4567',
          department: 'Frontend Development',
          skills: ['React', 'JavaScript', 'CSS', 'UI/UX'],
          experienceLevel: 'Senior',
          availability: 'Available'
        },
        {
          id: 'user-2',
          name: 'Bob Smith',
          email: 'bob.smith@company.com',
          phone: '+1 (555) 234-5678',
          department: 'Backend Development',
          skills: ['Java', 'Spring Boot', 'PostgreSQL', 'AWS'],
          experienceLevel: 'Mid-Level',
          availability: 'Available'
        },
        {
          id: 'user-3',
          name: 'Carol Davis',
          email: 'carol.davis@company.com',
          phone: '+1 (555) 345-6789',
          department: 'UI/UX Design',
          skills: ['Figma', 'Adobe Creative Suite', 'User Research'],
          experienceLevel: 'Senior',
          availability: 'Available'
        },
        {
          id: 'user-4',
          name: 'David Wilson',
          email: 'david.wilson@company.com',
          phone: '+1 (555) 456-7890',
          department: 'QA Testing',
          skills: ['Selenium', 'Jest', 'Manual Testing', 'API Testing'],
          experienceLevel: 'Mid-Level',
          availability: 'Available'
        }
      ];

      setAllUsers(mockUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadTeamMembers = async (projectId) => {
    try {
      setLoading(true);
      // Simulate API call to get project team members
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockTeamMembers = [
        {
          id: 'member-1',
          userId: 'user-1',
          name: 'Alice Johnson',
          email: 'alice.johnson@company.com',
          role: 'LEAD',
          joinedDate: '2025-01-15',
          department: 'Frontend Development',
          skills: ['React', 'JavaScript', 'CSS', 'UI/UX'],
          experienceLevel: 'Senior',
          phone: '+1 (555) 123-4567',
          status: 'Active'
        },
        {
          id: 'member-2',
          userId: 'user-2',
          name: 'Bob Smith',
          email: 'bob.smith@company.com',
          role: 'DEVELOPER',
          joinedDate: '2025-01-20',
          department: 'Backend Development',
          skills: ['Java', 'Spring Boot', 'PostgreSQL', 'AWS'],
          experienceLevel: 'Mid-Level',
          phone: '+1 (555) 234-5678',
          status: 'Active'
        },
        {
          id: 'member-3',
          userId: 'user-3',
          name: 'Carol Davis',
          email: 'carol.davis@company.com',
          role: 'DESIGNER',
          joinedDate: '2025-02-01',
          department: 'UI/UX Design',
          skills: ['Figma', 'Adobe Creative Suite', 'User Research'],
          experienceLevel: 'Senior',
          phone: '+1 (555) 345-6789',
          status: 'Active'
        },
        {
          id: 'member-4',
          userId: 'user-4',
          name: 'David Wilson',
          email: 'david.wilson@company.com',
          role: 'TESTER',
          joinedDate: '2025-02-10',
          department: 'QA Testing',
          skills: ['Selenium', 'Jest', 'Manual Testing', 'API Testing'],
          experienceLevel: 'Mid-Level',
          phone: '+1 (555) 456-7890',
          status: 'Active'
        }
      ];

      setTeamMembers(mockTeamMembers);
    } catch (error) {
      console.error('Failed to load team members:', error);
    } finally {
      setLoading(false);
    }
  };

  // New: Load workload data for all team members
  const loadTeamWorkloadData = async () => {
    try {
      setWorkloadLoading(true);

      // Simulate API calls to workload service
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock workload data for team members
      const mockWorkloadData = {
        'user-1': {
          userId: 'user-1',
          availabilityPercentage: 25.5,
          utilizationPercentage: 74.5,
          currentLoad: 30,
          weeklyCapacity: 40,
          currentTasksCount: 5,
          nextAvailableDate: '2025-11-20',
          upcomingWeekHours: 35,
          status: 'Busy'
        },
        'user-2': {
          userId: 'user-2',
          availabilityPercentage: 87.5,
          utilizationPercentage: 12.5,
          currentLoad: 5,
          weeklyCapacity: 40,
          currentTasksCount: 2,
          nextAvailableDate: '2025-11-11',
          upcomingWeekHours: 8,
          status: 'Available'
        },
        'user-3': {
          userId: 'user-3',
          availabilityPercentage: 0,
          utilizationPercentage: 112.5,
          currentLoad: 45,
          weeklyCapacity: 40,
          currentTasksCount: 7,
          nextAvailableDate: '2025-11-25',
          upcomingWeekHours: 40,
          status: 'Overloaded'
        },
        'user-4': {
          userId: 'user-4',
          availabilityPercentage: 62.5,
          utilizationPercentage: 37.5,
          currentLoad: 15,
          weeklyCapacity: 40,
          currentTasksCount: 3,
          nextAvailableDate: '2025-11-11',
          upcomingWeekHours: 18,
          status: 'Available'
        }
      };

      setWorkloadData(mockWorkloadData);
    } catch (error) {
      console.error('Failed to load workload data:', error);
    } finally {
      setWorkloadLoading(false);
    }
  };

  // New: Refresh workload data for a specific user
  const refreshUserWorkload = async (userId) => {
    try {
      console.log(`Refreshing workload for user: ${userId}`);
      // Simulate API call to refresh workload
      await new Promise(resolve => setTimeout(resolve, 500));

      // In real implementation, call: apiService.workload.refreshUserWorkload(userId)
      // For now, just reload all workload data
      await loadTeamWorkloadData();
    } catch (error) {
      console.error(`Failed to refresh workload for user ${userId}:`, error);
    }
  };

  // New: Toggle workload details visibility
  const toggleWorkloadDetails = (userId) => {
    setShowWorkloadDetails(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Enhanced filtering to include workload status
  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || member.role === roleFilter;

    // New: Filter by workload status
    const memberWorkload = workloadData[member.userId];
    let matchesWorkload = true;

    if (workloadFilter !== 'all' && memberWorkload) {
      if (workloadFilter === 'available' && memberWorkload.availabilityPercentage < 75) {
        matchesWorkload = false;
      }
      if (workloadFilter === 'busy' && (memberWorkload.availabilityPercentage >= 75 || memberWorkload.availabilityPercentage < 25)) {
        matchesWorkload = false;
      }
      if (workloadFilter === 'overloaded' && memberWorkload.availabilityPercentage >= 25) {
        matchesWorkload = false;
      }
    }

    return matchesSearch && matchesRole && matchesWorkload;
  });

  // New: Calculate team workload summary
  const getTeamWorkloadSummary = () => {
    const workloadValues = Object.values(workloadData);
    if (workloadValues.length === 0) return null;

    const available = workloadValues.filter(w => w.availabilityPercentage >= 75).length;
    const busy = workloadValues.filter(w => w.availabilityPercentage >= 25 && w.availabilityPercentage < 75).length;
    const overloaded = workloadValues.filter(w => w.availabilityPercentage < 25).length;
    const avgUtilization = workloadValues.reduce((acc, w) => acc + w.utilizationPercentage, 0) / workloadValues.length;

    return { available, busy, overloaded, avgUtilization };
  };

  const teamSummary = getTeamWorkloadSummary();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <UserGroupIcon className="h-8 w-8 text-blue-600" />
            Team Management
            {teamLeadMode && <span className="text-xl text-gray-600">(Team Lead View)</span>}
          </h1>

          {/* New: Team Workload Summary */}
          {teamSummary && !workloadLoading && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                Team Workload Overview
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{teamSummary.available}</div>
                  <div className="text-sm text-gray-600">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{teamSummary.busy}</div>
                  <div className="text-sm text-gray-600">Busy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{teamSummary.overloaded}</div>
                  <div className="text-sm text-gray-600">Overloaded</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{teamSummary.avgUtilization.toFixed(0)}%</div>
                  <div className="text-sm text-gray-600">Avg Utilization</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Project Selection and Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Project Selection */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Team Member Button */}
            <div className="flex-shrink-0">
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlusIcon className="h-4 w-4" />
                Add Member
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              {PROJECT_ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>

            {/* New: Workload Filter */}
            <select
              value={workloadFilter}
              onChange={(e) => setWorkloadFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Workload Status</option>
              <option value="available">Available (75%+)</option>
              <option value="busy">Busy (25-74%)</option>
              <option value="overloaded">Overloaded (0-24%)</option>
            </select>

            {/* Refresh Workload Data */}
            <button
              onClick={loadTeamWorkloadData}
              disabled={workloadLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${workloadLoading ? 'animate-spin' : ''}`} />
              Refresh Workload
            </button>
          </div>
        </div>

        {/* Team Members Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading team members...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMembers.map((member) => {
              const memberWorkload = workloadData[member.userId];
              const showDetails = showWorkloadDetails[member.userId];

              return (
                <div key={member.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Member Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{member.name}</h3>
                          <p className="text-sm text-gray-600">{member.role}</p>
                        </div>
                      </div>

                      {/* New: Workload Badge */}
                      {memberWorkload && (
                        <WorkloadBadge
                          availabilityPercentage={memberWorkload.availabilityPercentage}
                          size="sm"
                        />
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <EnvelopeIcon className="h-4 w-4" />
                        <span>{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="h-4 w-4" />
                        <span>{member.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="h-4 w-4" />
                        <span>Joined: {member.joinedDate}</span>
                      </div>
                    </div>

                    {/* Department and Experience */}
                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-gray-700">
                        {member.department}
                      </span>
                      <span className="flex items-center gap-1 text-yellow-600">
                        <StarIcon className="h-4 w-4" />
                        {member.experienceLevel}
                      </span>
                    </div>

                    {/* Skills */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {member.skills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {member.skills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{member.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* New: Workload Progress Bar */}
                    {memberWorkload && (
                      <div className="mb-4">
                        <WorkloadProgressBar
                          utilizationPercentage={memberWorkload.utilizationPercentage}
                          currentLoad={memberWorkload.currentLoad}
                          capacity={memberWorkload.weeklyCapacity}
                          size="sm"
                          showLabels={true}
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedMember(member)}
                          className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          Edit
                        </button>
                        <button className="flex items-center gap-1 px-3 py-1 text-red-600 hover:text-red-700 transition-colors">
                          <UserMinusIcon className="h-4 w-4" />
                          Remove
                        </button>
                      </div>

                      {/* New: Toggle Workload Details */}
                      {memberWorkload && (
                        <button
                          onClick={() => toggleWorkloadDetails(member.userId)}
                          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showDetails ? 'Hide Details' : 'Show Details'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* New: Expandable Workload Details */}
                  {memberWorkload && showDetails && (
                    <div className="p-4 bg-gray-50">
                      <WorkloadSummaryCard
                        workloadData={memberWorkload}
                        compact={false}
                        onRefresh={refreshUserWorkload}
                        className="border-0 shadow-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* No Results */}
        {!loading && filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No team members found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Loading overlay for workload data */}
      {workloadLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span>Loading workload data...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTeamManagement;
