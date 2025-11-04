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
        // Add more users as needed
      ];

      setAllUsers(mockUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadTeamMembers = async (projectId) => {
    try {
      setLoading(true);
      // Simulate API call to /project-members/projects/{projectId}
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockMembers = [
        {
          id: 'pm-1',
          userId: 'user-1',
          projectId: projectId,
          role: 'LEAD',
          joinedDate: '2024-09-01',
          user: {
            name: 'John Smith',
            email: 'john.smith@company.com',
            phone: '+1 (555) 123-4567',
            department: 'Engineering',
            skills: ['React Native', 'Node.js', 'Team Leadership'],
            experienceLevel: 'Senior',
            avatar: null
          },
          performance: {
            tasksCompleted: 15,
            tasksAssigned: 18,
            efficiency: 85,
            qualityScore: 92
          }
        },
        {
          id: 'pm-2',
          userId: 'user-2',
          projectId: projectId,
          role: 'DEVELOPER',
          joinedDate: '2024-09-05',
          user: {
            name: 'Sarah Johnson',
            email: 'sarah.johnson@company.com',
            phone: '+1 (555) 234-5678',
            department: 'Frontend',
            skills: ['React', 'JavaScript', 'CSS'],
            experienceLevel: 'Mid-Level',
            avatar: null
          },
          performance: {
            tasksCompleted: 12,
            tasksAssigned: 15,
            efficiency: 80,
            qualityScore: 88
          }
        },
        {
          id: 'pm-3',
          userId: 'user-3',
          projectId: projectId,
          role: 'DESIGNER',
          joinedDate: '2024-09-10',
          user: {
            name: 'Mike Chen',
            email: 'mike.chen@company.com',
            phone: '+1 (555) 345-6789',
            department: 'Design',
            skills: ['UI/UX', 'Figma', 'Prototyping'],
            experienceLevel: 'Senior',
            avatar: null
          },
          performance: {
            tasksCompleted: 8,
            tasksAssigned: 10,
            efficiency: 90,
            qualityScore: 95
          }
        },
        {
          id: 'pm-4',
          userId: 'user-4',
          projectId: projectId,
          role: 'TESTER',
          joinedDate: '2024-09-15',
          user: {
            name: 'Emily Davis',
            email: 'emily.davis@company.com',
            phone: '+1 (555) 456-7890',
            department: 'QA',
            skills: ['Test Automation', 'Selenium', 'API Testing'],
            experienceLevel: 'Mid-Level',
            avatar: null
          },
          performance: {
            tasksCompleted: 20,
            tasksAssigned: 22,
            efficiency: 95,
            qualityScore: 89
          }
        }
      ];

      setTeamMembers(mockMembers);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load team members:', error);
      setLoading(false);
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.user.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
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
        console.log('Removing member:', member.userId, 'from project:', selectedProject);
        
        // Update local state
        setTeamMembers(teamMembers.filter(m => m.id !== member.id));
      } catch (error) {
        console.error('Failed to remove member:', error);
      }
    }
  };

  const handleUpdateMemberRole = async (member, newRole) => {
    try {
      // API call to PUT /project-members/projects/{projectId}/users/{userId}
      console.log('Updating member role:', member.userId, 'to:', newRole);
      
      // Update local state
      setTeamMembers(teamMembers.map(m => 
        m.id === member.id ? { ...m, role: newRole } : m
      ));
    } catch (error) {
      console.error('Failed to update member role:', error);
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
                  {teamMembers.filter(m => m.role === 'LEAD').length}
                </div>
                <div className="text-gray-600">Team Leads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(teamMembers.reduce((acc, m) => acc + m.performance.efficiency, 0) / teamMembers.length || 0)}%
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
          {filteredMembers.map((member) => (
            <div key={member.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
              {/* Member Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {member.user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{member.user.name}</h3>
                    <p className="text-sm text-gray-600">{member.user.department}</p>
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
                  {member.user.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  {member.user.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarDaysIcon className="h-4 w-4 mr-2" />
                  Joined {new Date(member.joinedDate).toLocaleDateString()}
                </div>
              </div>

              {/* Experience Level */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Experience</span>
                  <span className={`font-medium ${getExperienceColor(member.user.experienceLevel)}`}>
                    {member.user.experienceLevel}
                  </span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tasks Completed</span>
                  <span className="text-sm font-medium">
                    {member.performance.tasksCompleted}/{member.performance.tasksAssigned}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Efficiency</span>
                  <span className={`text-sm font-medium ${getPerformanceColor(member.performance.efficiency)}`}>
                    {member.performance.efficiency}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Quality Score</span>
                  <div className="flex items-center">
                    <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className={`text-sm font-medium ${getPerformanceColor(member.performance.qualityScore)}`}>
                      {member.performance.qualityScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Skills */}
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
          ))}
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