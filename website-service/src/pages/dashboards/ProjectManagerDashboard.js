import React, { useState, useEffect, useRef } from 'react';
import { 
  ChartBarIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  ClockIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  EyeIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
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

const ProjectManagerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeProjects: 0,
    teamMembers: 0,
    completedTasks: 0,
    pendingTasks: 0,
    upcomingDeadlines: 0,
    budgetUtilization: 0
  });
  const [projects, setProjects] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chart state and refs
  const [chartData, setChartData] = useState({
    projectCompletion: null,
    statusDistribution: null,
    budgetAnalysis: null,
    teamPerformanceChart: null,
    projectTimeline: null,
    resourceAllocation: null
  });

  const chartRefs = {
    completion: useRef(null),
    status: useRef(null),
    budget: useRef(null),
    performance: useRef(null),
    timeline: useRef(null),
    resources: useRef(null)
  };

  useEffect(() => {
    loadProjectManagerData();
  }, []);

  const loadProjectManagerData = async () => {
    try {
      // Simulate API calls for project manager data
      setTimeout(() => {
        setStats({
          activeProjects: 12,
          teamMembers: 45,
          completedTasks: 89,
          pendingTasks: 34,
          upcomingDeadlines: 7,
          budgetUtilization: 73.5
        });

        setProjects([
          {
            id: 1,
            name: 'Mobile App Redesign',
            status: 'In Progress',
            progress: 67,
            dueDate: '2024-11-15',
            teamSize: 8,
            budget: '$125,000'
          },
          {
            id: 2,
            name: 'Website Migration',
            status: 'Planning',
            progress: 23,
            dueDate: '2024-12-01',
            teamSize: 6,
            budget: '$85,000'
          },
          {
            id: 3,
            name: 'API Integration',
            status: 'In Progress',
            progress: 45,
            dueDate: '2024-10-30',
            teamSize: 4,
            budget: '$65,000'
          },
          {
            id: 4,
            name: 'Security Audit',
            status: 'Review',
            progress: 91,
            dueDate: '2024-10-25',
            teamSize: 3,
            budget: '$45,000'
          }
        ]);

        setRecentActivities([
          {
            id: 1,
            project: 'Mobile App Redesign',
            action: 'Task "User Authentication" completed',
            user: 'John Doe',
            timestamp: '10 minutes ago'
          },
          {
            id: 2,
            project: 'Website Migration',
            action: 'New milestone "Database Setup" added',
            user: 'Sarah Johnson',
            timestamp: '1 hour ago'
          },
          {
            id: 3,
            project: 'API Integration',
            action: 'Bug reported in payment module',
            user: 'Mike Chen',
            timestamp: '2 hours ago'
          },
          {
            id: 4,
            project: 'Security Audit',
            action: 'Review meeting scheduled',
            user: 'Emily Davis',
            timestamp: '3 hours ago'
          }
        ]);

        setTeamPerformance([
          { name: 'Development Team', efficiency: 87, tasks: 45 },
          { name: 'Design Team', efficiency: 92, tasks: 23 },
          { name: 'QA Team', efficiency: 78, tasks: 31 },
          { name: 'DevOps Team', efficiency: 85, tasks: 18 }
        ]);

        // Initialize chart data after loading base data
        initializeChartData();
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load project manager data:', error);
      setLoading(false);
    }
  };

  // Initialize chart data
  const initializeChartData = () => {
    // 1. Project Completion Rate Chart
    const projectCompletionData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Projects Completed',
          data: [2, 4, 3, 5, 7, 6, 8, 9, 7, 10, 8, 12],
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Projects Started',
          data: [3, 5, 4, 6, 8, 7, 9, 10, 8, 11, 9, 13],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };

    // 2. Project Status Distribution
    const statusDistributionData = {
      labels: ['Completed', 'In Progress', 'Planning', 'On Hold', 'Review'],
      datasets: [{
        data: [45, 30, 15, 5, 5],
        backgroundColor: [
          '#10B981', // Green - Completed
          '#3B82F6', // Blue - In Progress  
          '#F59E0B', // Yellow - Planning
          '#EF4444', // Red - On Hold
          '#8B5CF6'  // Purple - Review
        ],
        borderWidth: 2,
        hoverOffset: 4
      }]
    };

    // 3. Budget Analysis (using existing project data)
    const budgetAnalysisData = {
      labels: ['Mobile App', 'Website Migration', 'API Integration', 'Security Audit', 'Data Analytics', 'Cloud Migration'],
      datasets: [
        {
          label: 'Budget ($K)',
          data: [125, 85, 65, 45, 95, 110],
          backgroundColor: '#E5E7EB',
          borderColor: '#9CA3AF',
          borderWidth: 1
        },
        {
          label: 'Actual Cost ($K)',
          data: [115, 82, 68, 43, 89, 105],
          backgroundColor: '#3B82F6',
          borderColor: '#1D4ED8',
          borderWidth: 1
        }
      ]
    };

    // 4. Team Performance Metrics
    const teamPerformanceChartData = {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
      datasets: [
        {
          label: 'Task Completion Rate (%)',
          data: [78, 82, 85, 80, 88, 91, 87, 93],
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          yAxisID: 'y',
          tension: 0.3
        },
        {
          label: 'Team Productivity Score',
          data: [75, 79, 83, 77, 85, 88, 84, 90],
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          yAxisID: 'y',
          tension: 0.3
        },
        {
          label: 'Average Hours/Task',
          data: [8.5, 7.8, 7.2, 8.0, 6.9, 6.5, 7.1, 6.2],
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          yAxisID: 'y1',
          tension: 0.3
        }
      ]
    };

    // 5. Project Timeline Progress (using existing project data)
    const projectTimelineData = {
      labels: ['Mobile App Redesign', 'Website Migration', 'API Integration', 'Security Audit', 'Data Analytics', 'Cloud Migration'],
      datasets: [{
        label: 'Progress %',
        data: [67, 23, 45, 91, 34, 12],
        backgroundColor: [
          '#10B981', // Green - 67% (>50%)
          '#F59E0B', // Yellow - 23% (20-50%)
          '#3B82F6', // Blue - 45% (20-50%)
          '#10B981', // Green - 91% (>80%)
          '#F59E0B', // Yellow - 34% (20-50%)
          '#EF4444'  // Red - 12% (<20%)
        ],
        borderRadius: 4,
        borderSkipped: false
      }]
    };

    // 6. Resource Allocation
    const resourceAllocationData = {
      labels: ['Development', 'Design', 'QA', 'DevOps', 'Management'],
      datasets: [
        {
          label: 'Allocated Hours',
          data: [320, 180, 120, 80, 60],
          backgroundColor: '#3B82F6'
        },
        {
          label: 'Utilized Hours', 
          data: [295, 165, 110, 75, 55],
          backgroundColor: '#10B981'
        },
        {
          label: 'Overtime Hours',
          data: [25, 15, 8, 5, 3],
          backgroundColor: '#EF4444'
        }
      ]
    };

    setChartData({
      projectCompletion: projectCompletionData,
      statusDistribution: statusDistributionData,
      budgetAnalysis: budgetAnalysisData,
      teamPerformanceChart: teamPerformanceChartData,
      projectTimeline: projectTimelineData,
      resourceAllocation: resourceAllocationData
    });
  };

  // Chart options configurations
  const getChartOptions = (title, type = 'default') => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: title,
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: '#3B82F6',
          borderWidth: 1
        }
      }
    };

    if (type === 'multiAxis') {
      return {
        ...baseOptions,
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Time Period'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Percentage (%)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Hours'
            },
            grid: {
              drawOnChartArea: false,
            },
          }
        }
      };
    }

    if (type === 'horizontal') {
      return {
        ...baseOptions,
        indexAxis: 'y',
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Progress (%)'
            }
          }
        }
      };
    }

    if (type === 'currency') {
      return {
        ...baseOptions,
        scales: {
          x: {
            display: true
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value + 'K';
              }
            },
            title: {
              display: true,
              text: 'Amount ($K)'
            }
          }
        }
      };
    }

    return baseOptions;
  };

  // Export chart as image
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

  const managerStats = [
    {
      name: 'Active Projects',
      value: stats.activeProjects,
      icon: FolderIcon,
      color: 'bg-blue-500',
      change: '+2',
      changeType: 'positive'
    },
    {
      name: 'Team Members',
      value: stats.teamMembers,
      icon: UsersIcon,
      color: 'bg-green-500',
      change: '+5',
      changeType: 'positive'
    },
    {
      name: 'Completed Tasks',
      value: stats.completedTasks,
      icon: CheckCircleIcon,
      color: 'bg-emerald-500',
      change: '+12',
      changeType: 'positive'
    },
    {
      name: 'Pending Tasks',
      value: stats.pendingTasks,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      change: '-8',
      changeType: 'positive'
    },
    {
      name: 'Upcoming Deadlines',
      value: stats.upcomingDeadlines,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      change: '+2',
      changeType: 'negative'
    },
    {
      name: 'Budget Used',
      value: `${stats.budgetUtilization}%`,
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      change: '+5.2%',
      changeType: 'neutral'
    }
  ];

  const getProjectStatus = (status) => {
    switch (status) {
      case 'Completed':
        return 'text-green-600 bg-green-100';
      case 'In Progress':
        return 'text-blue-600 bg-blue-100';
      case 'Planning':
        return 'text-yellow-600 bg-yellow-100';
      case 'Review':
        return 'text-purple-600 bg-purple-100';
      case 'On Hold':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
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
          <h1 className="text-3xl font-bold text-gray-900">
            Project Manager Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.name}! Here's your project overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {managerStats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div key={stat.name} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className={`p-3 rounded-md ${stat.color}`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-600">
                      {stat.name}
                    </p>
                    <div className="flex items-center">
                      <p className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </p>
                      <span className={`ml-2 text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-green-600' : 
                        stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          
          {/* Project Completion Rate Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Project Completion Rate</h3>
              <button
                onClick={() => exportChart(chartRefs.completion, 'project-completion-rate')}
                className="text-blue-600 hover:text-blue-800"
                title="Export Chart"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="h-80">
              {chartData.projectCompletion && (
                <Line 
                  ref={chartRefs.completion}
                  data={chartData.projectCompletion} 
                  options={getChartOptions('Monthly Project Completion Trends')} 
                />
              )}
            </div>
          </div>

          {/* Project Status Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Status Distribution</h3>
              <button
                onClick={() => exportChart(chartRefs.status, 'status-distribution')}
                className="text-blue-600 hover:text-blue-800"
                title="Export Chart"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="h-80">
              {chartData.statusDistribution && (
                <Doughnut 
                  ref={chartRefs.status}
                  data={chartData.statusDistribution} 
                  options={getChartOptions('Project Status Overview')} 
                />
              )}
            </div>
          </div>

          {/* Budget Analysis */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Budget vs Actual Cost</h3>
              <button
                onClick={() => exportChart(chartRefs.budget, 'budget-analysis')}
                className="text-blue-600 hover:text-blue-800"
                title="Export Chart"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="h-80">
              {chartData.budgetAnalysis && (
                <Bar 
                  ref={chartRefs.budget}
                  data={chartData.budgetAnalysis} 
                  options={getChartOptions('Budget Performance Analysis', 'currency')} 
                />
              )}
            </div>
          </div>

          {/* Team Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Team Performance</h3>
              <button
                onClick={() => exportChart(chartRefs.performance, 'team-performance')}
                className="text-blue-600 hover:text-blue-800"
                title="Export Chart"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="h-80">
              {chartData.teamPerformanceChart && (
                <Line 
                  ref={chartRefs.performance}
                  data={chartData.teamPerformanceChart} 
                  options={getChartOptions('Weekly Team Performance Metrics', 'multiAxis')} 
                />
              )}
            </div>
          </div>

          {/* Project Timeline */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Project Progress Timeline</h3>
              <button
                onClick={() => exportChart(chartRefs.timeline, 'project-timeline')}
                className="text-blue-600 hover:text-blue-800"
                title="Export Chart"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="h-80">
              {chartData.projectTimeline && (
                <Bar 
                  ref={chartRefs.timeline}
                  data={chartData.projectTimeline} 
                  options={getChartOptions('Current Project Progress', 'horizontal')} 
                />
              )}
            </div>
          </div>

          {/* Resource Allocation */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Resource Allocation</h3>
              <button
                onClick={() => exportChart(chartRefs.resources, 'resource-allocation')}
                className="text-blue-600 hover:text-blue-800"
                title="Export Chart"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="h-80">
              {chartData.resourceAllocation && (
                <Bar 
                  ref={chartRefs.resources}
                  data={chartData.resourceAllocation} 
                  options={getChartOptions('Department Resource Distribution')} 
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Projects */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Active Projects
                </h2>
                <button className="btn-primary flex items-center">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Project
                </button>
              </div>
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {project.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getProjectStatus(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(project.progress)}`}
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <UsersIcon className="h-4 w-4 mr-1" />
                          {project.teamSize} members
                        </span>
                        <span className="flex items-center">
                          <CalendarDaysIcon className="h-4 w-4 mr-1" />
                          Due: {new Date(project.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {project.budget}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Team Performance */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Team Performance
                </h2>
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {teamPerformance.map((team) => (
                  <div key={team.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {team.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {team.efficiency}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div 
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${team.efficiency}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">{team.tasks} active tasks</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Recent Activities
                </h2>
                <EyeIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="border-l-4 border-primary-500 pl-4 py-2">
                    <h3 className="text-sm font-medium text-gray-900">
                      {activity.project}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      by {activity.user} • {activity.timestamp}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <button className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                  View all activities →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {/* <div className="mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <button 
                onClick={() => window.location.href = '/project-manager/projects'}
                className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200"
              >
                <FolderIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Manage Projects</span>
              </button>
              <button 
                onClick={() => window.location.href = '/project-manager/tasks'}
                className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200"
              >
                <DocumentTextIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Task Management</span>
              </button>
              <button 
                onClick={() => window.location.href = '/project-manager/team'}
                className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200"
              >
                <UsersIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Team Management</span>
              </button>
              <button 
                onClick={() => window.location.href = '/project-manager/ai-recommendations'}
                className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200"
              >
                <ChartBarIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">AI Recommendations</span>
              </button>
              <button 
                onClick={() => window.location.href = '/project-manager/requirements'}
                className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200"
              >
                <DocumentTextIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Requirements Import</span>
              </button>
              <button 
                onClick={() => window.location.href = '/project-manager/chat'}
                className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200"
              >
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Team Chat</span>
              </button>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default ProjectManagerDashboard;