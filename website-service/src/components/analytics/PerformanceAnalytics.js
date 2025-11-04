import React, { useState, useEffect, useRef } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  TrophyIcon,
  TicketIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
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
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PerformanceAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Performance data state
  const [performanceData, setPerformanceData] = useState({
    overview: null,
    workTimeStats: null,
    projectParticipation: null,
    trends: null
  });

  // Chart refs for export functionality
  const chartRefs = {
    performance: useRef(null),
    workTime: useRef(null),
    projects: useRef(null),
    radar: useRef(null)
  };

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all performance-related data
      const [performanceResponse, workTimeResponse, participationResponse] = await Promise.all([
        apiService.performance.getMyPerformance(),
        apiService.workTime.getMyTimeStats(),
        apiService.projectProgress.getUserParticipation(user?.id)
      ]);

      setPerformanceData({
        overview: performanceResponse.result,
        workTimeStats: workTimeResponse.result,
        projectParticipation: participationResponse.result,
        trends: generateTrendData(performanceResponse.result, workTimeResponse.result)
      });

    } catch (err) {
      console.error('Error loading performance data:', err);
      setError(err.response?.data?.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadPerformanceData();
    setRefreshing(false);
  };

  // Generate trend data from performance and work time data
  const generateTrendData = (performance, workTime) => {
    if (!performance || !workTime) return null;

    return {
      performanceTrends: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
        datasets: [
          {
            label: 'Performance Score',
            data: performance.weeklyScores || [75, 78, 82, 80, 85, 88, 87, 90],
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Task Completion Rate (%)',
            data: performance.completionRates || [85, 88, 90, 87, 92, 95, 93, 96],
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      workTimeDistribution: {
        labels: ['Productive Work', 'Meetings', 'Break Time', 'Training', 'Other'],
        datasets: [{
          data: workTime.distribution || [70, 15, 10, 3, 2],
          backgroundColor: [
            '#10B981', // Green - Productive Work
            '#3B82F6', // Blue - Meetings
            '#F59E0B', // Yellow - Break Time
            '#8B5CF6', // Purple - Training
            '#EF4444'  // Red - Other
          ],
          borderWidth: 2
        }]
      },
      dailyHours: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Work Hours',
            data: workTime.dailyHours || [8.5, 8.2, 8.8, 8.0, 8.5, 4.0, 0],
            backgroundColor: '#3B82F6'
          },
          {
            label: 'Overtime',
            data: workTime.overtime || [0.5, 0.2, 0.8, 0, 0.5, 0, 0],
            backgroundColor: '#EF4444'
          }
        ]
      },
      skillsRadar: {
        labels: ['Technical Skills', 'Communication', 'Problem Solving', 'Teamwork', 'Time Management', 'Creativity'],
        datasets: [{
          label: 'Current Skills',
          data: performance.skills || [85, 78, 90, 88, 82, 75],
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: '#3B82F6',
          borderWidth: 2
        }]
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

    if (type === 'time') {
      return {
        ...baseOptions,
        scales: {
          x: { display: true },
          y: { 
            beginAtZero: true,
            title: { display: true, text: 'Hours' },
            ticks: { callback: (value) => value + 'h' }
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
      link.download = `${filename}.png`;
      link.href = url;
      link.click();
    }
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
              <h3 className="text-sm font-medium text-red-800">Error Loading Performance Data</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-4">
                <button
                  onClick={loadPerformanceData}
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

  const { overview, workTimeStats, projectParticipation, trends } = performanceData;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-600">Track your performance metrics and productivity insights</p>
        </div>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <TicketIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrophyIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overall Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {overview?.overallScore || 0}/100
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tasks Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {overview?.tasksCompleted || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Hours This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {workTimeStats?.monthlyHours || 0}h
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TicketIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Efficiency Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {overview?.efficiencyRate || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Performance Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
            <button
              onClick={() => exportChart(chartRefs.performance, 'performance-trends')}
              className="text-blue-600 hover:text-blue-800"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="h-80">
            {trends?.performanceTrends && (
              <Line 
                ref={chartRefs.performance}
                data={trends.performanceTrends} 
                options={getChartOptions('Weekly Performance Analysis')} 
              />
            )}
          </div>
        </div>

        {/* Work Time Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Time Distribution</h3>
            <button
              onClick={() => exportChart(chartRefs.workTime, 'work-time-distribution')}
              className="text-blue-600 hover:text-blue-800"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="h-80">
            {trends?.workTimeDistribution && (
              <Doughnut 
                ref={chartRefs.workTime}
                data={trends.workTimeDistribution} 
                options={getChartOptions('Daily Time Breakdown')} 
              />
            )}
          </div>
        </div>

        {/* Daily Hours */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Daily Work Hours</h3>
            <button
              onClick={() => exportChart(chartRefs.projects, 'daily-hours')}
              className="text-blue-600 hover:text-blue-800"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="h-80">
            {trends?.dailyHours && (
              <Bar 
                ref={chartRefs.projects}
                data={trends.dailyHours} 
                options={getChartOptions('Weekly Hours Overview', 'time')} 
              />
            )}
          </div>
        </div>

        {/* Skills Radar */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Skills Assessment</h3>
            <button
              onClick={() => exportChart(chartRefs.radar, 'skills-radar')}
              className="text-blue-600 hover:text-blue-800"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="h-80">
            {trends?.skillsRadar && (
              <Radar 
                ref={chartRefs.radar}
                data={trends.skillsRadar} 
                options={getChartOptions('Skills Evaluation')} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Project Participation Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Project Participation History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasks Completed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projectParticipation?.projects?.map((project, index) => (
                <tr key={project.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{project.name}</div>
                    <div className="text-sm text-gray-500">{project.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.tasksCompleted}/{project.totalTasks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            project.performanceScore >= 90 ? 'bg-green-500' :
                            project.performanceScore >= 70 ? 'bg-blue-500' :
                            project.performanceScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${project.performanceScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-700">{project.performanceScore}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      project.status === 'On Hold' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!projectParticipation?.projects || projectParticipation.projects.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              No project participation data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;