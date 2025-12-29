import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import {
  ArrowLeftIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';
import ProjectTasksView from '../team-lead/ProjectTasksView';
import TeamManagement from './TeamManagement';
import TeamResourceDashboard from './TeamResourceDashboard';

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

const ProjectDetailsHub = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('overview');
  
  // Project state
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [taskStats, setTaskStats] = useState(null);
  
  // Team state
  const [teamMembers, setTeamMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [teamSearchTerm, setTeamSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [workloadData, setWorkloadData] = useState({});
  
  // Resource state
  const [dashboardData, setDashboardData] = useState({
    workload: null,
    timeStats: [],
    mergedMembers: []
  });
  const [chartData, setChartData] = useState({});
  
  const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'TESTING', 'DONE', 'CANCELLED'];
  const PROJECT_ROLES = ['DEVELOPER', 'DESIGNER', 'TESTER', 'ANALYST', 'ARCHITECT', 'LEAD'];

  // Load initial data
  useEffect(() => {
    loadProjectDetails();
    loadTasks();
    // ✅ Removed loadTeamMembers() - TeamManagement handles its own data
    // ✅ Removed loadAllUsers() - Not needed here
    loadResourceData();
  }, [projectId]);

  // Filter tasks when dependencies change
  useEffect(() => {
    filterTasks();
  }, [tasks, taskSearchTerm, taskStatusFilter, taskAssigneeFilter]);

  const loadProjectDetails = async () => {
    try {
      const response = await apiService.getProject(projectId);
      setProject(response.result || response.data);
    } catch (error) {
      console.error('Failed to load project details:', error);
    }
  };

  const loadTasks = async () => {
    try {
      // ✅ Gọi API lấy tasks theo projectId thay vì lấy tất cả rồi filter
      const response = await apiService.getTasksByProject(projectId);
      console.log('Tasks response:', response);
      const projectTasks = response || [];
      
      setTasks(projectTasks);
      
      // Calculate task stats
      const stats = {
        total: projectTasks.length,
        todo: projectTasks.filter(t => t.status === 'TODO').length,
        inProgress: projectTasks.filter(t => t.status === 'IN_PROGRESS').length,
        review: projectTasks.filter(t => t.status === 'REVIEW').length,
        testing: projectTasks.filter(t => t.status === 'TESTING').length,
        done: projectTasks.filter(t => t.status === 'DONE').length,
        overdue: projectTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE').length,
        thisWeekDue: projectTasks.filter(t => {
          if (!t.dueDate) return false;
          const due = new Date(t.dueDate);
          const now = new Date();
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          return due >= now && due <= weekFromNow;
        }).length
      };
      setTaskStats(stats);
      
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Removed loadTeamMembers() - handled by TeamManagement component
  // ✅ Removed loadAllUsers() - not needed here
  // ✅ Removed fetchWorkloadForMember() - TeamManagement handles workload

  const loadResourceData = async () => {
    try {
      const [workloadRes, timeStatsRes, taskHoursRes] = await Promise.all([
        apiService.getProjectWorkload(projectId),
        apiService.getProjectWorkTimeStats(projectId, 'WEEKLY'),
        apiService.getTaskHoursStats(projectId)
      ]);

      const workloadResult = workloadRes.data || workloadRes;
      const timeStatsResult = timeStatsRes.data?.result || timeStatsRes.result || [];
      const taskHoursStatsResult = taskHoursRes.data?.result || taskHoursRes;

      const allUserIds = new Set([
        ...(workloadResult.teamMembers || []).map(m => m.userId),
        ...(taskHoursStatsResult || []).map(t => t.userId),
        ...(timeStatsResult || []).map(t => t.userId)
      ]);

      const mergedMembers = Array.from(allUserIds).map(userId => {
        const workloadMember = (workloadResult.teamMembers || []).find(m => m.userId === userId);
        const stats = timeStatsResult.find(t => t.userId === userId);
        const taskHoursStats = (taskHoursStatsResult || []).find(th => th.userId === userId);

        const fullName = stats?.fullName 
          || workloadMember?.userName 
          || taskHoursStats?.userName 
          || 'Unknown User';

        return {
          userId: userId,
          fullName: fullName,
          employeeId: stats?.employeeId || 'N/A',
          capacityHours: workloadMember?.capacityHours || 0,
          allocatedHours: workloadMember?.allocatedHours || 0,
          utilizationPercentage: workloadMember?.utilizationPercentage || 0,
          totalHoursThisWeek: stats?.totalHoursThisWeek || 0,
          totalHoursThisMonth: stats?.totalHoursThisMonth || 0,
          productiveHoursPercentage: stats?.productiveHoursPercentage || 0,
          tasks: taskHoursStats?.tasks || [],
          totalEstimatedHours: taskHoursStats?.totalEstimatedHours || 0,
          totalActualHours: taskHoursStats?.totalActualHours || 0,
          hoursVariance: taskHoursStats?.hoursVariance || 0,
          taskCount: taskHoursStats?.taskCount || 0,
          calculatedStatus: getMemberStatus(workloadMember?.utilizationPercentage || 0)
        };
      });

      setDashboardData({
        workload: workloadResult,
        timeStats: timeStatsResult,
        mergedMembers: mergedMembers
      });

      // ✅ Set teamMembers from workload result for overview tab display
      if (workloadResult.teamMembers) {
        setTeamMembers(workloadResult.teamMembers);
      }

      processCharts(mergedMembers);

    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    }
  };

  const getMemberStatus = (utilization) => {
    if (utilization > 100) return 'Overloaded';
    if (utilization >= 70) return 'Optimal';
    if (utilization > 0) return 'Underutilized';
    return 'Available';
  };

  const processCharts = (members) => {
    if (!members || members.length === 0) return;
    
    const labels = members.map(m => m.fullName);

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
          'rgba(156, 163, 175, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderWidth: 1
      }]
    };

    setChartData({
      allocation: allocationChart,
      productivity: productivityChart,
      utilizationDistribution
    });
  };

  const filterTasks = () => {
    let filtered = tasks;

    if (taskSearchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
        task.assigneeName?.toLowerCase().includes(taskSearchTerm.toLowerCase())
      );
    }

    if (taskStatusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === taskStatusFilter);
    }

    if (taskAssigneeFilter !== 'all') {
      filtered = filtered.filter(task => task.assigneeId === taskAssigneeFilter);
    }

    setFilteredTasks(filtered);
  };

  // ✅ Removed console.log that was causing logs on every render

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Project Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{project?.name || 'Loading...'}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{project?.description || 'No description available'}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{project?.status || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Priority</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{project?.priority || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Progress</p>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600"
                  style={{ width: `${project?.completionPercentage || 0}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{Math.round(project?.completionPercentage) || 0}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {project?.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {project?.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Budget</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              ${project?.budget?.toLocaleString() || '0'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {taskStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{taskStats.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Tasks</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{taskStats.todo}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">To Do</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">In Progress</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{taskStats.review}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Review</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{taskStats.testing}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Testing</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{taskStats.done}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Done</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Overdue</div>
          </div>
        </div>
      )}

      {/* Team Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Team Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">{teamMembers.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Members</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {dashboardData.mergedMembers.filter(m => m.calculatedStatus === 'Optimal').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Optimal Load</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {dashboardData.mergedMembers.filter(m => m.calculatedStatus === 'Overloaded').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Overloaded</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/project-manager/projects')}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Projects
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {project?.name || 'Project Details'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Comprehensive project management hub
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`${
                  activeTab === 'overview'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <InformationCircleIcon className="h-5 w-5 mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`${
                  activeTab === 'tasks'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                Tasks
                {taskStats && <span className="ml-2 bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full text-xs">{taskStats.total}</span>}
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`${
                  activeTab === 'team'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <UserGroupIcon className="h-5 w-5 mr-2" />
                Team
                {teamMembers && <span className="ml-2 bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full text-xs">{teamMembers.length}</span>}
              </button>
              <button
                onClick={() => setActiveTab('resource')}
                className={`${
                  activeTab === 'resource'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Resource Insights
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'tasks' && (
          <div>
            <ProjectTasksView embedded={true} />
          </div>
        )}
        {activeTab === 'team' && (
          <div>
            <TeamManagement embedded={true} projectId={projectId} />
          </div>
        )}
        {activeTab === 'resource' && (
          <div>
            <TeamResourceDashboard embedded={true} projectId={projectId} />
          </div>
        )}

      </div>
    </div>
  );
};

export default ProjectDetailsHub;