import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowPathIcon,
  UserIcon,
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
  TicketIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';
import { useApiNotifications } from '../../hooks/useApiNotifications';

const PerformanceManagement = () => {
  const { user } = useAuth();
  const notify = useApiNotifications();
  
  const [selectedUserId, setSelectedUserId] = useState('');
  const [performanceDetails, setPerformanceDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      // Get team members (you may need to adjust this endpoint based on your API)
      const response = await apiService.getUsers();
      const users = response.result || response || [];
      
      // Filter to show employees only (not other team leads/admins)
      const employees = users.filter(u => 
        u.role === 'EMPLOYEE' || u.role === 'DEVELOPER' || u.role === 'DESIGNER'
      );
      
      setTeamMembers(employees);
    } catch (error) {
      console.error('Failed to load team members:', error);
      notify.error('Failed to load team members');
    }
  };

  const handleUserSelect = async (userId) => {
    setSelectedUserId(userId);
    if (userId) {
      await loadPerformanceDetails(userId);
    } else {
      setPerformanceDetails(null);
    }
  };

  const loadPerformanceDetails = async (userId) => {
    try {
      setLoading(true);
      const response = await apiService.getPerformanceDetails(userId);
      setPerformanceDetails(response.result || response);
    } catch (error) {
      console.error('Failed to load performance details:', error);
      notify.error('Failed to load performance details');
      setPerformanceDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!selectedUserId) return;
    
    try {
      setRecalculating(true);
      await apiService.recalculatePerformanceScore(selectedUserId);
      notify.success('Performance score recalculated successfully');
      
      // Reload the details
      await loadPerformanceDetails(selectedUserId);
    } catch (error) {
      console.error('Failed to recalculate performance score:', error);
      notify.error('Failed to recalculate performance score');
    } finally {
      setRecalculating(false);
    }
  };

  const getPerformanceCategoryColor = (category) => {
    const colors = {
      EXCEPTIONAL: 'text-green-700 bg-green-100 border-green-200',
      HIGH: 'text-blue-700 bg-blue-100 border-blue-200',
      GOOD: 'text-indigo-700 bg-indigo-100 border-indigo-200',
      AVERAGE: 'text-yellow-700 bg-yellow-100 border-yellow-200',
      BELOW_AVERAGE: 'text-orange-700 bg-orange-100 border-orange-200',
      POOR: 'text-red-700 bg-red-100 border-red-200',
      NOT_EVALUATED: 'text-gray-700 bg-gray-100 border-gray-200'
    };
    return colors[category] || colors.NOT_EVALUATED;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-indigo-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredTeamMembers = teamMembers.filter(member =>
    member.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if user has permission to view performance data
  const canViewPerformance = user.role === 'TEAM_LEAD' || user.role === 'PROJECT_MANAGER' || user.role === 'ADMIN';

  if (!canViewPerformance) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">You don't have permission to view performance management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <ChartBarIcon className="h-8 w-8 mr-3" />
            Performance Management
          </h1>
          <p className="text-gray-600 mt-2">
            View and manage team member performance scores and metrics
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Team Member Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Select Team Member
            </h2>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Team Member List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredTeamMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleUserSelect(member.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedUserId === member.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{member.firstName} {member.lastName}</div>
                  <div className="text-sm text-gray-500">{member.email}</div>
                  <div className="text-xs text-gray-400 capitalize">{member.role?.toLowerCase()}</div>
                </button>
              ))}
            </div>

            {filteredTeamMembers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <UserIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No team members found</p>
              </div>
            )}
          </div>

          {/* Performance Details */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            {!selectedUserId ? (
              <div className="text-center py-12 text-gray-500">
                <ChartBarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Team Member</h3>
                <p>Choose a team member from the list to view their performance details</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading performance data...</p>
              </div>
            ) : performanceDetails ? (
              <div className="space-y-6">
                {/* Header with Recalculate Button */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {performanceDetails.userName}
                    </h2>
                    <p className="text-gray-600">{performanceDetails.userEmail}</p>
                  </div>
                  <button
                    onClick={handleRecalculate}
                    disabled={recalculating}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <ArrowPathIcon className={`h-4 w-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
                    {recalculating ? 'Recalculating...' : 'Recalculate'}
                  </button>
                </div>

                {/* Overall Performance Score */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Overall Performance Score</h3>
                      <p className="text-sm text-gray-600">Weighted average of all performance metrics</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${getScoreColor(performanceDetails.performanceScore)}`}>
                        {performanceDetails.performanceScore?.toFixed(1) || 'N/A'}
                      </div>
                      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${
                        getPerformanceCategoryColor(performanceDetails.performanceCategory)
                      }`}>
                        {performanceDetails.performanceCategory?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Component Scores */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <StarIcon className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-800">Quality</span>
                    </div>
                    <div className="text-2xl font-bold text-green-700 mt-1">
                      {performanceDetails.qualityScore?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-xs text-green-600">out of 5.0</div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-800">Timeliness</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700 mt-1">
                      {performanceDetails.timelinessScore?.toFixed(1) || 'N/A'}%
                    </div>
                    <div className="text-xs text-blue-600">on-time completion</div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="text-sm font-medium text-purple-800">Completion</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-700 mt-1">
                      {performanceDetails.completionRate?.toFixed(1) || 'N/A'}%
                    </div>
                    <div className="text-xs text-purple-600">tasks completed</div>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <TicketIcon className="h-5 w-5 text-orange-600 mr-2" />
                      <span className="text-sm font-medium text-orange-800">Efficiency</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-700 mt-1">
                      {performanceDetails.efficiencyScore?.toFixed(1) || 'N/A'}%
                    </div>
                    <div className="text-xs text-orange-600">time efficiency</div>
                  </div>
                </div>

                {/* Task Statistics */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Task Statistics</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {performanceDetails.totalTasksAssigned || 0}
                      </div>
                      <div className="text-sm text-gray-600">Tasks Assigned</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {performanceDetails.totalTasksCompleted || 0}
                      </div>
                      <div className="text-sm text-gray-600">Tasks Completed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {performanceDetails.totalTasksOnTime || 0}
                      </div>
                      <div className="text-sm text-gray-600">On-Time Completions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {performanceDetails.totalActualHours?.toFixed(1) || 0}h
                      </div>
                      <div className="text-sm text-gray-600">Total Hours Worked</div>
                    </div>
                  </div>
                </div>

                {/* Strengths and Improvements */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-green-900 mb-3 flex items-center">
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Strength Areas
                    </h4>
                    {performanceDetails.strengthAreas?.length > 0 ? (
                      <ul className="space-y-2">
                        {performanceDetails.strengthAreas.map((strength, index) => (
                          <li key={index} className="flex items-center text-sm text-green-800">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-green-700">Need more task data to identify strengths</p>
                    )}
                  </div>

                  {/* Improvement Areas */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-orange-900 mb-3 flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                      Improvement Areas
                    </h4>
                    {performanceDetails.improvementAreas?.length > 0 ? (
                      <ul className="space-y-2">
                        {performanceDetails.improvementAreas.map((improvement, index) => (
                          <li key={index} className="flex items-center text-sm text-orange-800">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-orange-700">No significant improvement areas identified</p>
                    )}
                  </div>
                </div>

                {/* Last Updated */}
                <div className="text-center pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-center text-sm text-gray-500">
                    <InformationCircleIcon className="h-4 w-4 mr-1" />
                    Last updated: {performanceDetails.lastPerformanceUpdate 
                      ? new Date(performanceDetails.lastPerformanceUpdate).toLocaleString()
                      : 'Never'
                    }
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data</h3>
                <p>Performance data could not be loaded for this user</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceManagement;