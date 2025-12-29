import React, { useState, useEffect } from 'react';
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
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { 
  ClockIcon, 
  CalendarDaysIcon, 
  BoltIcon, 
  ChartBarIcon,
  BriefcaseIcon,
  FireIcon,
  ArrowPathIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../hooks/useAuth';

// Register ChartJS
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const PersonalProductivityDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('MONTHLY');
  
  // State data
  const [workload, setWorkload] = useState(null);
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState({
    weeklyTrend: null,
    projectDistribution: null,
    taskTypeDistribution: null,
    projectTaskHours: null
  });

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user, period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Gọi song song 2 API (workload + stats)
      const [workloadRes, statsRes] = await Promise.all([
        apiService.getUserWorkload(user.id),
        apiService.getMyWorkTimeStatistics(period)
      ]);

      const workloadData = workloadRes.data?.result || workloadRes.result;
      const statsData = statsRes.data?.result || statsRes.result;
      
      console.log("Fetched workload data:", workloadData);
      console.log("Fetched stats data:", statsData);
      
      setWorkload(workloadData);
      setStats(statsData);
      processCharts(statsData, null); // Employee doesn't need project-level task hours

    } catch (error) {
      console.error("Failed to fetch personal dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const processCharts = (data, taskHours) => {
    if (!data) return;

    // 1. Weekly Trends (Hours vs Productivity)
    const weeks = data.weeklyTrends || [];
    const weeklyTrendChart = {
      labels: weeks.map(w => w.weekOf),
      datasets: [
        {
          label: 'Total Hours',
          data: weeks.map(w => w.totalHours),
          borderColor: '#3B82F6', // Blue
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          yAxisID: 'y',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Productivity %',
          data: weeks.map(w => w.productivity),
          borderColor: '#10B981', // Green
          backgroundColor: 'transparent',
          yAxisID: 'y1',
          type: 'line',
          borderDash: [5, 5],
          tension: 0.4
        }
      ]
    };

    // 2. Time by Project
    const projects = data.timeByProject || {};
    const projectChart = {
      labels: Object.keys(projects),
      datasets: [{
        data: Object.values(projects),
        backgroundColor: [
          '#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6'
        ],
        borderWidth: 0
      }]
    };

    // 3. Time by Task Type
    const types = data.timeByTaskType || {};
    const typeChart = {
      labels: Object.keys(types),
      datasets: [{
        label: 'Hours',
        data: Object.values(types),
        backgroundColor: '#818CF8',
        borderRadius: 4
      }]
    };

    // Note: Project Task Hours chart removed for employees as it's not relevant
    // Employees track personal time statistics, not project-level estimates

    setCharts({
      weeklyTrend: weeklyTrendChart,
      projectDistribution: projectChart,
      taskTypeDistribution: typeChart,
      projectTaskHours: null // Employee dashboard doesn't show project task hours
    });

    console.log("Processed charts data:", {
      projectDistribution: projectChart,
    });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Productivity Hub</h1>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">Overview of your current capacity and historical performance</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-1 flex dark:border-gray-700">
              {['WEEKLY', 'MONTHLY', 'YEARLY'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    period === p 
                      ? 'bg-blue-100 text-blue-700 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <button onClick={fetchData} className="p-2 bg-white dark:bg-gray-800 border rounded-full hover:bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 dark:text-gray-500">
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* SECTION 1: Current Workload (API: /workloads/{userId}) */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <BoltIcon className="h-5 w-5 mr-2 text-yellow-500" />
            Current Capacity & Load
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Utilization Gauge */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
              <div className="relative w-32 h-32">
                 <Doughnut 
                    data={{
                      labels: ['Used', 'Remaining'],
                      datasets: [{
                        data: [workload?.totalEstimateHours || 0, Math.max(0, (workload?.weeklyCapacityHours || 0) - (workload?.totalEstimateHours || 0))],
                        backgroundColor: [workload?.utilizationPercentage > 100 ? '#EF4444' : '#3B82F6', '#E5E7EB'],
                        borderWidth: 0,
                        cutout: '80%'
                      }]
                    }}
                    options={{ plugins: { tooltip: { enabled: false }, legend: { display: false } } }}
                 />
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{workload?.utilizationPercentage?.toFixed(0)}%</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Utilization</span>
                 </div>
              </div>
              <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-300">
                {workload?.totalEstimateHours}h allocated of {workload?.weeklyCapacityHours}h capacity
              </p>
            </div>

            {/* Workload Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Availability Score</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{workload?.availabilityPercentage?.toFixed(0)}%</h3>
                  <span className={`text-sm mb-1 font-medium ${workload?.availabilityPercentage > 50 ? 'text-green-600' : 'text-red-500'}`}>
                    {workload?.availabilityPercentage > 50 ? 'Available' : 'Busy'}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Current Tasks</span>
                  <span className="font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                    {workload?.currentTasksCount} Active
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
               <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Upcoming Work (Next 7 days)</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{workload?.upcomingWeekHours}h</h3>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                 <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                    Next Free: <span className="ml-1 font-medium text-blue-600">{workload?.nextAvailableDate}</span>
                 </div>
              </div>
            </div>

            {/* Quick Actions / Status */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white flex flex-col justify-between">
               <div>
                  <h3 className="font-semibold text-lg">Work Status</h3>
                  <p className="text-blue-100 text-sm mt-1">
                    {workload?.availabilityPercentage > 20 ? "You have capacity for new tasks." : "You are currently at high capacity."}
                  </p>
               </div>
               <button className="bg-white dark:bg-gray-800 text-blue-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                  View My Tasks
               </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: Historical Statistics (API: /work-time/statistics/my-time) */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-blue-500" />
            Performance Analytics ({period.toLowerCase()})
          </h2>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
             <StatCard 
                title="Total Hours" 
                value={stats?.totalHoursThisMonth?.toFixed(1) || 0} 
                subtext={`Avg ${stats?.averageHoursPerDay?.toFixed(1)}h / day`}
                icon={ClockIcon} 
                color="blue"
             />
             <StatCard 
                title="Productivity" 
                value={`${stats?.productiveHoursPercentage?.toFixed(1)}%`} 
                subtext="Efficiency Score"
                icon={FireIcon} 
                color="orange"
             />
             <StatCard 
                title="Overtime" 
                value={stats?.overtimeHours?.toFixed(1) || 0} 
                subtext="Extra hours"
                icon={CheckBadgeIcon} 
                color="red"
             />
             <StatCard 
                title="Work Pattern" 
                value={stats?.workPatternAnalysis?.replace('_', ' ')} 
                subtext="Consistency"
                icon={CalendarDaysIcon} 
                color="purple"
             />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Weekly Trends Line Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
               <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Work Hours & Productivity Trend</h3>
               <div className="h-72">
                  {charts.weeklyTrend && <Line data={charts.weeklyTrend} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: { beginAtZero: true, title: { display: true, text: 'Hours' } },
                      y1: { position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false }, title: { display: true, text: 'Productivity %' } }
                    }
                  }} />}
               </div>
            </div>

            {/* Project Distribution Doughnut */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
               <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Time by Project</h3>
               <div className="h-56 flex justify-center">
                  {charts.projectDistribution && <Doughnut data={charts.projectDistribution} options={{
                    cutout: '60%',
                    plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 } } } }
                  }} />}
               </div>
               <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Time by Task Type</h3>
                   <div className="h-32">
                    {charts.taskTypeDistribution && <Bar data={charts.taskTypeDistribution} options={{
                      indexAxis: 'y',
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { x: { display: false }, y: { grid: { display: false } } }
                    }} />}
                   </div>
               </div>
            </div>
          </div>

          {/* Project Task Hours Chart */}
          {charts.projectTaskHours && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-blue-100 to-green-100 rounded-lg p-2 mr-3">
                  <BriefcaseIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Task Hours by Project</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Estimated vs Actual hours per project</p>
                </div>
              </div>
              <div className="h-64">
                <Bar data={charts.projectTaskHours} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } }
                  },
                  scales: {
                    y: { 
                      beginAtZero: true, 
                      title: { display: true, text: 'Hours', font: { size: 11 } } 
                    },
                    x: {
                      ticks: { font: { size: 10 } }
                    }
                  }
                }} />
              </div>
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-700">
                <span className="font-semibold">⏱️ Hours Insight:</span> Compare your estimated vs actual time spent on tasks across different projects.
              </div>
            </div>
          )}
          
          {/* Detailed Daily Records (Table) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Daily Records</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Last 5 entries</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase">Productivity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {(stats?.dailyRecords || []).slice(0, 5).map((record, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:bg-gray-900">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center">
                          <BriefcaseIcon className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                          {record.primaryProject}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {record.totalHours.toFixed(1)}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 w-24 mb-1">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(record.productiveHours / record.totalHours) * 100}%` }}></div>
                        </div>
                        <span className="text-xs">{((record.productiveHours / record.totalHours) * 100).toFixed(0)}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            record.workQuality === 'EXCELLENT' ? 'bg-green-100 text-green-700' :
                            record.workQuality === 'GOOD' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                         }`}>
                           {record.workQuality}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subtext, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase">{title}</p>
          <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</h4>
        </div>
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{subtext}</p>
    </div>
  );
};

export default PersonalProductivityDashboard;