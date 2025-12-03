import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useWorkload } from '../../contexts/WorkloadContext';
import { WorkloadBadge, WorkloadProgressBar, WorkloadSummaryCard } from '../../components/workload';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const WorkloadAnalytics = () => {
  const { user } = useAuth();
  const {
    teamWorkload,
    userWorkloads,
    availableUsers,
    loading,
    error,
    refreshTeamWorkload,
    loadMultipleUserWorkloads,
    refreshAvailableUsers,
    getTeamWorkloadSummary
  } = useWorkload();

  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [timeRange, setTimeRange] = useState('week'); // week, month, quarter
  const [viewMode, setViewMode] = useState('overview'); // overview, individual, optimization
  const [departments] = useState([
    { id: 'all', name: 'All Departments' },
    { id: 'engineering', name: 'Engineering' },
    { id: 'design', name: 'Design' },
    { id: 'qa', name: 'Quality Assurance' },
    { id: 'product', name: 'Product Management' }
  ]);

  // Mock data for analytics (in real implementation, this would come from API)
  const [analyticsData, setAnalyticsData] = useState({
    utilizationTrend: [],
    departmentComparison: [],
    overloadAlerts: [],
    capacityForecast: [],
    workloadHistory: []
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedDepartment, timeRange]);

  const loadAnalyticsData = async () => {
    try {
      // In real implementation, these would be API calls
      await Promise.all([
        loadWorkloadTrends(),
        loadDepartmentData(),
        loadCapacityData()
      ]);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    }
  };

  const loadWorkloadTrends = async () => {
    // Mock utilization trend data
    const mockTrend = [
      { date: '2025-11-04', avgUtilization: 72, overloadedUsers: 3 },
      { date: '2025-11-05', avgUtilization: 75, overloadedUsers: 4 },
      { date: '2025-11-06', avgUtilization: 68, overloadedUsers: 2 },
      { date: '2025-11-07', avgUtilization: 82, overloadedUsers: 5 },
      { date: '2025-11-08', avgUtilization: 79, overloadedUsers: 4 },
      { date: '2025-11-11', avgUtilization: 71, overloadedUsers: 3 }
    ];

    setAnalyticsData(prev => ({
      ...prev,
      utilizationTrend: mockTrend
    }));
  };

  const loadDepartmentData = async () => {
    // Mock department comparison data
    const mockDepartments = [
      { name: 'Engineering', utilization: 78, capacity: 240, allocated: 187, available: 53 },
      { name: 'Design', utilization: 65, capacity: 80, allocated: 52, available: 28 },
      { name: 'QA', utilization: 85, capacity: 120, allocated: 102, available: 18 },
      { name: 'Product', utilization: 72, capacity: 60, allocated: 43, available: 17 }
    ];

    setAnalyticsData(prev => ({
      ...prev,
      departmentComparison: mockDepartments
    }));
  };

  const loadCapacityData = async () => {
    // Mock overload alerts
    const mockAlerts = [
      {
        userId: 'user-3',
        userName: 'Carol Davis',
        department: 'Design',
        overloadPercentage: 25,
        tasksCount: 8,
        estimatedResolutionDate: '2025-11-20'
      },
      {
        userId: 'user-5',
        userName: 'Emily Chen',
        department: 'Engineering',
        overloadPercentage: 15,
        tasksCount: 6,
        estimatedResolutionDate: '2025-11-18'
      }
    ];

    setAnalyticsData(prev => ({
      ...prev,
      overloadAlerts: mockAlerts
    }));
  };

  // Chart configurations
  const utilizationTrendChart = {
    data: {
      labels: analyticsData.utilizationTrend.map(d =>
        new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'Average Utilization (%)',
          data: analyticsData.utilizationTrend.map(d => d.avgUtilization),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Overloaded Users',
          data: analyticsData.utilizationTrend.map(d => d.overloadedUsers),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        x: {
          display: true,
          title: { display: true, text: 'Date' }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'Utilization (%)' },
          min: 0,
          max: 100
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { display: true, text: 'Overloaded Users' },
          grid: { drawOnChartArea: false }
        }
      }
    }
  };

  const departmentChart = {
    data: {
      labels: analyticsData.departmentComparison.map(d => d.name),
      datasets: [
        {
          label: 'Utilization (%)',
          data: analyticsData.departmentComparison.map(d => d.utilization),
          backgroundColor: analyticsData.departmentComparison.map(d => {
            if (d.utilization > 90) return 'rgba(239, 68, 68, 0.7)';
            if (d.utilization > 75) return 'rgba(245, 158, 11, 0.7)';
            return 'rgba(34, 197, 94, 0.7)';
          }),
          borderColor: analyticsData.departmentComparison.map(d => {
            if (d.utilization > 90) return 'rgb(239, 68, 68)';
            if (d.utilization > 75) return 'rgb(245, 158, 11)';
            return 'rgb(34, 197, 94)';
          }),
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: 'Utilization (%)' }
        }
      }
    }
  };

  const capacityDistributionChart = {
    data: {
      labels: ['Available', 'Busy', 'Overloaded'],
      datasets: [{
        data: [8, 5, 3], // Mock data
        backgroundColor: [
          'rgba(34, 197, 94, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(239, 68, 68, 0.7)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  };

  const teamSummary = getTeamWorkloadSummary();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              Workload Analytics
            </h1>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadAnalyticsData()}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Department Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              {/* Time Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Range
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                </select>
              </div>

              {/* View Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  View Mode
                </label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'individual', label: 'Individual' },
                    { key: 'optimization', label: 'Optimization' }
                  ].map(mode => (
                    <button
                      key={mode.key}
                      onClick={() => setViewMode(mode.key)}
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        viewMode === mode.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Team Members */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-3xl font-bold text-gray-900">16</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+2 this week</span>
            </div>
          </div>

          {/* Average Utilization */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Utilization</p>
                <p className="text-3xl font-bold text-gray-900">74%</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-red-600">-3% from last week</span>
            </div>
          </div>

          {/* Overloaded Users */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overloaded</p>
                <p className="text-3xl font-bold text-red-600">3</p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-600">Requires attention</span>
            </div>
          </div>

          {/* Available Capacity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Hours</p>
                <p className="text-3xl font-bold text-green-600">116h</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-600">This week capacity</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Utilization Trend Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5" />
              Utilization Trend
            </h3>
            <div className="h-64">
              <Line {...utilizationTrendChart} />
            </div>
          </div>

          {/* Department Comparison */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5" />
              Department Comparison
            </h3>
            <div className="h-64">
              <Bar {...departmentChart} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Capacity Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5" />
              Capacity Distribution
            </h3>
            <div className="h-48">
              <Doughnut {...capacityDistributionChart} />
            </div>
          </div>

          {/* Overload Alerts */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              Overload Alerts
            </h3>

            {analyticsData.overloadAlerts.length > 0 ? (
              <div className="space-y-3">
                {analyticsData.overloadAlerts.map((alert, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{alert.userName}</span>
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            {alert.overloadPercentage}% overloaded
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {alert.department} • {alert.tasksCount} active tasks
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <CalendarDaysIcon className="h-4 w-4" />
                          Est. resolution: {new Date(alert.estimatedResolutionDate).toLocaleDateString()}
                        </p>
                      </div>
                      <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700">
                        Optimize
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p>No overload alerts</p>
                <p className="text-sm">All team members are within capacity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkloadAnalytics;
