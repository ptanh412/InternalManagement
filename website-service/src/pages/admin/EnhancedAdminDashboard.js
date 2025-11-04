import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CogIcon,
  CalendarIcon,
  ClockIcon,
  TrendingUpIcon,
  UsersIcon,
  BriefcaseIcon,
  FolderIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/apiService';
import UserManagement from './UserManagement';
import CVAnalysis from './CVAnalysis';
import RolesDepartments from './RolesDepartments';
import AdminProjectDashboard from '../../components/admin/AdminProjectDashboard';
import AdminAnalyticsDashboard from '../../components/admin/AdminAnalyticsDashboard';

const EnhancedAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    users: { total: 0, active: 0, inactive: 0 },
    projects: { total: 0, active: 0, completed: 0 },
    departments: { total: 0 },
    roles: { total: 0 },
    cvAnalysis: { total: 0, thisMonth: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all dashboard data in parallel
      const [
        usersRes,
        projectsRes,
        departmentsRes,
        rolesRes,
        projectAnalyticsRes,
        projectSummariesRes
      ] = await Promise.all([
        apiService.admin.getAllUsers().catch(() => ({ result: [] })),
        apiService.getProjects().catch(() => ({ result: [] })),
        apiService.admin.getAllDepartments().catch(() => ({ result: [] })),
        apiService.admin.getAllRoles().catch(() => ({ result: [] })),
        apiService.getProjectAnalytics().catch(() => ({ result: {} })),
        apiService.getProjectSummaries().catch(() => ({ result: [] }))
      ]);

      const users = usersRes.result || [];
      const projects = projectsRes.result || [];
      const departments = departmentsRes.result || [];
      const roles = rolesRes.result || [];
      const analytics = projectAnalyticsRes.result || {};

      // Calculate stats
      const userStats = {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        inactive: users.filter(u => !u.isActive).length
      };

      const projectStats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'PLANNING').length,
        completed: projects.filter(p => p.status === 'COMPLETED').length
      };

      setStats({
        users: userStats,
        projects: projectStats,
        departments: { total: departments.length },
        roles: { total: roles.length },
        cvAnalysis: { total: 0, thisMonth: 0 } // Will be loaded from CV analysis service
      });

      // Generate recent activities
      setRecentActivities([
        {
          id: 1,
          type: 'user_created',
          description: 'New user registered',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          user: 'John Smith'
        },
        {
          id: 2,
          type: 'project_created',
          description: 'New project created',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          user: 'Admin'
        },
        {
          id: 3,
          type: 'cv_analyzed',
          description: 'CV analyzed successfully',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          user: 'System'
        }
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_created': return <UsersIcon className="h-4 w-4" />;
      case 'project_created': return <BriefcaseIcon className="h-4 w-4" />;
      case 'cv_analyzed': return <SparklesIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
    { id: 'analytics', label: 'Analytics', icon: TrendingUpIcon },
    { id: 'users', label: 'User Management', icon: UserGroupIcon },
    { id: 'cv', label: 'CV Analysis', icon: DocumentTextIcon },
    { id: 'roles', label: 'Roles & Departments', icon: CogIcon }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Comprehensive system management and analytics
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={loadDashboardData}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ClockIcon className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Users
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.users.total}
                      </dd>
                      <dd className="text-sm text-gray-600">
                        {stats.users.active} active, {stats.users.inactive} inactive
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BriefcaseIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Projects
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.projects.total}
                      </dd>
                      <dd className="text-sm text-gray-600">
                        {stats.projects.active} active, {stats.projects.completed} completed
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FolderIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Departments
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.departments.total}
                      </dd>
                      <dd className="text-sm text-gray-600">
                        Active departments
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <SparklesIcon className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        CV Analyses
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.cvAnalysis.total}
                      </dd>
                      <dd className="text-sm text-gray-600">
                        {stats.cvAnalysis.thisMonth} this month
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
              </div>
              <div className="p-6">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {recentActivities.map((activity, index) => (
                      <li key={activity.id}>
                        <div className="relative pb-8">
                          {index !== recentActivities.length - 1 && (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          )}
                          <div className="relative flex space-x-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                              <div>
                                <p className="text-sm text-gray-500">
                                  <span className="font-medium text-gray-900">{activity.user}</span>{' '}
                                  {activity.description}
                                </p>
                              </div>
                              <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                {formatTimeAgo(activity.timestamp)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <AdminAnalyticsDashboard />
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <UserManagement />
        )}

        {/* CV Analysis Tab */}
        {activeTab === 'cv' && (
          <CVAnalysis />
        )}

        {/* Roles & Departments Tab */}
        {activeTab === 'roles' && (
          <RolesDepartments />
        )}
      </div>
    </div>
  );
};

export default EnhancedAdminDashboard;