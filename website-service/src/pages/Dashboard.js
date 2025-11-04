import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  ClockIcon,
  BellIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    projects: 0,
    tasks: 0,
    teamMembers: 0,
    hoursLogged: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Simulate API calls - replace with actual API calls
      setTimeout(() => {
        setStats({
          projects: 12,
          tasks: 48,
          teamMembers: 24,
          hoursLogged: 156
        });

        setRecentActivities([
          {
            id: 1,
            action: 'Project "Website Redesign" was updated',
            user: 'Sarah Johnson',
            time: '2 hours ago',
            type: 'project'
          },
          {
            id: 2,
            action: 'New task assigned: "API Development"',
            user: 'Mike Chen',
            time: '4 hours ago',
            type: 'task'
          },
          {
            id: 3,
            action: 'Team meeting scheduled for tomorrow',
            user: 'Emily Davis',
            time: '6 hours ago',
            type: 'meeting'
          },
          {
            id: 4,
            action: 'Task "Bug Fix #123" completed',
            user: 'John Smith',
            time: '1 day ago',
            type: 'task'
          }
        ]);

        setUpcomingTasks([
          {
            id: 1,
            title: 'Complete user authentication module',
            project: 'Mobile App Development',
            dueDate: '2024-10-16',
            priority: 'high'
          },
          {
            id: 2,
            title: 'Review design mockups',
            project: 'Website Redesign',
            dueDate: '2024-10-17',
            priority: 'medium'
          },
          {
            id: 3,
            title: 'Prepare quarterly report',
            project: 'Q4 Planning',
            dueDate: '2024-10-18',
            priority: 'high'
          },
          {
            id: 4,
            title: 'Team retrospective meeting',
            project: 'Sprint Planning',
            dueDate: '2024-10-19',
            priority: 'low'
          }
        ]);

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Active Projects',
      value: stats.projects,
      icon: ChartBarIcon,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Pending Tasks',
      value: stats.tasks,
      icon: DocumentTextIcon,
      color: 'bg-yellow-500',
      change: '-5%',
      changeType: 'negative'
    },
    {
      name: 'Team Members',
      value: stats.teamMembers,
      icon: UsersIcon,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Hours This Week',
      value: stats.hoursLogged,
      icon: ClockIcon,
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'positive'
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
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
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your projects today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div key={stat.name} className="card p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-md ${stat.color}`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {stat.name}
                    </p>
                    <div className="flex items-center">
                      <p className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </p>
                      <span className={`ml-2 text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Recent Activities
                </h2>
                <BellIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-600">
                          {activity.user[0]}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        by {activity.user} • {activity.time}
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
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Upcoming Tasks
                </h2>
                <CalendarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="border-l-4 border-primary-500 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      {task.project}
                    </p>
                    <p className="text-xs text-gray-500">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <button className="w-full btn-primary">
                  View All Tasks
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200">
                <ChartBarIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">New Project</span>
              </button>
              <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200">
                <DocumentTextIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Create Task</span>
              </button>
              <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200">
                <UsersIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Invite Member</span>
              </button>
              <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors duration-200">
                <ClockIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Log Time</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;