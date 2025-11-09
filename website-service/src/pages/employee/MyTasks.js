import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';
import { apiService } from '../../services/apiService';
import socketIOService from '../../services/socketIOService';
import EnhancedSubmitReportModal from '../../components/modals/EnhancedSubmitReportModal';
import { 
  Clock, Play, Pause, Calendar, User, FolderOpen, 
  CheckCircle, AlertCircle, TrendingUp, FileText,
  Filter, RefreshCw, Eye, Send
} from 'lucide-react';
import { useTaskTimer } from '../../hooks/useTaskTimer';

const MyTasks = () => {
  const { user } = useAuth();
  const { success: showSuccess, info: showInfo } = useNotification();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeTracking, setTimeTracking] = useState({});
  const [taskStats, setTaskStats] = useState(null);
  const [reportModal, setReportModal] = useState({ open: false, task: null });
  const [reportData, setReportData] = useState({
    workDone: '',
    challenges: '',
    achievements: '',
    nextSteps: '',
    estimatedProgress: 0
  });
  const [viewMode, setViewMode] = useState('card'); // card or list

  useEffect(() => {
    loadMyTasks();
  }, []);

  // Calculate stats whenever tasks change
  useEffect(() => {
    loadTaskStats();
  }, [tasks]);

  // SocketIO integration for real-time task updates
  useEffect(() => {
    // Connect to SocketIO service
    socketIOService.connect();

    // Subscribe to task assignment events
    const unsubscribeTaskAssigned = socketIOService.subscribe('task-assigned', (data) => {
      if (data.assignedTo === user?.id) {
        
        // Convert the received task to our format
        if (data.task) {
          const newTask = {
            id: data.task.id,
            title: data.task.title || data.task.name,
            description: data.task.description || '',
            status: data.task.status || 'TODO',
            priority: data.task.priority || 'MEDIUM',
            progress: 0,
            estimatedHours: data.task.estimatedHours || 0,
            actualHours: 0,
            createdDate: new Date().toISOString().split('T')[0],
            dueDate: data.task.dueDate || new Date(data.task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            projectName: data.projectName || 'Unknown Project',
            projectId: data.task.projectId || null,
            assignedBy: data.teamLeadName || 'System',
            skills: data.task.requiredSkills || [],
            dependencies: [],
            submissionRequired: true,
            lastSubmission: null
          };

            // ✅ CHECK DUPLICATE TRƯỚC KHI ADD
          setTasks(prevTasks => {
            // Kiểm tra xem task đã tồn tại chưa
            const existingTaskIndex = prevTasks.findIndex(t => t.id === newTask.id);
            
            if (existingTaskIndex !== -1) {
              // Task đã tồn tại -> UPDATE thay vì add mới
              const updatedTasks = [...prevTasks];
              updatedTasks[existingTaskIndex] = newTask;
              console.log('Task already exists, updating instead of adding');
              return updatedTasks;
            }
            
            // Task chưa tồn tại -> ADD mới
            console.log('Adding new task to list');
            return [newTask, ...prevTasks];
          });

           // Update task stats
          setTaskStats(prevStats => ({
            ...prevStats,
            total: prevStats.total + 1,
            todo: prevStats.todo + 1
          }));

          // Show a toast notification
          // showTaskAssignmentNotification(newTask);
        }
      }
    });

    // Subscribe to task assignment events
    const unsubscribeTaskTransffer = socketIOService.subscribe('task-transferred', (data) => {
      if (data.previousAssigneeId === user?.id) {
      
        // Convert the received task to our format
        if (data.task) {
          
          //Remove task have previousAssigneeId
          // Update the task in the tasks list
          setTasks(prevTasks => prevTasks.filter(task => task.id === data.task.id));

          // Update task stats
          setTaskStats(prevStats => ({
            ...prevStats,
            total: prevStats.total - 1,
            todo: prevStats.todo - 1
          }));
        }
      }
    });

    // Subscribe to task status change events
    const unsubscribeTaskStatusChanged = socketIOService.subscribe('task-status-changed', (data) => {
      if (data.assignedTo === user?.id && data.task) {
        console.log('Task status changed in MyTasks:', data);
        
        // Update the task in the tasks list
        setTasks(prevTasks => 
          prevTasks.map(task => {
            if (task.id === data.task.id) {
              const oldStatus = task.status;
              const newStatus = data.task.status;
              
              // Update task stats based on status change
              updateTaskStatsOnStatusChange(oldStatus, newStatus);
              
              // Show notification for status change
              showInfo(
                `Task "${task.title}" status changed to ${newStatus.replace('_', ' ')}`,
                'Task Updated'
              );
              
              return { 
                ...task, 
                status: newStatus,
                progress: data.task.progress || task.progress
              };
            }
            return task;
          })
        );
      }
    });

    // Subscribe to task update events
    const unsubscribeTaskUpdated = socketIOService.subscribe('task-updated', (data) => {
      if (data.assignedTo === user?.id && data.task) {
        console.log('Task updated in MyTasks:', data);
        
        // Update the task in the tasks list
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === data.task.id 
              ? {
                  ...task,
                  title: data.task.title || task.title,
                  description: data.task.description || task.description,
                  priority: data.task.priority || task.priority,
                  dueDate: data.task.dueDate || task.dueDate,
                  estimatedHours: data.task.estimatedHours || task.estimatedHours,
                  projectName: data.task.projectName || task.projectName,
                  skills: data.task.requiredSkills || task.skills
                }
              : task
          )
        );
      }
    });

    // Cleanup subscriptions on component unmount
    return () => {
      unsubscribeTaskAssigned();
      unsubscribeTaskStatusChanged();
      unsubscribeTaskUpdated();
      unsubscribeTaskTransffer();
    };
  }, [user?.id]);

  // Helper function to show task assignment notification
  const showTaskAssignmentNotification = (task) => {
    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification('New Task Assigned', {
        body: `You have been assigned: ${task.title}`,
        icon: '/logo192.png'
      });
    }

    showInfo(`New task assigned: ${task.title}`);
  };

  // Helper function to fetch project details
  const fetchProjectDetails = async (projectId) => {
    if (!projectId) return null;
    try {
      const project = await apiService.getProject(projectId);
      return project?.result || project;
    } catch (error) {
      console.error('Failed to fetch project details:', error);
      return null;
    }
  };

  // Helper function to fetch user details
  const fetchUserDetails = async (userId) => {
    if (!userId) return null;
    try {
      const user = await apiService.getUser(userId);
      return user?.result || user;
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      return null;
    }
  };  // Helper function to update task stats when status changes
  const updateTaskStatsOnStatusChange = (oldStatus, newStatus) => {
    setTaskStats(prevStats => {
      const newStats = { ...prevStats };
      
      // Decrease count for old status
      if (oldStatus === 'TODO') newStats.todo -= 1;
      else if (oldStatus === 'IN_PROGRESS') newStats.inProgress -= 1;
      else if (oldStatus === 'REVIEW') newStats.review -= 1;
      else if (oldStatus === 'TESTING') newStats.testing -= 1;
      else if (oldStatus === 'DONE') newStats.done -= 1;
      
      // Increase count for new status
      if (newStatus === 'TODO') newStats.todo += 1;
      else if (newStatus === 'IN_PROGRESS') newStats.inProgress += 1;
      else if (newStatus === 'REVIEW') newStats.review += 1;
      else if (newStatus === 'TESTING') newStats.testing += 1;
      else if (newStatus === 'DONE') newStats.done += 1;
      
      return newStats;
    });
  };

  const loadMyTasks = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.getMyTasks();
      console.log("List task: ", response);
      
      if (response && response.length > 0) {
        const transformedTasks = await Promise.all(
          response.map(async (task) => {
            // Fetch project details
            let projectName = 'Unknown Project';
            if (task.projectId) {
              const projectDetails = await fetchProjectDetails(task.projectId);
              projectName = projectDetails?.name || projectDetails?.title || 'Unknown Project';
            }

            // Fetch user details
            let assignedByName = 'System';
            if (task.createdBy) {
              const userDetails = await fetchUserDetails(task.createdBy);
              if (userDetails) {
                assignedByName = `${userDetails.firstName || ''} ${userDetails.lastName || ''}`.trim() || 
                                userDetails.username || 
                                userDetails.email || 
                                'Unknown User';
              }
            }

            return {
              id: task.id,
              title: task.title || task.name,
              description: task.description || '',
              status: task.status || 'TODO',
              priority: task.priority || 'MEDIUM',
              progress: task.progressPercentage || 0,
              estimatedHours: task.estimatedHours || 0,
              actualHours: task.actualHours || 0,
              createdDate: task.createdAt ? task.createdAt.split('T')[0] : null,
              dueDate: task.dueDate ? task.dueDate.split('T')[0] : null,
              startDate: task.startedAt ? task.startedAt.split('T')[0] : null, // ✅ Sửa từ startDate thành startedAt
              projectName: projectName,
              projectId: task.projectId,
              assignedBy: assignedByName,
              createdById: task.createdBy,
              skills: task.requiredSkills || [],
              dependencies: task.dependencies || [],
              submissionRequired: task.submissionRequired || false,
              lastSubmission: task.lastSubmission
            };
          })
        );
        
        setTasks(transformedTasks);
        console.log('Loaded and enriched tasks from API:', transformedTasks);
      } else {
        setTasks([]);
        console.log('No tasks found for user');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load tasks from API:', error);
      setLoading(false);
      setTasks([]);
    }
  };

  const loadTaskStats = async () => {
    try {
      // Calculate stats from the actual tasks data
      if (tasks.length > 0) {
        const stats = {
          total: tasks.length,
          todo: tasks.filter(task => task.status === 'TODO').length,
          inProgress: tasks.filter(task => task.status === 'IN_PROGRESS').length,
          review: tasks.filter(task => task.status === 'REVIEW').length,
          testing: tasks.filter(task => task.status === 'TESTING').length,
          done: tasks.filter(task => task.status === 'DONE').length,
          overdue: tasks.filter(task => task.dueDate && isOverdue(task.dueDate) && task.status !== 'DONE').length,
          hoursThisWeek: tasks.reduce((total, task) => total + (task.actualHours || 0), 0),
          completionRate: tasks.length > 0 ? Math.round((tasks.filter(task => task.status === 'DONE').length / tasks.length) * 100) : 0
        };
        
        setTaskStats(stats);
      } else {
        // Default stats when no tasks
        setTaskStats({
          total: 0,
          todo: 0,
          inProgress: 0,
          review: 0,
          testing: 0,
          done: 0,
          overdue: 0,
          hoursThisWeek: 0,
          completionRate: 0
        });
      }
    } catch (error) {
      console.error('Failed to calculate task stats:', error);
    }
  };

  const filteredTasks = statusFilter === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === statusFilter);


  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const handleStartTask = async (taskId) => {
    try {
      // API call to update task status to IN_PROGRESS
      const updateData = { status: 'IN_PROGRESS' };
      await apiService.updateTaskStatus(taskId, updateData);
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: 'IN_PROGRESS' } : task
      ));
      
      showInfo('Task status updated to In Progress');
    } catch (error) {
      console.error('Failed to start task:', error);
      showInfo('Failed to update task status', 'error');
    }
  };

  const handleUpdateProgress = async (taskId, progress) => {
    try {
      // API call to update task progress
      const updateData = { progress: progress };
      await apiService.updateTaskProgress(taskId, updateData);
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, progress } : task
      ));
      
      showInfo(`Task progress updated to ${progress}%`);
    } catch (error) {
      console.error('Failed to update progress:', error);
      showInfo('Failed to update task progress', 'error');
    }
  };

  const handleSubmitTask = async (taskId) => {
    try {
      // API call to submit task for review
      const submissionData = {
        submissionMessage: 'Task completed and ready for review',
        submissionDate: new Date().toISOString()
      };
      
      await apiService.submitTask(taskId, submissionData);
      
      // Update task status to REVIEW and progress to 100%
      const statusUpdateData = { status: 'REVIEW' };
      await apiService.updateTaskStatus(taskId, statusUpdateData);
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { 
          ...task, 
          status: 'REVIEW', 
          progress: 100,
          lastSubmission: new Date().toISOString().split('T')[0]
        } : task
      ));
      
      showSuccess('Task submitted for review successfully');
    } catch (error) {
      console.error('Failed to submit task:', error);
      showInfo('Failed to submit task for review', 'error');
    }
  };

  const handleTimeTracking = (taskId) => {
    if (timeTracking[taskId]) {
      // Stop tracking
      setTimeTracking(prev => ({ ...prev, [taskId]: null }));
    } else {
      // Start tracking
      setTimeTracking(prev => ({ ...prev, [taskId]: new Date() }));
    }
  };

  
  const getStatusConfig = (status) => {
    const configs = {
      TODO: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock },
      IN_PROGRESS: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: TrendingUp },
      REVIEW: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Eye },
      TESTING: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: AlertCircle },
      DONE: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle }
    };
    return configs[status] || configs.TODO;
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      HIGH: 'bg-red-50 text-red-700 border-red-200',
      MEDIUM: 'bg-orange-50 text-orange-700 border-orange-200',
      LOW: 'bg-green-50 text-green-700 border-green-200'
    };
    return configs[priority] || configs.MEDIUM;
  };

  // Function to refresh tasks
  const refreshTasks = async () => {
    await loadMyTasks();
    showInfo('Tasks refreshed');
  };

  // Report handling functions
  const handleOpenReportModal = (task) => {
    setReportModal({ open: true, task });
    setReportData({
      workDone: '',
      challenges: '',
      achievements: '',
      nextSteps: '',
      estimatedProgress: task.progress || 0
    });
  };

  const handleCloseReportModal = () => {
    setReportModal({ open: false, task: null });
    setReportData({
      workDone: '',
      challenges: '',
      achievements: '',
      nextSteps: '',
      estimatedProgress: 0
    });
  };

 const handleSubmitReport = async (submissionData) => {
  try {
    let attachments = [];
    
    // Upload files if any
    if (submissionData.attachments && submissionData.attachments.length > 0) {
      showInfo('Uploading files...', 'info');
      
      const uploadPromises = submissionData.attachments.map(async (attachment) => {
        const formData = new FormData();
        formData.append('file', attachment.file);
        
        try {
          const response = await apiService.uploadFile(formData);
          
          // Extract file info from response
          const fileResult = response.result || response;
          
          return {
            name: fileResult.originalFileName || attachment.name,
            url: fileResult.url,
            type: attachment.type || attachment.file.type,
            size: attachment.size || attachment.file.size
          };
        } catch (error) {
          console.error('Failed to upload file:', attachment.name, error);
          return null;
        }
      });

      const uploadResults = await Promise.all(uploadPromises);
      attachments = uploadResults.filter(result => result !== null);
      
      // Check if all uploads succeeded
      if (attachments.length === 0 && submissionData.attachments.length > 0) {
        showInfo('All file uploads failed', 'error');
        throw new Error('File upload failed');
      }
      
      if (attachments.length < submissionData.attachments.length) {
        showInfo(`${submissionData.attachments.length - attachments.length} file(s) failed to upload`, 'warning');
      }
    }

    // Prepare the submission data - MATCH BACKEND DTO EXACTLY
    const taskSubmissionData = {
      description: submissionData.description,
      attachments: attachments, // Array of {name, url, type, size}
      progressPercentage: submissionData.progressPercentage || 0
    };

    console.log('Submitting task with data:', taskSubmissionData);

    // Submit the task
    const response = await apiService.submitTask(submissionData.taskId, taskSubmissionData);

    // Update local state
    setTasks(tasks.map(t => 
      t.id === submissionData.taskId ? { 
        ...t, 
        submissionCount: (t.submissionCount || 0) + 1,
        lastSubmission: new Date().toISOString().split('T')[0],
        status: 'REVIEW',
        hasSubmission: true,
        progress: submissionData.progressPercentage || t.progress
      } : t
    ));

    showSuccess('Task submitted successfully');
    return response;
    
  } catch (error) {
    console.error('Failed to submit task:', error);
    
    // Better error message
    const errorMessage = error.response?.data?.message 
      || error.message 
      || 'Failed to submit task';
    
    showInfo(errorMessage, 'error');
    throw error;
  }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const TaskCard = ({ task }) => {
    const statusConfig = getStatusConfig(task.status);
    const StatusIcon = statusConfig.icon;
    const isTracking = timeTracking[task.id];

    const { 
    isRunning, 
    totalLoggedSeconds, 
    currentSessionSeconds, 
    loading,
    startTimer, 
    stopTimer,
    formatTime,
    getTotalHours
  } = useTaskTimer(task.id, user.id);

  const handleTimerToggle = async () => {
    if (isRunning) {
      const result = await stopTimer();
      if (result.success) {
        showSuccess('Timer stopped successfully');
      } 
    } else {
      const result = await startTimer();
      if (result.success) {
        showSuccess('Timer started');
      } 
    }
  };

    return (
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden">
        {/* Header with colored accent */}
        <div className={`h-1.5 ${task.priority === 'HIGH' ? 'bg-red-500' : task.priority === 'MEDIUM' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
        
        <div className="p-6">
          {/* Title & Status Row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 leading-tight">{task.title}</h3>
                {isOverdue(task.dueDate) && task.status !== 'DONE' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Overdue
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
            </div>
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <FolderOpen className="w-4 h-4 mr-2 text-gray-400" />
              <span className="truncate">{task.projectName}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <User className="w-4 h-4 mr-2 text-gray-400" />
              <span className="truncate">{task.assignedBy}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              <span>
                Start: {task.startDate 
                  ? new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : "Haven't started"}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              <span className={isOverdue(task.dueDate) && task.status !== 'DONE' ? 'text-red-600 font-medium' : ''}>
                Due: {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">Progress</span>
              <span className="text-xs font-semibold text-gray-900">{task.progress}%</span>
            </div>
            <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  task.progress < 30 ? 'bg-red-500' :
                  task.progress < 70 ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>

          {/* Time Tracking */}
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <div className="text-sm">
                 <span className="font-medium text-gray-900">
                   {getTotalHours()}h
                 </span>
                <span className="text-gray-500">
                   {' / '}{task.estimatedHours}h
                </span>
              </div>
            </div>
            
            <button
              onClick={() => handleTimeTracking(task.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isTracking 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
              }`}
            >
               <button
                onClick={handleTimerToggle}
                disabled={loading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                  isRunning 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                }`}
            >
                {isRunning ? (
                  <>
                    <Pause className="w-3 h-3" />
                    Stop
                    <span className="ml-1 font-semibold">
                      {formatTime(currentSessionSeconds)}
                    </span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    Start
                  </>
                )}
              </button>
            </button>
          </div>

          {/* Skills Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {task.skills.slice(0, 4).map((skill, idx) => (
              <span key={idx} className="px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                {skill}
              </span>
            ))}
            {task.skills.length > 4 && (
              <span className="px-2 py-1 text-xs font-medium text-gray-500">
                +{task.skills.length - 4}
              </span>
            )}
          </div>

          {/* Status & Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${statusConfig.color}`}>
                <StatusIcon className="w-3 h-3 mr-1.5" />
                {task.status.replace('_', ' ')}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getPriorityConfig(task.priority)}`}>
                {task.priority}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {task.status === 'TODO' && (
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors" onClick={() => handleStartTask(task.id)}>
                  <Play className="w-3 h-3" />
                  Start Task
                </button>
              )}
              
              {(task.status === 'IN_PROGRESS' || task.status === 'REVIEW') && (
                <button 
                  onClick={() => setReportModal({ open: true, task })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  Report
                </button>
              )}

              {task.status === 'IN_PROGRESS' && task.progress >= 90 && (
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors">
                  <Send className="w-3 h-3" />
                  Submit
                </button>
              )}

              <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">My Tasks</h1>
              <p className="text-gray-600">Track and manage your assigned work</p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          {[
            { label: 'Total', value: taskStats.total, color: 'gray' },
            { label: 'To Do', value: taskStats.todo, color: 'gray' },
            { label: 'In Progress', value: taskStats.inProgress, color: 'blue' },
            { label: 'Review', value: taskStats.review, color: 'yellow' },
            { label: 'Testing', value: taskStats.testing, color: 'purple' },
            { label: 'Done', value: taskStats.done, color: 'green' },
            { label: 'Overdue', value: taskStats.overdue, color: 'red' },
            { label: 'This Week', value: `${taskStats.hoursThisWeek}h`, color: 'indigo' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className={`text-2xl font-bold mb-1 text-${stat.color}-600`}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="all">All Tasks</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="TESTING">Testing</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button className={`p-2 rounded-lg ${viewMode === 'card' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-50'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-50'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>

        {/* Enhanced Report Modal */}
        {reportModal.open && (
          <EnhancedSubmitReportModal
            isOpen={reportModal.open}
            task={reportModal.task}
            onClose={() => setReportModal({ open: false, task: null })}
            onSubmit={handleSubmitReport}
            reportData={reportData}
            setReportData={setReportData}
          />
        )}
      </div>
    </div>
  );
};

export default MyTasks;