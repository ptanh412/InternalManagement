import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CalendarIcon,
  TrendingUpIcon,
  ClockIcon,
  UsersIcon,
  BriefcaseIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { apiService } from '../../services/apiService';

const AdminAnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    projectTimeline: [],
    userGrowth: [],
    projectStatus: [],
    departmentStats: [],
    workloadDistribution: []
  });

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Generate mock timeline data based on time range
      const timelineData = generateTimelineData(timeRange);
      
      // Load project analytics
      const projectAnalytics = await apiService.getProjectAnalytics().catch(() => ({ result: {} }));
      const projects = await apiService.getProjects().catch(() => ({ result: [] }));
      const users = await apiService.admin.getAllUsers().catch(() => ({ result: [] }));
      
      // Process project status data
      const projectsByStatus = (projects.result || []).reduce((acc, project) => {
        acc[project.status] = (acc[project.status] || 0) + 1;
        return acc;
      }, {});

      const statusData = Object.entries(projectsByStatus).map(([status, count]) => ({
        name: status.replace('_', ' '),
        value: count,
        color: getStatusColor(status)
      }));

      // Generate department statistics
      const departmentData = generateDepartmentStats(projects.result || []);
      
      // Generate workload distribution
      const workloadData = generateWorkloadData(users.result || [], projects.result || []);

      setAnalyticsData({
        projectTimeline: timelineData,
        userGrowth: generateUserGrowthData(timeRange),
        projectStatus: statusData,
        departmentStats: departmentData,
        workloadDistribution: workloadData
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTimelineData = (range) => {
    const now = new Date();
    const data = [];

    if (range === 'week') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          fullDate: date.toISOString().split('T')[0],
          projects: Math.floor(Math.random() * 10) + 5,
          completed: Math.floor(Math.random() * 5) + 2,
          active: Math.floor(Math.random() * 8) + 3
        });
      }
    } else if (range === 'month') {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        data.push({
          date: date.getDate().toString(),
          fullDate: date.toISOString().split('T')[0],
          projects: Math.floor(Math.random() * 15) + 10,
          completed: Math.floor(Math.random() * 8) + 5,
          active: Math.floor(Math.random() * 12) + 8
        });
      }
    } else if (range === 'year') {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short' }),
          fullDate: date.toISOString().split('T')[0].substring(0, 7),
          projects: Math.floor(Math.random() * 50) + 30,
          completed: Math.floor(Math.random() * 25) + 15,
          active: Math.floor(Math.random() * 30) + 20
        });
      }
    }

    return data;
  };

  const generateUserGrowthData = (range) => {
    const data = [];
    const now = new Date();

    if (range === 'week') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          newUsers: Math.floor(Math.random() * 5) + 2,
          totalUsers: 150 + (6 - i) * 3
        });
      }
    } else if (range === 'month') {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        data.push({
          date: date.getDate().toString(),
          newUsers: Math.floor(Math.random() * 3) + 1,
          totalUsers: 120 + (29 - i) * 2
        });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short' }),
          newUsers: Math.floor(Math.random() * 15) + 10,
          totalUsers: 100 + (11 - i) * 15
        });
      }
    }

    return data;
  };

  const generateDepartmentStats = (projects) => {
    const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
    return departments.map(dept => ({
      department: dept,
      projects: Math.floor(Math.random() * 20) + 5,
      members: Math.floor(Math.random() * 30) + 10,
      efficiency: Math.floor(Math.random() * 30) + 70
    }));
  };

  const generateWorkloadData = (users, projects) => {
    return users.slice(0, 10).map((user, index) => ({
      name: user.firstName || `User ${index + 1}`,
      tasks: Math.floor(Math.random() * 15) + 5,
      completed: Math.floor(Math.random() * 10) + 3,
      efficiency: Math.floor(Math.random() * 30) + 70
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      'PLANNING': '#3B82F6',
      'IN_PROGRESS': '#F59E0B',
      'COMPLETED': '#10B981',
      'ON_HOLD': '#EF4444',
      'CANCELLED': '#6B7280'
    };
    return colors[status] || '#6B7280';
  };

  const timeRanges = [
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'year', label: 'Last 12 Months' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Comprehensive project and user analytics with timeline visualization
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-field"
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <button
            onClick={loadAnalytics}
            className="btn-secondary flex items-center space-x-2"
          >
            <ClockIcon className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BriefcaseIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.projectTimeline.reduce((sum, item) => sum + item.projects, 0)}
              </p>
              <p className="text-sm text-gray-500">Total Projects</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.projectTimeline.reduce((sum, item) => sum + item.completed, 0)}
              </p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUpIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.projectTimeline.reduce((sum, item) => sum + item.active, 0)}
              </p>
              <p className="text-sm text-gray-500">Active Projects</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.userGrowth.length > 0 ? 
                  analyticsData.userGrowth[analyticsData.userGrowth.length - 1].totalUsers : 0}
              </p>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Project Timeline Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Project Timeline - {timeRanges.find(r => r.value === timeRange)?.label}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.projectTimeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="projects" 
                stackId="1"
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.6}
                name="Total Projects"
              />
              <Area 
                type="monotone" 
                dataKey="completed" 
                stackId="2"
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.6}
                name="Completed"
              />
              <Area 
                type="monotone" 
                dataKey="active" 
                stackId="3"
                stroke="#F59E0B" 
                fill="#F59E0B" 
                fillOpacity={0.6}
                name="Active"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="totalUsers" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                name="Total Users"
              />
              <Line 
                type="monotone" 
                dataKey="newUsers" 
                stroke="#06B6D4" 
                strokeWidth={2}
                name="New Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Project Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Project Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.projectStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analyticsData.projectStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Department Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Department Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.departmentStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="projects" fill="#3B82F6" name="Projects" />
              <Bar dataKey="members" fill="#10B981" name="Members" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Workload Distribution Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Top Performers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Efficiency
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analyticsData.workloadDistribution.map((user, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.tasks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.completed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${user.efficiency}%` }}
                        ></div>
                      </div>
                      {user.efficiency}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboard;