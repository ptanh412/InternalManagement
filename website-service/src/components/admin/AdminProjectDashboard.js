import React, { useState, useEffect } from 'react';
import {
  BriefcaseIcon,
  ChartBarIcon,
  UserGroupIcon,
  CalendarIcon,
  TrendingUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/apiService';

const AdminProjectDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    planning: 0
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProjects();
      
      if (response.success) {
        const projectsData = response.result || [];
        setProjects(projectsData);
        
        // Calculate stats
        const statsData = {
          total: projectsData.length,
          active: projectsData.filter(p => p.status === 'IN_PROGRESS').length,
          completed: projectsData.filter(p => p.status === 'COMPLETED').length,
          planning: projectsData.filter(p => p.status === 'PLANNING').length
        };
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      // Mock data for demonstration
      const mockProjects = [
        {
          id: 1,
          name: 'E-Commerce Platform',
          status: 'IN_PROGRESS',
          startDate: '2024-01-15',
          endDate: '2024-06-30',
          teamSize: 8,
          progress: 65
        },
        {
          id: 2,
          name: 'Mobile App Development',
          status: 'PLANNING',
          startDate: '2024-02-01',
          endDate: '2024-08-15',
          teamSize: 6,
          progress: 25
        },
        {
          id: 3,
          name: 'Data Analytics Dashboard',
          status: 'COMPLETED',
          startDate: '2023-10-01',
          endDate: '2024-01-30',
          teamSize: 4,
          progress: 100
        }
      ];
      setProjects(mockProjects);
      setStats({
        total: mockProjects.length,
        active: mockProjects.filter(p => p.status === 'IN_PROGRESS').length,
        completed: mockProjects.filter(p => p.status === 'COMPLETED').length,
        planning: mockProjects.filter(p => p.status === 'PLANNING').length
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PLANNING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ON_HOLD':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Project Management</h2>
        <p className="text-gray-600 mt-1">
          Comprehensive project oversight and analytics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BriefcaseIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Projects</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUpIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-sm text-gray-500">Active Projects</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.planning}</p>
              <p className="text-sm text-gray-500">In Planning</p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Projects</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {project.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {formatDate(project.startDate)} - {formatDate(project.endDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      {project.teamSize} members
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      {project.progress}%
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

export default AdminProjectDashboard;