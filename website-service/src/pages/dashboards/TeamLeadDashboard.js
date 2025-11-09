import React, { useState, useEffect, useRef } from 'react';
import { 
  UsersIcon, 
  DocumentTextIcon, 
  ClockIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ArrowDownTrayIcon,
  TicketIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import TeamPerformanceAnalytics from '../../components/analytics/TeamPerformanceAnalytics';
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
import { Line, Bar, Pie, Radar } from 'react-chartjs-2';

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

const TeamLeadDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    teamMembers: 0,
    activeTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    teamEfficiency: 0,
    upcomingMeetings: 0
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chart state and refs
  const [chartData, setChartData] = useState({
    taskDistribution: null,
    productivityTrends: null,
    skillsCoverage: null,
    taskPriority: null,
    sprintBurndown: null,
    memberPerformance: null
  });

  const chartRefs = {
    taskDistribution: useRef(null),
    productivity: useRef(null),
    skills: useRef(null),
    priority: useRef(null),
    burndown: useRef(null),
    performance: useRef(null)
  };

  useEffect(() => {
    loadTeamLeadData();
  }, []);

  const loadTeamLeadData = async () => {
    try {
      // Simulate API calls for team lead data
      setTimeout(() => {
        setStats({
          teamMembers: 12,
          activeTasks: 28,
          completedTasks: 156,
          overdueTasks: 3,
          teamEfficiency: 87.3,
          upcomingMeetings: 4
        });

        setTeamMembers([
          {
            id: 1,
            name: 'John Smith',
            role: 'Senior Developer',
            avatar: 'JS',
            status: 'active',
            tasks: 8,
            efficiency: 92
          },
          {
            id: 2,
            name: 'Sarah Wilson',
            role: 'UI/UX Designer',
            avatar: 'SW',
            status: 'active',
            tasks: 5,
            efficiency: 88
          },
          {
            id: 3,
            name: 'Mike Johnson',
            role: 'Backend Developer',
            avatar: 'MJ',
            status: 'away',
            tasks: 6,
            efficiency: 85
          },
          {
            id: 4,
            name: 'Emily Chen',
            role: 'Frontend Developer',
            avatar: 'EC',
            status: 'active',
            tasks: 7,
            efficiency: 90
          },
          {
            id: 5,
            name: 'David Brown',
            role: 'QA Engineer',
            avatar: 'DB',
            status: 'busy',
            tasks: 4,
            efficiency: 86
          }
        ]);

        setTasks([
          {
            id: 1,
            title: 'Implement user authentication',
            assignee: 'John Smith',
            priority: 'high',
            status: 'in-progress',
            dueDate: '2024-10-25',
            progress: 75
          },
          {
            id: 2,
            title: 'Design dashboard mockups',
            assignee: 'Sarah Wilson',
            priority: 'medium',
            status: 'in-progress',
            dueDate: '2024-10-28',
            progress: 60
          },
          {
            id: 3,
            title: 'Setup CI/CD pipeline',
            assignee: 'Mike Johnson',
            priority: 'high',
            status: 'pending',
            dueDate: '2024-10-30',
            progress: 20
          },
          {
            id: 4,
            title: 'Write unit tests',
            assignee: 'David Brown',
            priority: 'medium',
            status: 'completed',
            dueDate: '2024-10-20',
            progress: 100
          },
          {
            id: 5,
            title: 'Integrate payment gateway',
            assignee: 'Emily Chen',
            priority: 'high',
            status: 'in-progress',
            dueDate: '2024-11-01',
            progress: 40
          }
        ]);

        setRecentActivities([
          {
            id: 1,
            user: 'John Smith',
            action: 'completed task "User Registration API"',
            timestamp: '15 minutes ago',
            type: 'completion'
          },
          {
            id: 2,
            user: 'Sarah Wilson',
            action: 'submitted design review for dashboard',
            timestamp: '1 hour ago',
            type: 'submission'
          },
          {
            id: 3,
            user: 'Mike Johnson',
            action: 'requested help with deployment configuration',
            timestamp: '2 hours ago',
            type: 'request'
          },
          {
            id: 4,
            user: 'Emily Chen',
            action: 'started working on payment integration',
            timestamp: '3 hours ago',
            type: 'start'
          }
        ]);

        // Initialize chart data after loading base data
        initializeTeamChartData();

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load team lead data:', error);
      setLoading(false);
    }
  };

  // Initialize team lead chart data
  const initializeTeamChartData = () => {
    // 1. Task Distribution by Team Member
    const taskDistributionData = {
      labels: ['John Smith', 'Sarah Wilson', 'Mike Johnson', 'Emily Chen', 'David Brown'],
      datasets: [
        {
          label: 'Completed Tasks',
          data: [24, 18, 22, 20, 16],
          backgroundColor: '#10B981'
        },
        {
          label: 'In Progress',
          data: [3, 2, 4, 3, 2],
          backgroundColor: '#F59E0B'
        },
        {
          label: 'Pending',
          data: [1, 3, 2, 2, 4],
          backgroundColor: '#EF4444'
        }
      ]
    };

    // 2. Team Productivity Trends
    const productivityTrendsData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Tasks Completed',
          data: [12, 15, 18, 16, 20, 8, 3],
          backgroundColor: 'rgba(16, 185, 129, 0.3)',
          borderColor: '#10B981',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Hours Worked',
          data: [45, 52, 48, 50, 55, 25, 10],
          backgroundColor: 'rgba(59, 130, 246, 0.3)', 
          borderColor: '#3B82F6',
          fill: true,
          yAxisID: 'y1',
          tension: 0.4
        }
      ]
    };

    // 3. Skills Coverage Matrix
    const skillsCoverageData = {
      labels: ['Frontend Dev', 'Backend Dev', 'UI/UX Design', 'QA Testing', 'DevOps', 'Mobile Dev'],
      datasets: [
        {
          label: 'Team Skill Level',
          data: [85, 92, 78, 88, 70, 65],
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: '#3B82F6',
          borderWidth: 2
        },
        {
          label: 'Project Requirements',
          data: [80, 85, 90, 80, 75, 70],
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          borderColor: '#F59E0B',
          borderWidth: 2
        }
      ]
    };

    // 4. Task Priority Distribution
    const taskPriorityData = {
      labels: ['High Priority', 'Medium Priority', 'Low Priority', 'Critical'],
      datasets: [{
        data: [15, 35, 40, 10],
        backgroundColor: [
          '#EF4444', // Red - High
          '#F59E0B', // Yellow - Medium
          '#10B981', // Green - Low  
          '#DC2626'  // Dark Red - Critical
        ]
      }]
    };

    // 5. Weekly Sprint Burndown
    const sprintBurndownData = {
      labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8', 'Day 9', 'Day 10'],
      datasets: [
        {
          label: 'Ideal Burndown',
          data: [100, 90, 80, 70, 60, 50, 40, 30, 20, 10],
          borderColor: '#9CA3AF',
          borderDash: [5, 5],
          backgroundColor: 'transparent'
        },
        {
          label: 'Actual Burndown', 
          data: [100, 88, 85, 75, 68, 55, 45, 38, 25, 15],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.2,
          fill: true
        }
      ]
    };

    // 6. Team Member Performance
    const memberPerformanceData = {
      labels: ['John S.', 'Sarah W.', 'Mike J.', 'Emily C.', 'David B.'],
      datasets: [
        {
          type: 'bar',
          label: 'Tasks Completed',
          data: [24, 18, 22, 20, 16],
          backgroundColor: '#10B981',
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'Efficiency Score',
          data: [92, 88, 85, 90, 86],
          borderColor: '#F59E0B',
          backgroundColor: 'transparent',
          yAxisID: 'y1'
        }
      ]
    };

    setChartData({
      taskDistribution: taskDistributionData,
      productivityTrends: productivityTrendsData,
      skillsCoverage: skillsCoverageData,
      taskPriority: taskPriorityData,
      sprintBurndown: sprintBurndownData,
      memberPerformance: memberPerformanceData
    });
  };

  // Chart options for team lead
  const getTeamChartOptions = (title, type = 'default') => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: title, font: { size: 14, weight: 'bold' }},
        tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.8)', titleColor: 'white', bodyColor: 'white' }
      }
    };

    if (type === 'horizontal') {
      return { ...baseOptions, indexAxis: 'y', scales: { x: { beginAtZero: true }}};
    }
    if (type === 'multiAxis') {
      return {
        ...baseOptions,
        scales: {
          x: { display: true },
          y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Tasks' }},
          y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Hours/Score' }, grid: { drawOnChartArea: false }}
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

  const leadStats = [
    {
      name: 'Team Members',
      value: stats.teamMembers,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      change: '+1',
      changeType: 'positive'
    },
    {
      name: 'Active Tasks',
      value: stats.activeTasks,
      icon: DocumentTextIcon,
      color: 'bg-purple-500',
      change: '+5',
      changeType: 'positive'
    },
    {
      name: 'Completed Tasks',
      value: stats.completedTasks,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      change: '+23',
      changeType: 'positive'
    },
    {
      name: 'Overdue Tasks',
      value: stats.overdueTasks,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      change: '-2',
      changeType: 'positive'
    },
    {
      name: 'Team Efficiency',
      value: `${stats.teamEfficiency}%`,
      icon: ChartBarIcon,
      color: 'bg-emerald-500',
      change: '+2.1%',
      changeType: 'positive'
    },
    {
      name: 'Meetings Today',
      value: stats.upcomingMeetings,
      icon: CalendarDaysIcon,
      color: 'bg-yellow-500',
      change: '0',
      changeType: 'neutral'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'away':
        return 'bg-yellow-100 text-yellow-800';
      case 'busy':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
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
          <h1 className="text-3xl font-bold text-gray-900">
            Team Lead Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.name}! Here's your team overview.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Team Dashboard
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <TicketIcon className="h-5 w-5 mr-2" />
                Team Analytics
              </div>
            </button>
            <button
              onClick={() => setActiveTab('management')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'management'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Cog6ToothIcon className="h-5 w-5 mr-2" />
                Team Management
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {leadStats.map((stat) => {
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

        {/* Team Lead Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          
          {/* Task Distribution Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Task Distribution by Team Member</h3>
              <button
                onClick={() => exportChart(chartRefs.taskDistribution, 'task-distribution')}
                className="text-blue-600 hover:text-blue-800"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="h-80">
              {chartData.taskDistribution && (
                <Bar 
                  ref={chartRefs.taskDistribution}
                  data={chartData.taskDistribution} 
                  options={getTeamChartOptions('Team Workload Distribution', 'horizontal')} 
                />
              )}
            </div>
          </div>

          {/* Task Priority Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Task Priority</h3>
              <button
                onClick={() => exportChart(chartRefs.priority, 'task-priority')}
                className="text-blue-600 hover:text-blue-800"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="h-80">
              {chartData.taskPriority && (
                <Pie 
                  ref={chartRefs.priority}
                  data={chartData.taskPriority} 
                  options={getTeamChartOptions('Task Priority Breakdown')} 
                />
              )}
            </div>
          </div>

          {/* Productivity Trends */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
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
              {chartData.productivityTrends && (
                <Line 
                  ref={chartRefs.productivity}
                  data={chartData.productivityTrends} 
                  options={getTeamChartOptions('Weekly Productivity Analysis', 'multiAxis')} 
                />
              )}
            </div>
          </div>

          {/* Skills Coverage */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Skills Coverage</h3>
              <button
                onClick={() => exportChart(chartRefs.skills, 'skills-coverage')}
                className="text-blue-600 hover:text-blue-800"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="h-80">
              {chartData.skillsCoverage && (
                <Radar 
                  ref={chartRefs.skills}
                  data={chartData.skillsCoverage} 
                  options={getTeamChartOptions('Team vs Project Skill Requirements')} 
                />
              )}
            </div>
          </div>

          {/* Sprint Burndown */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sprint Burndown</h3>
              <button
                onClick={() => exportChart(chartRefs.burndown, 'sprint-burndown')}
                className="text-blue-600 hover:text-blue-800"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="h-80">
              {chartData.sprintBurndown && (
                <Line 
                  ref={chartRefs.burndown}
                  data={chartData.sprintBurndown} 
                  options={getTeamChartOptions('Current Sprint Progress')} 
                />
              )}
            </div>
          </div>

          {/* Member Performance */}
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
              {chartData.memberPerformance && (
                <Bar 
                  ref={chartRefs.performance}
                  data={chartData.memberPerformance} 
                  options={getTeamChartOptions('Team Member Performance Comparison', 'multiAxis')} 
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Team Members */}
          {/* <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Team Members
                </h2>
                <UsersIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">
                          {member.avatar}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.role}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        {member.tasks} tasks
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <button className="w-full btn-primary">
                  Manage Team
                </button>
              </div>
            </div>
          </div> */}

          {/* Tasks Overview */}
          {/* <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Team Tasks
                </h2>
                <button className="btn-primary flex items-center">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Assign Task
                </button>
              </div>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {task.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTaskStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span className="flex items-center">
                        <UsersIcon className="h-4 w-4 mr-1" />
                        {task.assignee}
                      </span>
                      <span className="flex items-center">
                        <CalendarDaysIcon className="h-4 w-4 mr-1" />
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div> */}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activities */}
          {/* <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Team Activities
              </h2>
              <EyeIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-600">
                        {activity.user.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.user}</span>{' '}
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                View all activities →
              </button>
            </div>
          </div> */}

          {/* Quick Actions */}
          {/* <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <button className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200">
                <DocumentTextIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Create Task</span>
              </button>
              <button className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200">
                <CalendarDaysIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Schedule Meeting</span>
              </button>
              <button className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200">
                <ChartBarIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Team Report</span>
              </button>
              <button className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200">
                <ClockIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Time Tracking</span>
              </button>
              <button 
                onClick={() => window.location.href = '/team-lead/chat'}
                className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200"
              >
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Team Chat</span>
              </button>
            </div>
          </div> */}
        </div>
          </>
        )}

        {/* Team Analytics Tab */}
        {activeTab === 'analytics' && (
          <TeamPerformanceAnalytics teamId={user?.teamId} />
        )}

        {/* Team Management Tab */}
        {activeTab === 'management' && (
          <div className="space-y-6">
            
            {/* Team Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Management</h2>
              
              {/* Team Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.teamMembers}</div>
                  <div className="text-sm text-gray-600">Team Members</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.totalTasks}</div>
                  <div className="text-sm text-gray-600">Active Tasks</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.completedTasks}</div>
                  <div className="text-sm text-gray-600">Completed Tasks</div>
                </div>
              </div>

              {/* Team Member List */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Team Members</h3>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Member</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Tasks</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Performance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {teamMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-700">
                                    {member.name.charAt(0)}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                <div className="text-sm text-gray-500">{member.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {member.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.activeTasks}/{member.totalTasks}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    member.performance >= 90 ? 'bg-green-500' :
                                    member.performance >= 70 ? 'bg-blue-500' :
                                    member.performance >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${member.performance}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-700">{member.performance}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              member.status === 'online' ? 'bg-green-100 text-green-800' :
                              member.status === 'away' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {member.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Team Actions */}
            {/* <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Team Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200">
                  <PlusIcon className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Add Member</span>
                </button>
                <button className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors duration-200">
                  <DocumentTextIcon className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Assign Task</span>
                </button>
                <button className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors duration-200">
                  <CalendarDaysIcon className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700">Schedule Meeting</span>
                </button>
                <button className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors duration-200">
                  <EyeIcon className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700">View Reports</span>
                </button>
              </div>
            </div> */}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamLeadDashboard;