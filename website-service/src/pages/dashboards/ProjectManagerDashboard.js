import React, { useState, useEffect, useRef } from 'react';
import { 
  ChartBarIcon, 
  UsersIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  FolderIcon, 
  CurrencyDollarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import KPIWidget from '../../components/dashboard/KPIWidget';
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
import { apiService } from '../../services/apiService';

// Register Chart.js components
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

const ProjectManagerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [projects, setProjects] = useState([]);
  
  // Chart Data State
  const [chartData, setChartData] = useState({
    statusDistribution: null,
    topBudgetProjects: null,
    projectCreationTrend: null,
    projectProgress: null
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, projectsRes] = await Promise.all([
        apiService.getAnalysticsProjects ? apiService.getAnalysticsProjects() : { data: { result: null } }, 
        apiService.getProjects ? apiService.getProjects() : { data: { result: [] } }
      ]);

      const analyticsData = analyticsRes.data?.result || analyticsRes.result; 
      const projectsList = projectsRes.data?.result || projectsRes.result || [];

      setAnalytics(analyticsData);
      setProjects(projectsList);

      if (analyticsData && projectsList) {
        processChartData(analyticsData, projectsList);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (analyticsData, projectsList) => {
    // 1. Status Distribution (Doughnut)
    const statusLabels = Object.keys(analyticsData.projectsByStatus || {});
    const statusValues = Object.values(analyticsData.projectsByStatus || {});
    
    const statusDistributionData = {
      labels: statusLabels,
      datasets: [{
        data: statusValues,
        backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    };

    // 2. Top 5 Highest Budget Projects (Bar Chart)
    const topBudgetProjects = [...projectsList]
      .sort((a, b) => (b.budget || 0) - (a.budget || 0)) // Sort by budget desc
      .slice(0, 5); // Take top 5

    const topBudgetChartData = {
      labels: topBudgetProjects.map(p => p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name),
      datasets: [
        {
          label: 'Total Budget',
          data: topBudgetProjects.map(p => p.budget || 0),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderRadius: 4,
          barThickness: 30
        },
        {
          label: 'Actual Cost',
          data: topBudgetProjects.map(p => p.actualCost || 0),
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderRadius: 4,
          barThickness: 30
        }
      ]
    };

    // 3. Project Creation Trend (Line Chart)
    // Sắp xếp key theo thời gian để hiển thị đúng thứ tự
    const sortedKeys = Object.keys(analyticsData.projectsCreatedByMonth || {}).sort();
    const trendValues = sortedKeys.map(key => analyticsData.projectsCreatedByMonth[key]);

    const projectTrendData = {
      labels: sortedKeys,
      datasets: [{
        label: 'New Projects Created',
        data: trendValues,
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#8B5CF6',
        pointBorderWidth: 2,
        pointRadius: 4
      }]
    };

    // 4. Active Projects Progress (Horizontal Bar)
    const activeProjects = projectsList
      .filter(p => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS')
      .slice(0, 8); // Top 8 active
    
    const projectProgressData = {
      labels: activeProjects.map(p => p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name),
      datasets: [{
        label: 'Completion %',
        data: activeProjects.map(p => p.completionPercentage || 0),
        backgroundColor: activeProjects.map(p => {
          const progress = p.completionPercentage || 0;
          if (progress >= 80) return '#10B981'; // Green
          if (progress >= 40) return '#3B82F6'; // Blue
          return '#F59E0B'; // Yellow
        }),
        borderRadius: 4,
        barThickness: 20
      }]
    };

    setChartData({
      statusDistribution: statusDistributionData,
      topBudgetProjects: topBudgetChartData,
      projectCreationTrend: projectTrendData,
      projectProgress: projectProgressData
    });
  };

  // Chart Options Helpers
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }
    }
  };

  const barOptions = {
    ...commonOptions,
    scales: {
      y: { beginAtZero: true, grid: { display: true, color: '#f3f4f6' } },
      x: { grid: { display: false } }
    }
  };

  const horizontalBarOptions = {
    ...commonOptions,
    indexAxis: 'y',
    scales: {
      x: { max: 100, grid: { display: true, color: '#f3f4f6' } },
      y: { grid: { display: false } }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Project Overview</h1>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">Key metrics and performance indicators</p>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh Data
          </button>
        </div>

        {/* KPI Widget */}
        <div className="mb-8">
          <KPIWidget userId={user?.id} />
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Projects" 
            value={analytics?.totalProjects} 
            icon={FolderIcon} 
            color="blue" 
            subtext={`${analytics?.projectsByStatus?.ACTIVE || 0} Active Now`}
          />
          <StatCard 
            title="Total Budget" 
            value={`$${(analytics?.totalBudget || 0).toLocaleString()}`} 
            icon={CurrencyDollarIcon} 
            color="emerald" 
            subtext={`Spent: $${(analytics?.totalActualCost || 0).toLocaleString()}`}
          />
          <StatCard 
            title="Avg. Completion" 
            value={`${analytics?.averageCompletionPercentage?.toFixed(1)}%`} 
            icon={CheckCircleIcon} 
            color="indigo" 
            subtext="Across all projects"
          />
          <StatCard 
            title="Active Projects" 
            value={analytics?.projectsByStatus?.ACTIVE || 0} 
            icon={ClockIcon} 
            color="orange" 
            subtext={`${analytics?.projectsByStatus?.PLANNING || 0} in Planning`}
          />
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* 1. Project Creation Trend (Line) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Project Creation Timeline</h3>
            <div className="h-80">
              {chartData.projectCreationTrend ? (
                <Line data={chartData.projectCreationTrend} options={barOptions} />
              ) : <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">No data available</div>}
            </div>
          </div>

          {/* 2. Status Distribution (Doughnut) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Project Status Distribution</h3>
            <div className="h-80 flex justify-center relative">
               {chartData.statusDistribution ? (
                <Doughnut 
                  data={chartData.statusDistribution} 
                  options={{
                    ...commonOptions,
                    cutout: '65%',
                    plugins: { legend: { position: 'right', labels: { boxWidth: 12 } } }
                  }} 
                />
              ) : <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">No data available</div>}
              {/* Center Text Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-gray-800 dark:text-gray-200">{analytics?.totalProjects || 0}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Total</span>
              </div>
            </div>
          </div>

          {/* 3. Top Budget Projects (Bar) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top 5 Highest Budget Projects</h3>
            <div className="h-80">
               {chartData.topBudgetProjects ? (
                <Bar data={chartData.topBudgetProjects} options={barOptions} />
              ) : <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">No data available</div>}
            </div>
          </div>

          {/* 4. Active Project Progress (Horizontal Bar) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Active Projects Progress</h3>
            <div className="h-80">
               {chartData.projectProgress ? (
                <Bar data={chartData.projectProgress} options={horizontalBarOptions} />
              ) : <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">No data available</div>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Reusable Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, subtext }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value || 0}</h3>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {subtext && <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">{subtext}</p>}
    </div>
  );
};

export default ProjectManagerDashboard;