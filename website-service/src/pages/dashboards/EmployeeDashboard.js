import React, { useState, useEffect, useRef } from 'react';
import { 
  DocumentTextIcon, 
  ClockIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BellIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
  ChatBubbleLeftRightIcon,
  ArrowDownTrayIcon,
  TicketIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';
import socketIOService from '../../services/socketIOService';
import PerformanceAnalytics from '../../components/analytics/PerformanceAnalytics';
import KPIWidget from '../../components/dashboard/KPIWidget';
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

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const { success: showSuccess } = useNotification();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    myTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    hoursToday: 0,
    hoursThisWeek: 0,
    notifications: 0
  });
  const [tasks, setTasks] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [isTrackingTime, setIsTrackingTime] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [loading, setLoading] = useState(true);

  // Chart state and refs
  const [chartData, setChartData] = useState({
    personalTimeline: null,
    dailyHours: null,
    taskStatus: null,
    performanceRadar: null,
    monthlyProductivity: null,
    skillDevelopment: null
  });

  const chartRefs = {
    timeline: useRef(null),
    hours: useRef(null),
    status: useRef(null),
    performance: useRef(null),
    productivity: useRef(null),
    skills: useRef(null)
  };

  useEffect(() => {
    loadEmployeeData();
  }, []);

  // SocketIO integration for real-time task assignments
  useEffect(() => {
    // Connect to SocketIO service
    socketIOService.connect();

    // Subscribe to task assignment events
    const unsubscribeTaskAssigned = socketIOService.subscribe('task-assigned', (data) => {
      if (data.assignedTo === user?.id) {
        console.log('New task assigned to me:', data);
        
        // Update stats - increment my tasks count
        setStats(prevStats => ({
          ...prevStats,
          myTasks: prevStats.myTasks + 1,
          notifications: prevStats.notifications + 1
        }));

        // Add the new task to the tasks list if it's a TaskResponse object
        if (data.task) {
          const newTask = {
            id: data.task.id,
            title: data.task.title || data.task.name,
            project: data.task.projectName || 'Unknown Project',
            priority: (data.task.priority || 'medium').toLowerCase(),
            status: 'pending',
            dueDate: data.task.dueDate || null,
            progress: 0,
            estimatedTime: data.task.estimatedHours ? `${data.task.estimatedHours}h` : 'N/A'
          };

          setTasks(prevTasks => [newTask, ...prevTasks]);
        }

        // Add to recent activities
        const newActivity = {
          id: Date.now(),
          action: `New task assigned: "${data.task?.title || data.message}"`,
          timestamp: 'Just now',
          type: 'assignment'
        };

        setRecentActivities(prevActivities => [newActivity, ...prevActivities.slice(0, 9)]);

        // Show toast notification
        showSuccess(
          `New task assigned: "${data.task?.title || 'Unknown task'}"`,
          'Task Assigned'
        );

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification('New Task Assigned', {
            body: data.message || `You have been assigned a new task`,
            icon: '/logo192.png'
          });
        }
      }
    });

    // Subscribe to task status change events
    const unsubscribeTaskStatusChanged = socketIOService.subscribe('task-status-changed', (data) => {
      if (data.assignedTo === user?.id && data.task) {
        console.log('Task status changed:', data);
        
        // Update the task in the tasks list
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === data.task.id 
              ? { 
                  ...task, 
                  status: (data.task.status || 'pending').toLowerCase(),
                  progress: data.task.progress || task.progress
                }
              : task
          )
        );

        // Add to recent activities
        const newActivity = {
          id: Date.now(),
          action: `Task status updated: "${data.task.title}" - ${data.task.status}`,
          timestamp: 'Just now',
          type: 'status-change'
        };

        setRecentActivities(prevActivities => [newActivity, ...prevActivities.slice(0, 9)]);
      }
    });

    // Subscribe to task update events
    const unsubscribeTaskUpdated = socketIOService.subscribe('task-updated', (data) => {
      if (data.assignedTo === user?.id && data.task) {
        console.log('Task updated:', data);
        
        // Update the task in the tasks list
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === data.task.id 
              ? {
                  ...task,
                  title: data.task.title || task.title,
                  project: data.task.projectName || task.project,
                  priority: (data.task.priority || task.priority).toLowerCase(),
                  dueDate: data.task.dueDate || task.dueDate,
                  estimatedTime: data.task.estimatedHours ? `${data.task.estimatedHours}h` : task.estimatedTime
                }
              : task
          )
        );

        // Add to recent activities
        const newActivity = {
          id: Date.now(),
          action: `Task updated: "${data.task.title}"`,
          timestamp: 'Just now',
          type: 'update'
        };

        setRecentActivities(prevActivities => [newActivity, ...prevActivities.slice(0, 9)]);
      }
    });

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup subscriptions on component unmount
    return () => {
      unsubscribeTaskAssigned();
      unsubscribeTaskStatusChanged();
      unsubscribeTaskUpdated();
    };
  }, [user?.id]);

  const loadEmployeeData = async () => {
    try {
      // Simulate API calls for employee data
      setTimeout(() => {
        setStats({
          myTasks: 8,
          completedTasks: 34,
          overdueTasks: 1,
          hoursToday: 6.5,
          hoursThisWeek: 32.5,
          notifications: 5
        });

        setTasks([
          {
            id: 1,
            title: 'Complete user authentication module',
            project: 'Mobile App',
            priority: 'high',
            status: 'in-progress',
            dueDate: '2024-10-25',
            progress: 75,
            estimatedTime: '4h'
          },
          {
            id: 2,
            title: 'Fix responsive design issues',
            project: 'Website',
            priority: 'medium',
            status: 'pending',
            dueDate: '2024-10-28',
            progress: 0,
            estimatedTime: '2h'
          },
          {
            id: 3,
            title: 'Write unit tests for payment module',
            project: 'E-commerce',
            priority: 'medium',
            status: 'in-progress',
            dueDate: '2024-10-30',
            progress: 40,
            estimatedTime: '6h'
          },
          {
            id: 4,
            title: 'Update API documentation',
            project: 'Backend',
            priority: 'low',
            status: 'pending',
            dueDate: '2024-11-01',
            progress: 0,
            estimatedTime: '3h'
          },
          {
            id: 5,
            title: 'Review code for security vulnerabilities',
            project: 'Security Audit',
            priority: 'high',
            status: 'pending',
            dueDate: '2024-10-26',
            progress: 0,
            estimatedTime: '5h'
          }
        ]);

        setRecentActivities([
          {
            id: 1,
            action: 'Completed task "User Registration API"',
            timestamp: '2 hours ago',
            type: 'completion'
          },
          {
            id: 2,
            action: 'Started working on "Authentication Module"',
            timestamp: '3 hours ago',
            type: 'start'
          },
          {
            id: 3,
            action: 'Submitted code review for "Payment Gateway"',
            timestamp: '1 day ago',
            type: 'submission'
          },
          {
            id: 4,
            action: 'Attended team standup meeting',
            timestamp: '1 day ago',
            type: 'meeting'
          }
        ]);

        setTimeEntries([
          {
            id: 1,
            task: 'User Authentication',
            project: 'Mobile App',
            duration: '2h 30m',
            date: '2024-10-14'
          },
          {
            id: 2,
            task: 'Bug Fixes',
            project: 'Website',
            duration: '1h 45m',
            date: '2024-10-14'
          },
          {
            id: 3,
            task: 'Code Review',
            project: 'Backend',
            duration: '1h 15m',
            date: '2024-10-13'
          }
        ]);

        // Initialize employee chart data
        initializeEmployeeChartData();

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load employee data:', error);
      setLoading(false);
    }
  };

  // Initialize employee chart data
  const initializeEmployeeChartData = () => {
    // 1. Personal Task Timeline
    const personalTimelineData = {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
      datasets: [
        {
          label: 'Tasks Completed',
          data: [5, 7, 6, 8, 9, 7, 10, 8],
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Tasks Assigned',
          data: [6, 8, 7, 9, 10, 8, 11, 9],
          borderColor: '#3B82F6', 
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };

    // 2. Daily Hours Tracking
    const dailyHoursData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Productive Hours',
          data: [7.5, 8, 7.8, 8.2, 7.9, 4, 0],
          backgroundColor: '#10B981'
        },
        {
          label: 'Break Time',
          data: [0.5, 0.5, 0.7, 0.3, 0.6, 0.2, 0],
          backgroundColor: '#F59E0B'
        },
        {
          label: 'Overtime',
          data: [0, 0.5, 0, 0.8, 0.2, 0, 0],
          backgroundColor: '#EF4444'
        }
      ]
    };

    // 3. Task Status Distribution
    const taskStatusData = {
      labels: ['Completed', 'In Progress', 'Pending', 'Blocked', 'Review'],
      datasets: [{
        data: [65, 20, 10, 3, 2],
        backgroundColor: [
          '#10B981', // Green - Completed
          '#3B82F6', // Blue - In Progress
          '#F59E0B', // Yellow - Pending  
          '#EF4444', // Red - Blocked
          '#8B5CF6'  // Purple - Review
        ],
        borderWidth: 2
      }]
    };

    // 4. Performance Radar
    const performanceRadarData = {
      labels: ['Quality', 'Timeliness', 'Collaboration', 'Innovation', 'Problem Solving', 'Communication'],
      datasets: [{
        label: 'My Performance',
        data: [88, 92, 85, 78, 90, 87],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: '#3B82F6',
        borderWidth: 2
      }]
    };

    // 5. Monthly Productivity
    const monthlyProductivityData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Tasks Completed',
          data: [25, 28, 30, 27, 35, 32, 38, 40, 37, 42, 39, 45],
          backgroundColor: 'rgba(16, 185, 129, 0.3)',
          borderColor: '#10B981',
          fill: true
        },
        {
          label: 'Hours Worked',
          data: [160, 168, 172, 165, 175, 170, 180, 182, 178, 185, 180, 188],
          backgroundColor: 'rgba(59, 130, 246, 0.3)',
          borderColor: '#3B82F6',
          fill: true,
          yAxisID: 'y1'
        }
      ]
    };

    // 6. Skill Development
    const skillDevelopmentData = {
      labels: ['React Development', 'Node.js', 'Database Design', 'UI/UX Design', 'Testing', 'DevOps'],
      datasets: [{
        label: 'Skill Level %',
        data: [85, 78, 65, 70, 82, 45],
        backgroundColor: [
          '#10B981', // >80% - Advanced
          '#3B82F6', // 60-80% - Intermediate  
          '#F59E0B', // 40-60% - Beginner
          '#F59E0B', // 40-60% - Beginner
          '#10B981', // >80% - Advanced
          '#EF4444'  // <40% - Learning
        ],
        borderRadius: 4
      }]
    };

    setChartData({
      personalTimeline: personalTimelineData,
      dailyHours: dailyHoursData,
      taskStatus: taskStatusData,
      performanceRadar: performanceRadarData,
      monthlyProductivity: monthlyProductivityData,
      skillDevelopment: skillDevelopmentData
    });
  };

  // Employee chart options
  const getEmployeeChartOptions = (title, type = 'default') => {
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
          y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Hours' }, grid: { drawOnChartArea: false }}
        }
      };
    }
    return baseOptions;
  };

  // Export chart
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

  const employeeStats = [
    {
      name: 'My Tasks',
      value: stats.myTasks,
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      change: '+2',
      changeType: 'neutral'
    },
    {
      name: 'Completed',
      value: stats.completedTasks,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      change: '+5',
      changeType: 'positive'
    },
    {
      name: 'Overdue',
      value: stats.overdueTasks,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      change: '-1',
      changeType: 'positive'
    },
    {
      name: 'Hours Today',
      value: stats.hoursToday,
      icon: ClockIcon,
      color: 'bg-purple-500',
      change: '+1.5h',
      changeType: 'positive'
    },
    {
      name: 'Hours This Week',
      value: stats.hoursThisWeek,
      icon: ChartBarIcon,
      color: 'bg-indigo-500',
      change: '+8h',
      changeType: 'positive'
    },
    {
      name: 'Notifications',
      value: stats.notifications,
      icon: BellIcon,
      color: 'bg-yellow-500',
      change: '+2',
      changeType: 'neutral'
    }
  ];

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

  const handleStartTimeTracking = (task) => {
    setCurrentTask(task);
    setIsTrackingTime(true);
  };

  const handleStopTimeTracking = () => {
    setCurrentTask(null);
    setIsTrackingTime(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:bg-black py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            My Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Welcome back, {user?.name}! Here's your work overview.
          </p>
        </div>

        {/* Navigation Tabs */}
        {/* <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Dashboard
              </div>
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'performance'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center">
                <TicketIcon className="h-5 w-5 mr-2" />
                Performance Analytics
              </div>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                My Profile
              </div>
            </button>
          </nav>
        </div> */}

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* KPI Widget */}
            <div className="mb-8">
              <KPIWidget userId={user?.id} />
            </div>

            {/* Time Tracker */}
            {isTrackingTime && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Currently tracking:</h3>
                <p className="text-green-100">{currentTask?.title}</p>
              </div>
              <button
                onClick={handleStopTimeTracking}
                className="flex items-center bg-white dark:bg-gray-800 text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50"
              >
                <PauseIcon className="h-4 w-4 mr-2" />
                Stop Tracking
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {employeeStats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div key={stat.name} className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className={`p-3 rounded-md ${stat.color}`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {stat.name}
                    </p>
                    <div className="flex items-center">
                      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {stat.value}
                      </p>
                      <span className={`ml-2 text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 
                        stat.changeType === 'negative' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div> */}

        {/* Employee Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          
          {/* Personal Task Timeline */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6 dark:bg-black dark:border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white">Personal Task Timeline</h3>
              <button
                onClick={() => exportChart(chartRefs.timeline, 'personal-timeline')}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-600"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="h-80 dark:text-white">
              {chartData.personalTimeline && (
                <Line 
                  ref={chartRefs.timeline}
                  data={chartData.personalTimeline} 
                  options={getEmployeeChartOptions('Weekly Task Completion Progress')} 
                />
              )}
            </div>
          </div>

          {/* Task Status Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 dark:bg-black dark:border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white">Task Status</h3>
              <button
                onClick={() => exportChart(chartRefs.status, 'task-status')}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-600"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="h-80 dark:text-white">
              {chartData.taskStatus && (
                <Doughnut 
                  ref={chartRefs.status}
                  data={chartData.taskStatus} 
                  options={getEmployeeChartOptions('My Task Status Breakdown')} 
                />
              )}
            </div>
          </div>

          {/* Daily Hours Tracking */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6 dark:bg-black dark:border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white">Daily Hours Tracking</h3>
              <button
                onClick={() => exportChart(chartRefs.hours, 'daily-hours')}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-600"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="h-80 dark:text-white">
              {chartData.dailyHours && (
                <Bar 
                  ref={chartRefs.hours}
                  data={chartData.dailyHours} 
                  options={getEmployeeChartOptions('Weekly Work Hours Breakdown')} 
                />
              )}
            </div>
          </div>

          {/* Performance Radar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 dark:bg-black dark:border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white">Performance Metrics</h3>
              <button
                onClick={() => exportChart(chartRefs.performance, 'performance-radar')}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-600"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="h-80 dark:text-white">
              {chartData.performanceRadar && (
                <Radar 
                  ref={chartRefs.performance}
                  data={chartData.performanceRadar} 
                  options={getEmployeeChartOptions('Multi-Dimensional Performance Assessment')} 
                />
              )}
            </div>
          </div>

          {/* Monthly Productivity */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6 dark:bg-black dark:border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white">Monthly Productivity</h3>
              <button
                onClick={() => exportChart(chartRefs.productivity, 'monthly-productivity')}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-600"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="h-80 dark:text-white">
              {chartData.monthlyProductivity && (
                <Line 
                  ref={chartRefs.productivity}
                  data={chartData.monthlyProductivity} 
                  options={getEmployeeChartOptions('Annual Productivity Trends', 'multiAxis')} 
                />
              )}
            </div>
          </div>

          {/* Skill Development */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 dark:bg-black dark:border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white">Skill Development</h3>
              <button
                onClick={() => exportChart(chartRefs.skills, 'skill-development')}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-600"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="h-80 dark:text-white">
              {chartData.skillDevelopment && (
                <Bar 
                  ref={chartRefs.skills}
                  data={chartData.skillDevelopment} 
                  options={getEmployeeChartOptions('Individual Skill Progress', 'horizontal')} 
                />
              )}
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
export default EmployeeDashboard;