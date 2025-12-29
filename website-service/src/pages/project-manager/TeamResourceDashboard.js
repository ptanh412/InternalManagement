import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
} from 'chart.js';
import { Bar, Doughnut, Radar } from 'react-chartjs-2';
import { 
  UserGroupIcon, 
  ScaleIcon, 
  ClockIcon, 
  ArrowPathIcon,
  TrophyIcon,
  ChartBarIcon,
  SparklesIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/apiService'; //
import { useAuth } from '../../hooks/useAuth';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

const TeamResourceDashboard = ({ embedded = false, projectId: propProjectId = null }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState(propProjectId || '');
  const [userProjects, setUserProjects] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // State chứa dữ liệu đã được xử lý và merge từ 2 API
  const [dashboardData, setDashboardData] = useState({
    workload: null,
    timeStats: [],
    mergedMembers: []
  });

  const [chartData, setChartData] = useState({});

  // 1. Fetch User's Projects on Mount
  useEffect(() => {
    const fetchUserProjects = async () => {
      try {
        const response = await apiService.getProjectsForUser(user.id, user.role); //
        const projects = response.data?.result || response.result || [];
        setUserProjects(projects);
        
        if (projects.length > 0 && !embedded) {
          setProjectId(projects[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch user projects", error);
      }
    };

    if (user?.id && !embedded) {
      fetchUserProjects();
    }
  }, [user, embedded]);

  // 2. Fetch Dashboard Data when ProjectId Changes
  useEffect(() => {
    if (embedded && propProjectId) {
      setProjectId(propProjectId);
      fetchProjectData();
    } else if (projectId) {
      fetchProjectData();
    }
  }, [projectId, embedded, propProjectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      
      // Call 3 APIs: Workload, TimeStats, and Task Hours
      const [workloadRes, timeStatsRes, taskHoursRes] = await Promise.all([
        apiService.getProjectWorkload(projectId),
        apiService.getProjectWorkTimeStats(projectId, 'WEEKLY'),
        apiService.getTaskHoursStats(projectId) // Only pass projectId - backend handles the rest
      ]);

      const workloadResult = workloadRes.data || workloadRes;
      const timeStatsResult = timeStatsRes.data?.result || timeStatsRes.result || [];
      const taskHoursStatsResult = taskHoursRes.data?.result || taskHoursRes;
      
      console.log("WORKLOAD:", workloadResult);
      console.log("TIME STATS:", timeStatsResult);
      console.log("TASK HOURS STATS:", taskHoursRes);

      // MERGE DATA: Combine workload, time stats, and task hours stats
      // 1. Tạo tập hợp tất cả User ID duy nhất từ cả Workload, TimeStats và TaskHours
      const allUserIds = new Set([
        ...(workloadResult.teamMembers || []).map(m => m.userId),
        ...(taskHoursStatsResult || []).map(t => t.userId),
        ...(timeStatsResult || []).map(t => t.userId)
      ]);

      // 2. Map qua danh sách ID tổng hợp này để tạo mergedMembers
      const mergedMembers = Array.from(allUserIds).map(userId => {
        // Tìm dữ liệu từ từng nguồn
        const workloadMember = (workloadResult.teamMembers || []).find(m => m.userId === userId);
        const stats = timeStatsResult.find(t => t.userId === userId);
        const taskHoursStats = (taskHoursStatsResult || []).find(th => th.userId === userId);

        // Xác định tên hiển thị (Ưu tiên TimeStats -> Workload -> TaskHours -> Unknown)
        const fullName = stats?.fullName 
          || workloadMember?.userName 
          || taskHoursStats?.userName 
          || 'Unknown User';

        return {
          userId: userId,
          fullName: fullName,
          employeeId: stats?.employeeId || 'N/A',
          
          // Workload Data (Nếu không có trong workload thì là 0)
          capacityHours: workloadMember?.capacityHours || 0,
          allocatedHours: workloadMember?.allocatedHours || 0,
          utilizationPercentage: workloadMember?.utilizationPercentage || 0,

          // Time Tracking Data
          totalHoursThisWeek: stats?.totalHoursThisWeek || 0,
          totalHoursThisMonth: stats?.totalHoursThisMonth || 0,
          productiveHoursPercentage: stats?.productiveHoursPercentage || 0,
          
          // Task Hours Data
          tasks: taskHoursStats?.tasks || [],
          totalEstimatedHours: taskHoursStats?.totalEstimatedHours || 0,
          totalActualHours: taskHoursStats?.totalActualHours || 0, // Dữ liệu bạn cần hiển thị nằm ở đây
          hoursVariance: taskHoursStats?.hoursVariance || 0,
          taskCount: taskHoursStats?.taskCount || 0,
          
          // Status Logic
          calculatedStatus: getMemberStatus(workloadMember?.utilizationPercentage || 0)
        };
      });

      console.log("MERGED MEMBERS:", mergedMembers);

      setDashboardData({
        workload: workloadResult,
        timeStats: timeStatsResult,
        mergedMembers: mergedMembers
      });

      processCharts(mergedMembers);

    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const getMemberStatus = (utilization) => {
    if (utilization > 100) return 'Overloaded';
    if (utilization >= 70) return 'Optimal'; // Optimal range 70-100%
    if (utilization > 0) return 'Underutilized';
    return 'Available';
  };

  const processCharts = (members) => {
    if (!members || members.length === 0) return;
    
    const labels = members.map(m => m.fullName);

    // 1. Resource Allocation Chart
    const allocationChart = {
      labels: labels,
      datasets: [
        {
          label: 'Allocated Hours',
          data: members.map(m => m.allocatedHours),
          backgroundColor: members.map(m => 
            m.utilizationPercentage > 100 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(59, 130, 246, 0.7)'
          ),
          stack: 'Stack 0',
        },
        {
          label: 'Remaining Capacity',
          data: members.map(m => Math.max(0, m.capacityHours - m.allocatedHours)),
          backgroundColor: 'rgba(229, 231, 235, 0.5)',
          stack: 'Stack 0',
        }
      ]
    };

    // 2. Productivity Chart (Hours Worked vs Productivity)
    const productivityChart = {
      labels: labels,
      datasets: [
        {
          type: 'bar',
          label: 'Total Hours Worked (This Week)',
          data: members.map(m => m.totalHoursThisWeek),
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          yAxisID: 'y',
          order: 2
        },
        {
          type: 'line',
          label: 'Productivity (%)',
          data: members.map(m => m.productiveHoursPercentage),
          borderColor: 'rgba(245, 158, 11, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'white',
          yAxisID: 'y1',
          order: 1
        }
      ]
    };

    // 3. Utilization Distribution
    const utilizationDistribution = {
      labels: ['Available (0%)', 'Under-utilized (<70%)', 'Optimal (70-100%)', 'Overloaded (>100%)'],
      datasets: [{
        data: [
          members.filter(m => m.allocatedHours === 0).length,
          members.filter(m => m.utilizationPercentage > 0 && m.utilizationPercentage < 70).length,
          members.filter(m => m.utilizationPercentage >= 70 && m.utilizationPercentage <= 100).length,
          members.filter(m => m.utilizationPercentage > 100).length
        ],
        backgroundColor: [
          'rgba(156, 163, 175, 0.8)', // Grey
          'rgba(251, 191, 36, 0.8)', // Yellow
          'rgba(34, 197, 94, 0.8)',  // Green
          'rgba(239, 68, 68, 0.8)'   // Red
        ],
        borderWidth: 1
      }]
    };

    // 4. Week vs Month Comparison (Avg Weekly)
    const weekVsMonthChart = {
      labels: labels,
      datasets: [
        {
          label: 'This Week',
          data: members.map(m => m.totalHoursThisWeek),
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
        },
        {
          label: 'Monthly Avg (Approx)',
          data: members.map(m => m.totalHoursThisMonth / 4), // Simple avg
          backgroundColor: 'rgba(168, 85, 247, 0.7)',
        }
      ]
    };

    // 5. Top Performers (Top 5 by Productivity)
    const sortedByProductivity = [...members]
      .sort((a, b) => b.productiveHoursPercentage - a.productiveHoursPercentage)
      .slice(0, 5);

    const topPerformersChart = {
      labels: sortedByProductivity.map(s => s.fullName),
      datasets: [{
        label: 'Productivity Score (%)',
        data: sortedByProductivity.map(s => s.productiveHoursPercentage),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderRadius: 4,
        barThickness: 20
      }]
    };

    // 6. Efficiency Matrix (Radar - Top 5 Members)
    // Select top 5 members to avoid cluttered chart
    const radarMembers = members.slice(0, 5);
    const colors = [
      'rgba(59, 130, 246, 0.3)',
      'rgba(16, 185, 129, 0.3)',
      'rgba(245, 158, 11, 0.3)',
      'rgba(239, 68, 68, 0.3)',
      'rgba(168, 85, 247, 0.3)'
    ];
    
    const efficiencyMatrix = {
      labels: ['Productivity', 'Hours Worked', 'Utilization', 'Consistency', 'Availability'],
      datasets: radarMembers.map((m, idx) => {
        return {
          label: m.fullName,
          data: [
            m.productiveHoursPercentage,
            Math.min((m.totalHoursThisWeek / 40) * 100, 100), // Normalize to 100 scale (assuming 40h week)
            Math.min(m.utilizationPercentage, 100),
            Math.min(((m.totalHoursThisMonth / 4) / 40) * 100, 100), // Consistency based on monthly avg
            Math.max(0, 100 - m.utilizationPercentage)
          ],
          backgroundColor: colors[idx],
          borderColor: colors[idx].replace('0.3', '1'),
          borderWidth: 2
        };
      })
    };

    // 7. Task Hours Comparison (Estimated vs Actual)
    const taskHoursChart = {
      labels: labels,
      datasets: [
        {
          label: 'Estimated Hours',
          data: members.map(m => m.totalEstimatedHours || 0),
          backgroundColor: 'rgba(59, 130, 246, 0.7)', // Blue
          borderRadius: 4
        },
        {
          label: 'Actual Hours',
          data: members.map(m => m.totalActualHours || 0),
          backgroundColor: 'rgba(34, 47, 43, 0.7)', // Green
          borderRadius: 4
        }
      ]
    };

    setChartData({
      allocation: allocationChart,
      productivity: productivityChart,
      utilizationDistribution,
      weekVsMonth: weekVsMonthChart,
      topPerformers: topPerformersChart,
      efficiencyMatrix,
      taskHours: taskHoursChart
    });
  };

  const allocationOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: false }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Hours' } }
    }
  };

  const productivityOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { position: 'top' }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'Hours' }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Productivity %' },
        min: 0,
        max: 100
      }
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
    <div className={embedded ? "" : "min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"}>
      <div className={embedded ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}>
        
        {/* Header */}
        {!embedded && (
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center mb-2">
                  <UserGroupIcon className="h-10 w-10 mr-3 text-blue-600" />
                  Resource Intelligence Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  Real-time insights into team performance, workload distribution, and efficiency metrics
                </p>
              </div>
              
              <button 
                onClick={fetchProjectData}
                className="flex items-center px-6 py-3 bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-lg shadow-lg text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-all duration-200 hover:scale-105"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Refresh Data
              </button>
            </div>
            
            {/* Custom Project Selector */}
            <div className="bg-gradient-to-r from-white via-blue-50 to-purple-50 rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-blue-300 transition-all duration-300 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:hover:border-purple-600">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <label className="text-base font-bold text-gray-800 dark:text-gray-200 flex items-center">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-2 mr-3 shadow-md">
                    <ChartBarIcon className="h-6 w-6 text-white" />
                  </div>
                  Select Project:
                </label>
                
                {/* Custom Dropdown */}
                <div className="relative flex-1 max-w-xl">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-6 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                    <span className="text-base font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors">
                      {userProjects.find(p => p.id === projectId)?.name || 'Select a project'}
                    </span>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {userProjects.map((project, index) => (
                        <button
                          key={project.id}
                          onClick={() => {
                            setProjectId(project.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-6 py-4 text-left flex items-center gap-4 transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 group ${
                            projectId === project.id ? 'bg-gradient-to-r from-blue-100 to-purple-100 border-l-4 border-blue-500' : 'hover:border-l-4 hover:border-purple-400'
                          }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-md ${
                            projectId === project.id 
                              ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                              : 'bg-gradient-to-br from-gray-400 to-gray-500 group-hover:from-blue-400 group-hover:to-purple-500'
                          } transition-all duration-300`}>
                            {project.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className={`font-semibold transition-colors ${
                              projectId === project.id ? 'text-blue-700' : 'text-gray-800 group-hover:text-blue-600'
                            }`}>
                              {project.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-0.5">
                              {project.description || 'No description'}
                            </div>
                          </div>
                          {projectId === project.id && (
                            <div className="flex-shrink-0">
                              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Project Stats */}
            {projectId && (
              <div className="mt-4 flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300 animate-slideDown">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Active Project</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-4 w-4 text-blue-500" />
                  <span>{dashboardData.workload?.totalTeamMembers || 0} Members</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-purple-500" />
                  <span>{dashboardData.workload?.totalCapacityHours || 0}h Capacity</span>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Custom Styles */}
        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
          }

          .animate-slideDown {
            animation: slideDown 0.4s ease-out forwards;
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #3b82f6, #a855f7);
            border-radius: 10px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #2563eb, #9333ea);
          }
        `}</style>

        {/* KPI Cards */}
        {dashboardData.workload && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Avg. Utilization</p>
                  <h3 className="text-4xl font-bold">
                    {dashboardData.workload.averageUtilization?.toFixed(1) || 0}%
                  </h3>
                </div>
                <div className="bg-white dark:bg-gray-800 bg-opacity-20 rounded-full p-3">
                  <ScaleIcon className="h-8 w-8" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 bg-opacity-20 rounded-lg px-3 py-2 text-sm">
                Target: 70-90% • {dashboardData.workload.averageUtilization > 90 ? '⚠️ High' : dashboardData.workload.averageUtilization < 50 ? '📉 Low' : '✅ Optimal'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Total Allocated</p>
                  <h3 className="text-4xl font-bold">
                    {dashboardData.workload.totalAllocatedHours || 0}
                    <span className="text-xl font-normal ml-2">hrs</span>
                  </h3>
                </div>
                <div className="bg-white dark:bg-gray-800 bg-opacity-20 rounded-full p-3">
                  <ClockIcon className="h-8 w-8" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 bg-opacity-20 rounded-lg px-3 py-2 text-sm">
                Capacity: {dashboardData.workload.totalCapacityHours}h • Available: {(dashboardData.workload.totalCapacityHours || 0) - (dashboardData.workload.totalAllocatedHours || 0)}h
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform duration-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-orange-100 text-sm font-medium mb-1">Overloaded Members</p>
                  <h3 className="text-4xl font-bold">
                    {dashboardData.mergedMembers.filter(m => m.utilizationPercentage > 100).length}
                    <span className="text-xl font-normal ml-2">/ {dashboardData.workload.totalTeamMembers}</span>
                  </h3>
                </div>
                <div className="bg-white dark:bg-gray-800 bg-opacity-20 rounded-full p-3">
                  <ExclamationCircleIcon className="h-8 w-8" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 bg-opacity-20 rounded-lg px-3 py-2 text-sm">
                {dashboardData.mergedMembers.filter(m => m.utilizationPercentage > 100).length > 0 ? '⚠️ Needs rebalancing' : '✅ All balanced'}
              </div>
            </div>
          </div>
        )}

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <div className="bg-blue-100 rounded-lg p-2 mr-3">
                  <ScaleIcon className="h-6 w-6 text-blue-600" />
                </div>
                Workload Distribution
              </h3>
            </div>
            <div className="h-80">
              {chartData.allocation ? <Bar options={allocationOptions} data={chartData.allocation} /> : <p className="text-center text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-20">No data available</p>}
            </div>
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <span className="font-semibold">⚠️ Alert:</span> Red bars indicate members exceeding 100% capacity
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <div className="bg-green-100 rounded-lg p-2 mr-3">
                  <SparklesIcon className="h-6 w-6 text-green-600" />
                </div>
                Efficiency Analysis
              </h3>
            </div>
            <div className="h-80">
              {chartData.productivity ? <Bar options={productivityOptions} data={chartData.productivity} /> : <p className="text-center text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-20">No data available</p>}
            </div>
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              <span className="font-semibold">💡 Insight:</span> Compares total hours worked vs productive work percentage
            </div>
          </div>
        </div>

        {/* Advanced Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <div className="bg-purple-100 rounded-lg p-2 mr-3">
                <ChartBarIcon className="h-5 w-5 text-purple-600" />
              </div>
              Team Distribution
            </h3>
            <div className="h-64 flex items-center justify-center">
              {chartData.utilizationDistribution && (
                <Doughnut 
                  data={chartData.utilizationDistribution}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
                    }
                  }}
                />
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <div className="bg-indigo-100 rounded-lg p-2 mr-3">
                <ClockIcon className="h-5 w-5 text-indigo-600" />
              </div>
              Time Trends (Weekly vs Monthly)
            </h3>
            <div className="h-64">
              {chartData.weekVsMonth && (
                <Bar 
                  data={chartData.weekVsMonth}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top', labels: { font: { size: 10 } } } },
                    scales: { y: { beginAtZero: true } }
                  }}
                />
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <div className="bg-yellow-100 rounded-lg p-2 mr-3">
                <TrophyIcon className="h-5 w-5 text-yellow-600" />
              </div>
              Top Performers
            </h3>
            <div className="h-64">
              {chartData.topPerformers && (
                <Bar 
                  data={chartData.topPerformers}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { x: { beginAtZero: true, max: 100 } }
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Efficiency Matrix */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 mb-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
            <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg p-2 mr-3">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            Multi-Dimensional Performance Matrix
          </h3>
          <div className="h-96">
            {chartData.efficiencyMatrix && (
              <Radar 
                data={chartData.efficiencyMatrix}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      angleLines: { display: true },
                      suggestedMin: 0,
                      suggestedMax: 100
                    }
                  },
                  plugins: { legend: { position: 'right' } }
                }}
              />
            )}
          </div>
          <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
            <span className="font-semibold">📊 Matrix Explanation:</span> Compares 5 key metrics - higher values indicate better overall performance balance.
          </div>
        </div>

        {/* Task Hours Comparison Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 mb-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
            <div className="bg-gradient-to-r from-blue-100 to-green-100 rounded-lg p-2 mr-3">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
            Task Hours: Estimated vs Actual
          </h3>
          <div className="h-80">
            {chartData.taskHours && (
              <Bar 
                data={chartData.taskHours}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: false }
                  },
                  scales: {
                    y: { 
                      beginAtZero: true, 
                      title: { display: true, text: 'Hours' } 
                    }
                  }
                }}
              />
            )}
          </div>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            <span className="font-semibold">⏱️ Hours Analysis:</span> Compare estimated vs actual hours spent on tasks by each team member. Green bars exceeding blue indicate tasks taking longer than estimated.
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-purple-600">
            <h3 className="text-xl font-bold text-white flex items-center">
              <UserGroupIcon className="h-6 w-6 mr-2" />
              Detailed Resource Status
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Member</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Utilization</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Allocated / Capacity</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Productivity</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">This Week</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {dashboardData.mergedMembers.map((member, index) => (
                  <tr key={index} className="hover:bg-blue-50 transition-colors dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {member.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{member.fullName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{member.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ${
                        member.calculatedStatus === 'Overloaded' ? 'bg-red-100 text-red-800 border border-red-300' :
                        member.calculatedStatus === 'Optimal' ? 'bg-green-100 text-green-800 border border-green-300' :
                        member.calculatedStatus === 'Available' ? 'bg-gray-100 text-gray-800 border border-gray-300' :
                        'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      }`}>
                        {member.calculatedStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{member.utilizationPercentage.toFixed(1)}%</div>
                        <div className="ml-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              member.utilizationPercentage > 100 ? 'bg-red-500' :
                              member.utilizationPercentage > 70 ? 'bg-green-500' :
                              'bg-yellow-500'
                            }`}
                            style={{width: `${Math.min(member.utilizationPercentage, 100)}%`}}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {member.allocatedHours} / {member.capacityHours} hrs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {member.productiveHoursPercentage.toFixed(1)}%
                        </span>
                        {member.productiveHoursPercentage > 80 && (
                          <span className="ml-2">🌟</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {member.totalHoursThisWeek.toFixed(1)} hrs
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm">
          <p>Last updated: {new Date().toLocaleString()} • Data sourced from Workload & Task Services</p>
        </div>
      </div>
    </div>
  );
};

export default TeamResourceDashboard;