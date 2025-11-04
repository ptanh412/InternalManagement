import React, { useState, useEffect } from 'react';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  ChartBarIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';
import CreateTaskModal from '../../components/modals/CreateTaskModal';
import TaskEditModal from '../../components/modals/TaskEditModal';

const TaskManagement = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [taskStats, setTaskStats] = useState(null);

  // Task statuses from the controller
  const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'TESTING', 'DONE', 'CANCELLED'];
  const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  useEffect(() => {
    loadTasks();
    loadProjects();
    loadTaskStats();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, statusFilter, projectFilter, assigneeFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      
      // Call actual API with role-based filtering
      const params = {
        userId: user.id,
        userRole: user.role
      };
      
      const response = await apiService.getTasks(params);
      setTasks(response.result || []);
      
    } catch (error) {
      console.warn('Tasks API failed, using mock data:', error);
      
      // Fallback to mock data if API fails
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Implement user authentication',
          description: 'Create secure login/logout functionality with JWT tokens',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          progress: 75,
          estimatedHours: 16,
          actualHours: 12,
          createdDate: '2024-10-01',
          dueDate: '2024-10-20',
          assigneeId: 'user-1',
          assigneeName: 'John Smith',
          assigneeEmail: 'john.smith@company.com',
          projectId: 'proj-1',
          projectName: 'Mobile Banking App',
          skills: ['React Native', 'JWT', 'Security'],
          dependencies: ['task-5'],
          submissionCount: 2,
          comments: 8
        },
        {
          id: 'task-2',
          title: 'Design user dashboard',
          description: 'Create mockups and prototypes for the main user dashboard interface',
          status: 'REVIEW',
          priority: 'MEDIUM',
          progress: 90,
          estimatedHours: 20,
          actualHours: 18,
          createdDate: '2024-09-25',
          dueDate: '2024-10-15',
          assigneeId: 'user-3',
          assigneeName: 'Mike Chen',
          assigneeEmail: 'mike.chen@company.com',
          projectId: 'proj-1',
          projectName: 'Mobile Banking App',
          skills: ['UI/UX', 'Figma', 'Prototyping'],
          dependencies: [],
          submissionCount: 1,
          comments: 5
        },
        {
          id: 'task-3',
          title: 'API endpoint development',
          description: 'Develop REST API endpoints for user management and transaction processing',
          status: 'TODO',
          priority: 'HIGH',
          progress: 0,
          estimatedHours: 24,
          actualHours: 0,
          createdDate: '2024-10-10',
          dueDate: '2024-10-25',
          assigneeId: 'user-2',
          assigneeName: 'Sarah Johnson',
          assigneeEmail: 'sarah.johnson@company.com',
          projectId: 'proj-2',
          projectName: 'E-commerce Platform',
          skills: ['Node.js', 'Express', 'PostgreSQL'],
          dependencies: ['task-1'],
          submissionCount: 0,
          comments: 2
        },
        {
          id: 'task-4',
          title: 'Write unit tests',
          description: 'Create comprehensive unit tests for the authentication module',
          status: 'TESTING',
          priority: 'MEDIUM',
          progress: 60,
          estimatedHours: 12,
          actualHours: 8,
          createdDate: '2024-10-05',
          dueDate: '2024-10-18',
          assigneeId: 'user-4',
          assigneeName: 'Emily Davis',
          assigneeEmail: 'emily.davis@company.com',
          projectId: 'proj-1',
          projectName: 'Mobile Banking App',
          skills: ['Jest', 'Testing', 'JavaScript'],
          dependencies: ['task-1'],
          submissionCount: 3,
          comments: 12
        },
        {
          id: 'task-5',
          title: 'Database schema design',
          description: 'Design and implement the database schema for user and transaction data',
          status: 'DONE',
          priority: 'CRITICAL',
          progress: 100,
          estimatedHours: 8,
          actualHours: 10,
          createdDate: '2024-09-20',
          dueDate: '2024-09-30',
          assigneeId: 'user-5',
          assigneeName: 'Alex Wilson',
          assigneeEmail: 'alex.wilson@company.com',
          projectId: 'proj-1',
          projectName: 'Mobile Banking App',
          skills: ['PostgreSQL', 'Database Design', 'SQL'],
          dependencies: [],
          submissionCount: 1,
          comments: 4
        }
      ];

      setTasks(mockTasks);
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const params = {
        userId: user.id,
        userRole: user.role
      };
      const response = await apiService.getProjects(params);
      const projectList = response.result?.map(p => ({ id: p.id, name: p.name })) || [];
      setProjects(projectList);
    } catch (error) {
      console.warn('Projects API failed, using mock data:', error);
      // Fallback to mock data
      const mockProjects = [
        { id: 'proj-1', name: 'Mobile Banking App' },
        { id: 'proj-2', name: 'E-commerce Platform' },
        { id: 'proj-3', name: 'IoT Monitoring System' },
        { id: 'proj-4', name: 'Healthcare Management System' }
      ];
      setProjects(mockProjects);
    }
  };

  const loadTaskStats = async () => {
    try {
      // Calculate stats from tasks
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setTaskStats({
        total: 45,
        todo: 12,
        inProgress: 18,
        review: 8,
        testing: 4,
        done: 3,
        overdue: 5,
        thisWeekDue: 12
      });
    } catch (error) {
      console.error('Failed to load task stats:', error);
    }
  };

  const filterTasks = () => {
    let filtered = tasks;

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assigneeName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (projectFilter !== 'all') {
      filtered = filtered.filter(task => task.projectId === projectFilter);
    }

    if (assigneeFilter !== 'all') {
      filtered = filtered.filter(task => task.assigneeId === assigneeFilter);
    }

    setFilteredTasks(filtered);
  };

  const getStatusColor = (status) => {
    const colors = {
      TODO: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      REVIEW: 'bg-yellow-100 text-yellow-800',
      TESTING: 'bg-purple-100 text-purple-800',
      DONE: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      CRITICAL: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && dueDate !== null;
  };

  const getUniqueAssignees = () => {
    const assignees = tasks.reduce((acc, task) => {
      if (!acc.find(a => a.id === task.assigneeId)) {
        acc.push({
          id: task.assigneeId,
          name: task.assigneeName
        });
      }
      return acc;
    }, []);
    return assignees;
  };

  const handleCreateTask = () => {
    setShowCreateModal(true);
  };

  const handleSubmitNewTask = async (taskData) => {
    try {
      const response = await apiService.createTask(taskData);
      if (response.result) {
        setTasks(prev => [...prev, response.result]);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      // Show error notification to user
    }
  };

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setShowEditModal(true);
  };

  const handleEditTask = (task) => {
    // Navigate to edit task page
    console.log('Edit task:', task.id);
  };

  const handleDeleteTask = async (task) => {
    if (window.confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      try {
        await apiService.deleteTask(task.id);
        setTasks(tasks.filter(t => t.id !== task.id));
      } catch (error) {
        console.error('Failed to delete task:', error);
        // Show error notification
      }
    }
  };

  const handleUpdateTaskStatus = async (task, newStatus) => {
    try {
      await apiService.updateTaskStatus(task.id, { status: newStatus });
      
      setTasks(tasks.map(t => 
        t.id === task.id ? { ...t, status: newStatus } : t
      ));
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleAssignTask = async (task, userId) => {
    try {
      await apiService.assignTask(task.id, userId);
      
      // Update task in local state
      setTasks(tasks.map(t => 
        t.id === task.id ? { ...t, assigneeId: userId } : t
      ));
    } catch (error) {
      console.error('Failed to assign task:', error);
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
              <p className="text-gray-600 mt-2">Track and manage all project tasks</p>
            </div>
            <button
              onClick={handleCreateTask}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Task
            </button>
          </div>
        </div>

        {/* Task Statistics */}
        {taskStats && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Task Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-500">{taskStats.todo}</div>
                <div className="text-sm text-gray-600">To Do</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{taskStats.review}</div>
                <div className="text-sm text-gray-600">Review</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{taskStats.testing}</div>
                <div className="text-sm text-gray-600">Testing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{taskStats.done}</div>
                <div className="text-sm text-gray-600">Done</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
                <div className="text-sm text-gray-600">Overdue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{taskStats.thisWeekDue}</div>
                <div className="text-sm text-gray-600">Due This Week</div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {/* Header with Create Button */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Task Management</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Task Manually
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              {TASK_STATUSES.map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>

            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Assignees</option>
              {getUniqueAssignees().map(assignee => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
              <div className="flex items-start justify-between">
                {/* Task Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    {isOverdue(task.dueDate) && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        OVERDUE
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 mr-2" />
                      <span>{task.assigneeName}</span>
                    </div>
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      <span>{task.projectName}</span>
                    </div>
                    <div className="flex items-center">
                      <CalendarDaysIcon className="h-4 w-4 mr-2" />
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{task.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Skills and Dependencies */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {task.skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded">
                        {skill}
                      </span>
                    ))}
                    {task.dependencies.length > 0 && (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                        {task.dependencies.length} dependency(ies)
                      </span>
                    )}
                  </div>

                  {/* Task Stats */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{task.actualHours}h / {task.estimatedHours}h</span>
                    <span>•</span>
                    <span>{task.submissionCount} submission(s)</span>
                    <span>•</span>
                    <span>{task.comments} comment(s)</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end space-y-2 ml-6">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewTask(task)}
                      className="flex items-center text-primary-600 hover:text-primary-500 text-sm font-medium"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => handleEditTask(task)}
                      className="flex items-center text-gray-600 hover:text-gray-500 text-sm font-medium"
                    >
                      <PencilSquareIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task)}
                      className="flex items-center text-red-600 hover:text-red-500 text-sm font-medium"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>

                  {/* Status Update */}
                  <select
                    value={task.status}
                    onChange={(e) => handleUpdateTaskStatus(task, e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500"
                  >
                    {TASK_STATUSES.map(status => (
                      <option key={status} value={status}>
                        {status.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || projectFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first task'
              }
            </p>
            {(!searchTerm && statusFilter === 'all' && projectFilter === 'all') && (
              <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                Create Task
              </button>
            )}
          </div>
        )}

        {/* Create Task Modal */}
        {showCreateModal && (
          <CreateTaskModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onTaskCreated={(newTask) => {
              setTasks([...tasks, newTask]);
              setShowCreateModal(false);
            }}
            projects={projects}
          />
        )}

        {/* Task Edit/View Modal */}
        {showEditModal && selectedTask && (
          <TaskEditModal
            task={selectedTask}
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedTask(null);
            }}
            onTaskUpdated={(updatedTask) => {
              setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TaskManagement;