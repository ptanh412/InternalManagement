import React, { useState, useEffect, useRef } from 'react';
import {
  UsersIcon,
  ChartBarIcon,
  ClockIcon,
  TicketIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TeamPerformanceAnalytics = ({ teamId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  
  // Team analytics data state
  const [teamData, setTeamData] = useState({
    productivity: null,
    memberReports: [],
    workTimeStats: null,
    departmentStats: null,
    trends: null
  });

  // Chart refs
  const chartRefs = {
    productivity: useRef(null),
    performance: useRef(null),
    workload: useRef(null),
    efficiency: useRef(null)
  };

  useEffect(() => {
    if (teamId || user?.teamId) {
      loadTeamAnalytics();
    }
  }, [teamId, user?.teamId]);

  const loadTeamAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentTeamId = teamId || user?.teamId;
      
      // Fetch team-related analytics data
      const [
        productivityResponse,
        departmentResponse,
        workTimeResponse
      ] = await Promise.all([
        apiService.workTime.getTeamProductivity(currentTeamId),
        apiService.performance.getDepartmentReports(user?.departmentId),
        apiService.workTime.getDepartmentStats(user?.departmentId)
      ]);

      // Get individual team member reports
      const memberIds = productivityResponse.result?.members?.map(m => m.userId) || [];
      const memberReportsResponse = memberIds.length > 0 
        ? await apiService.performance.getBatchReports(memberIds)
        : { result: [] };

      setTeamData({
        productivity: productivityResponse.result,
        memberReports: memberReportsResponse.result || [],
        workTimeStats: workTimeResponse.result,
        departmentStats: departmentResponse.result,
        trends: generateTeamTrendData(productivityResponse.result, workTimeResponse.result)
      });

    } catch (err) {
      console.error('Error loading team analytics:', err);
      setError(err.response?.data?.message || 'Failed to load team analytics data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadTeamAnalytics();
    setRefreshing(false);
  };

  // Generate trend data for team analytics
  const generateTeamTrendData = (productivity, workTime) => {
    if (!productivity || !workTime) return null;

    return {
      teamProductivity: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
        datasets: [
          {
            label: 'Team Productivity Score',
            data: productivity.weeklyScores || [75, 78, 82, 85, 88, 90, 87, 92],
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Task Completion Rate (%)',
            data: productivity.completionRates || [82, 85, 88, 90, 92, 94, 91, 96],
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      memberComparison: {
        labels: productivity.members?.map(m => m.name) || ['Member 1', 'Member 2', 'Member 3', 'Member 4', 'Member 5'],
        datasets: [
          {
            label: 'Performance Score',
            data: productivity.members?.map(m => m.performanceScore) || [88, 92, 85, 90, 87],
            backgroundColor: '#10B981'
          },
          {
            label: 'Tasks Completed',
            data: productivity.members?.map(m => m.tasksCompleted) || [24, 28, 22, 26, 23],
            backgroundColor: '#3B82F6'
          }
        ]
      },
      workloadDistribution: {
        labels: workTime.categories || ['Development', 'Testing', 'Meetings', 'Documentation', 'Training'],
        datasets: [{
          data: workTime.distribution || [45, 25, 15, 10, 5],
          backgroundColor: [
            '#10B981', // Development
            '#3B82F6', // Testing
            '#F59E0B', // Meetings
            '#8B5CF6', // Documentation
            '#EF4444'  // Training
          ]
        }]
      },
      efficiencyTrends: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [
          {
            label: 'Team Efficiency %',
            data: productivity.dailyEfficiency || [85, 88, 90, 87, 89],
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      }
    };
  };

  // Chart options
  const getChartOptions = (title, type = 'default') => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: title, font: { size: 14, weight: 'bold' }},
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white'
        }
      }
    };

    if (type === 'percentage') {
      return {
        ...baseOptions,
        scales: {
          x: { display: true },
          y: { 
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Percentage (%)' },
            ticks: { callback: (value) => value + '%' }
          }
        }
      };
    }

    return baseOptions;
  };

  // Export chart function
  const exportChart = (chartRef, filename) => {
    if (chartRef.current) {
      const canvas = chartRef.current.canvas;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `team-${filename}.png`;
      link.href = url;
      link.click();
    }
  };

  // View individual member details
  const viewMemberDetails = (member) => {
    setSelectedMember(member);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Team Analytics</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-4">
                <button
                  onClick={loadTeamAnalytics}
                  className="bg-red-100 px-3 py-2 rounded-md text-red-800 hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { productivity, memberReports, workTimeStats, trends } = teamData;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Performance Analytics</h1>
          <p className="text-gray-600">Monitor and analyze your team's performance metrics</p>
        </div>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <XMarkIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Team Members</p>
              <p className="text-2xl font-bold text-gray-900">
                {productivity?.totalMembers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Performance</p>
              <p className="text-2xl font-bold text-gray-900">
                {productivity?.averageScore || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">
                {workTimeStats?.totalHours || 0}h
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TicketIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Team Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">
                {productivity?.efficiency || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Team Productivity Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Team Productivity Trends</h3>
            <button
              onClick={() => exportChart(chartRefs.productivity, 'productivity-trends')}
              className="text-blue-600 hover:text-blue-800"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="h-80">
            {trends?.teamProductivity && (
              <Line 
                ref={chartRefs.productivity}
                data={trends.teamProductivity} 
                options={getChartOptions('Weekly Team Performance', 'percentage')} 
              />
            )}
          </div>
        </div>

        {/* Member Performance Comparison */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Member Performance</h3>
            <button
              onClick={() => exportChart(chartRefs.performance, 'member-performance')}
              className="text-blue-600 hover:text-blue-800"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="h-80">
            {trends?.memberComparison && (
              <Bar 
                ref={chartRefs.performance}
                data={trends.memberComparison} 
                options={getChartOptions('Individual Performance Comparison')} 
              />
            )}
          </div>
        </div>

        {/* Workload Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Workload Distribution</h3>
            <button
              onClick={() => exportChart(chartRefs.workload, 'workload-distribution')}
              className="text-blue-600 hover:text-blue-800"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="h-80">
            {trends?.workloadDistribution && (
              <Doughnut 
                ref={chartRefs.workload}
                data={trends.workloadDistribution} 
                options={getChartOptions('Team Workload Breakdown')} 
              />
            )}
          </div>
        </div>

        {/* Efficiency Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Efficiency</h3>
            <button
              onClick={() => exportChart(chartRefs.efficiency, 'efficiency-trends')}
              className="text-blue-600 hover:text-blue-800"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="h-80">
            {trends?.efficiencyTrends && (
              <Line 
                ref={chartRefs.efficiency}
                data={trends.efficiencyTrends} 
                options={getChartOptions('Daily Efficiency Trends', 'percentage')} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Team Members Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasks Completed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours This Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {memberReports.map((member, index) => (
                <tr key={member.userId || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
                          {member.name?.charAt(0) || 'U'}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.tasksCompleted}/{member.totalTasks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            member.performanceScore >= 90 ? 'bg-green-500' :
                            member.performanceScore >= 70 ? 'bg-blue-500' :
                            member.performanceScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${member.performanceScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-700">{member.performanceScore}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.monthlyHours}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.efficiency}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => viewMemberDetails(member)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {memberReports.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No team member data available
            </div>
          )}
        </div>
      </div>

      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center">
                {selectedMember.name} Performance Details
              </h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Performance Score</label>
                  <p className="text-lg font-semibold">{selectedMember.performanceScore}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tasks Completed</label>
                  <p className="text-lg font-semibold">{selectedMember.tasksCompleted}/{selectedMember.totalTasks}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Monthly Hours</label>
                  <p className="text-lg font-semibold">{selectedMember.monthlyHours}h</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Efficiency Rate</label>
                  <p className="text-lg font-semibold">{selectedMember.efficiency}%</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPerformanceAnalytics;