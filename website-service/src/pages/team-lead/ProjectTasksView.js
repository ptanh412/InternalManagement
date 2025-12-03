import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  Bars3BottomLeftIcon,
  SparklesIcon,
  CodeBracketIcon,
  PaintBrushIcon,
  BeakerIcon,
  BugAntIcon,
  DocumentCheckIcon,
  ServerIcon,
  WrenchScrewdriverIcon,
  LightBulbIcon,
  CircleStackIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';
import { useApiNotifications } from '../../hooks/useApiNotifications';
import AITaskRecommendationModal from '../../components/modals/AITaskRecommendationModal';
import TaskDetailModal from '../../components/modals/TaskDetailModal';
import TaskEditModal from '../../components/modals/TaskEditModal';
import CreateTaskModal from '../../components/modals/CreateTaskModal';

const ProjectTasksView = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const notify = useApiNotifications();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showAIModal, setShowAIModal] = useState(false);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [showTaskEditModal, setShowTaskEditModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  

  // Get project name from navigation state or fetch it
  const projectName = location.state?.projectName || 'Project Tasks';

  // Task statuses and priorities
  const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'];
  const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  useEffect(() => {
    if (projectId) {
      loadProjectAndTasks();
    }
  }, [projectId]);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  const loadProjectAndTasks = async () => {
    try {
      setLoading(true);
      
      console.log("Loading project and tasks for projectId:", projectId);
      
      // Load project details and tasks in parallel
      const [projectResponse, tasksResponse] = await Promise.all([
        apiService.getProject(projectId).catch((error) => {
          console.warn("Failed to load project:", error);
          return { result: null };
        }),
        apiService.getTasksByProject(projectId).catch((error) => {
          console.warn("Failed to load tasks:", error);
          return [];
        })
      ]);

      // console.log("Project response:", projectResponse);
      console.log("Tasks response:", tasksResponse);

      // Set project info
      if (projectResponse.result) {
        setProject(projectResponse.result);
      }

      // Set tasks - task service returns data directly, not wrapped in result
      if (tasksResponse && Array.isArray(tasksResponse)) {
        const enrichedTasks = await enrichTasksWithUserData(tasksResponse);
        setTasks(enrichedTasks);
      } else if (tasksResponse.result && Array.isArray(tasksResponse.result)) {
        // Fallback for wrapped responses
        const enrichedTasks = await enrichTasksWithUserData(tasksResponse.result);
        setTasks(enrichedTasks);
      } else {
        // Fallback to mock tasks
        const mockTasks = [
          {
            id: 'task-1',
            title: 'Design User Interface',
            description: 'Create wireframes and mockups for the mobile app interface',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            assigneeId: 'user-1',
            assigneeName: 'John Doe',
            createdBy: user.id,
            dueDate: '2024-11-15',
            estimatedHours: 20,
            actualHours: 12,
            projectId: projectId,
            skills: ['UI/UX', 'Figma', 'Design'],
            createdAt: '2024-10-01',
          },
          {
            id: 'task-2',
            title: 'API Integration',
            description: 'Integrate frontend with backend APIs for user authentication',
            status: 'TODO',
            priority: 'MEDIUM',
            assigneeId: 'user-2',
            assigneeName: 'Jane Smith',
            createdBy: user.id,
            dueDate: '2024-11-20',
            estimatedHours: 15,
            actualHours: 0,
            projectId: projectId,
            skills: ['JavaScript', 'API', 'Frontend'],
            createdAt: '2024-10-02',
          },
          {
            id: 'task-3',
            title: 'Testing & QA',
            description: 'Perform comprehensive testing of the mobile application',
            status: 'COMPLETED',
            priority: 'HIGH',
            assigneeId: user.id,
            assigneeName: user.firstName + ' ' + user.lastName,
            createdBy: user.id,
            dueDate: '2024-10-30',
            estimatedHours: 25,
            actualHours: 28,
            projectId: projectId,
            skills: ['Testing', 'QA', 'Mobile'],
            createdAt: '2024-09-28',
          }
        ];
        
        const enrichedMockTasks = await enrichTasksWithUserData(mockTasks);
        setTasks(enrichedMockTasks);
        notify.load.warning('Unable to connect to server. Showing sample task data.');
      }
      
    } catch (error) {
      console.error('Failed to load project tasks:', error);
      notify.load.error('project tasks');
    } finally {
      setLoading(false);
    }
  };

  const enrichTasksWithUserData = async (tasks) => {
    try {
      const enrichedTasks = await Promise.all(
        tasks.map(async (task) => {
          const enrichedTask = { ...task };
          
          // Get assignee name if assigneeId exists and name is not already present
          if (task.assigneeId && !task.assigneeName) {
            try {
              const assigneeResponse = await apiService.getUser(task.assigneeId);
              if (assigneeResponse.result) {
                enrichedTask.assigneeName = `${assigneeResponse.result.firstName} ${assigneeResponse.result.lastName}`;
              }
            } catch (error) {
              console.warn(`Failed to fetch assignee for task ${task.id}:`, error);
              enrichedTask.assigneeName = 'Unknown User';
            }
          }
          
          return enrichedTask;
        })
      );
      
      return enrichedTasks;
    } catch (error) {
      console.error('Failed to enrich task data:', error);
      return tasks;
    }
  };

  const filterTasks = () => {
    let filtered = tasks;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assigneeName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    setFilteredTasks(filtered);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'URGENT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'TODO': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'IN_REVIEW': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'IN_PROGRESS':
        return <ClockIcon className="h-4 w-4 text-blue-600" />;
      case 'IN_REVIEW':
        return <EyeIcon className="h-4 w-4 text-purple-600" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeConfig = (type) => {
    const typeUpper = (type || 'DEVELOPMENT').toUpperCase();
    switch (typeUpper) {
      case 'DEVELOPMENT':
        return { 
          icon: CodeBracketIcon, 
          color: 'bg-blue-100 text-blue-800 border-blue-200', 
          label: 'Development' 
        };
      case 'DESIGN':
        return { 
          icon: PaintBrushIcon, 
          color: 'bg-purple-100 text-purple-800 border-purple-200', 
          label: 'Design' 
        };
      case 'TESTING':
        return { 
          icon: BeakerIcon, 
          color: 'bg-green-100 text-green-800 border-green-200', 
          label: 'Testing' 
        };
      case 'BUG_FIX':
        return { 
          icon: BugAntIcon, 
          color: 'bg-red-100 text-red-800 border-red-200', 
          label: 'Bug Fix' 
        };
      case 'DOCUMENTATION':
        return { 
          icon: DocumentCheckIcon, 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
          label: 'Documentation' 
        };
      case 'DEPLOYMENT':
        return { 
          icon: ServerIcon, 
          color: 'bg-indigo-100 text-indigo-800 border-indigo-200', 
          label: 'Deployment' 
        };
      case 'MAINTENANCE':
        return { 
          icon: WrenchScrewdriverIcon, 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          label: 'Maintenance' 
        };
      case 'RESEARCH':
        return { 
          icon: LightBulbIcon, 
          color: 'bg-amber-100 text-amber-800 border-amber-200', 
          label: 'Research' 
        };
      case 'DATABASE_DEVELOPMENT':
        return { 
          icon: CircleStackIcon, 
          color: 'bg-cyan-100 text-cyan-800 border-cyan-200', 
          label: 'Database' 
        };
      default:
        return { 
          icon: CodeBracketIcon, 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          label: type?.replace('_', ' ') || 'Task' 
        };
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && tasks.find(t => t.dueDate === dueDate)?.status !== 'COMPLETED';
  };

  const handleViewTask = (task) => {
    setSelectedTaskId(task.id);
    setShowTaskDetailModal(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setShowTaskEditModal(true);
  };

  const handleEditFromDetail = (task) => {
    setSelectedTask(task);
    setShowTaskDetailModal(false);
    setShowTaskEditModal(true);
  };

  const handleTaskUpdated = (updatedTask) => {
    // Refresh tasks list after update
    loadProjectAndTasks();
  };

  const handleBackToProjects = () => {
    navigate('/team-lead/projects');
  };

  const handleAITasksGenerated = (newTasks) => {
    // Refresh the tasks list after AI tasks are created
    loadProjectAndTasks();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={handleBackToProjects}
          className="flex items-center text-primary-600 hover:text-primary-500 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Projects
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{projectName}</h1>
        <p className="text-gray-600">Manage tasks and assignments for this project</p>
        
        {project && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
              {project.status?.replace('_', ' ')}
            </span>
            {project.priority && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                {project.priority}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-64"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
              >
                <option value="all">All Status</option>
                {TASK_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
              >
                <option value="all">All Priority</option>
                {TASK_PRIORITIES.map(priority => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              <p className='text-sm'>Create task</p>
            </button>
            
            <button
              onClick={() => setShowAIModal(true)}
              className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              AI Recommend
            </button>
            
          </div>
        </div>
            <div className="text-sm text-gray-600 whitespace-nowrap text-end mt-4">
              {filteredTasks.length} of {tasks.length} tasks
            </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-6">
        {filteredTasks.length > 0 ? (
          <div className="grid gap-4">
            {filteredTasks.map((task) => {
              const typeConfig = getTypeConfig(task.type);
              const TypeIcon = typeConfig.icon;
              
              return (
                <div key={task.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 p-6 border border-gray-100">
                  {/* Header Section */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        {getStatusIcon(task.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                            {isOverdue(task.dueDate) && (
                              <span className="bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-full font-medium">
                                Overdue
                              </span>
                            )}
                          </div>
                          
                          {/* Type Badge */}
                          <div className="mt-2">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full border ${typeConfig.color}`}>
                              <TypeIcon className="h-3.5 w-3.5 mr-1.5" />
                              <span className="text-xs font-medium">{typeConfig.label}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 ml-7 leading-relaxed">{task.description}</p>
                      
                      {/* Task meta info */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 ml-7">
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                          <span className="font-medium">{task.assigneeName || 'Unassigned'}</span>
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center">
                            <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {task.estimatedHours && (
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span>{task.actualHours || 0}h / {task.estimatedHours}h</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Status and Priority Badges */}
                    <div className="flex flex-col gap-2 ml-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)} whitespace-nowrap`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)} whitespace-nowrap`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>

                  {/* Required Skills Section */}
                  {(task.requiredSkills || task.skills || task.tags) && (task.requiredSkills || task.skills || task.tags).length > 0 && (
                    <div className="mb-4 ml-7">
                      <div className="flex items-center gap-2 mb-2">
                        <AcademicCapIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Required Skills</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(task.requiredSkills || task.skills || task.tags || []).map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200 hover:border-indigo-300 transition-colors"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleViewTask(task)}
                      className="flex items-center px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg text-sm font-medium transition-colors"
                    >
                      <EyeIcon className="h-4 w-4 mr-1.5" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleEditTask(task)}
                      className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      <PencilSquareIcon className="h-4 w-4 mr-1.5" />
                      Edit Task
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bars3BottomLeftIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No tasks have been created for this project yet'
              }
            </p>
          </div>
        )}
      </div>

      {/* AI Task Recommendation Modal */}
      <AITaskRecommendationModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        projectId={projectId}
        projectName={projectName}
        onTasksGenerated={handleAITasksGenerated}
      />

      <TaskDetailModal
        isOpen={showTaskDetailModal}
        onClose={() => {
          setShowTaskDetailModal(false);
          setSelectedTaskId(null);
        }}
        taskId={selectedTaskId}
        onEdit={handleEditFromDetail}
      />

      <TaskEditModal
        isOpen={showTaskEditModal}
        onClose={() => {
          setShowTaskEditModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onTaskUpdated={handleTaskUpdated}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTaskCreated={(newTask) => {
          // Reload the task list to get the latest data
          loadProjectAndTasks();
        }}
        projects={project ? [{ id: project.id, name: project.name || projectName }] : []}
        defaultProjectId={projectId}
      />
    </div>
  );
};

export default ProjectTasksView;