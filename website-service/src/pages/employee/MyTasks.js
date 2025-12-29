import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';
import { apiService } from '../../services/apiService';
import socketIOService from '../../services/socketIOService';
import EnhancedSubmitReportModal from '../../components/modals/EnhancedSubmitReportModal';
import { 
  Clock, Play, FileText, TrendingUp, HelpCircle, 
  AlertCircle, FolderOpen, User, Calendar, 
  Eye, Send, Filter, RefreshCw, Search,
  CheckCircle2, AlertTriangle, Timer, Briefcase, MoreVertical
} from 'lucide-react';
import { useTaskTimer } from '../../hooks/useTaskTimer';
import TaskExtensionModal from '../../components/TaskExtensionModal';


const StatCard = ({ title, value, subValue, icon: Icon, color, trend }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md hover:-translate-y-1 duration-300">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">{value}</h3>
        {subValue && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 dark:text-gray-300">{subValue}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const StatusTab = ({ active, label, count, onClick, color }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 dark:bg-gray-700 dark:text-white  ${
      active 
        ? `bg-${color}-50 text-${color}-700 shadow-sm ring-1 ring-${color}-200 dark:text-white` 
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white'
    }`}
  >
    {label}
    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs dark:text-white dark:bg-gray-700  ${
      active ? `bg-${color}-200 text-${color}-800` : 'bg-gray-200 text-gray-600'
    }`}>
      {count}
    </span>
  </button>
);

const MyTasks = () => {
  const { user } = useAuth();
  const { success: showSuccess, info: showInfo } = useNotification();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [taskStats, setTaskStats] = useState(null);
  const [reportModal, setReportModal] = useState({ open: false, task: null });
  const [reportData, setReportData] = useState({
    description: '',
    progressPercentage: 0
  });
  const [extensionModal, setExtensionModal] = useState({ open: false, task: null });

  const [viewMode, setViewMode] = useState('card'); // card or list

  const [searchQuery, setSearchQuery] = useState(''); // Thêm state search

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
      // console.log("List task: ", response);
      
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

  // Filter tasks logic update (bao gồm cả search)
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = statusFilter === 'all' ? true : task.status === statusFilter;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });


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

 // ✅ Helper function: Check if task can request extension
  const canRequestExtension = (task) => {
    if (!task) return false;
    
    // Cannot extend if task is completed or cancelled
    if (task.status === 'DONE' || task.status === 'CANCELLED' || task.status === 'REVIEW') {
      return false;
    }
    
    // Cannot extend if already at max extensions (2)
    if (task.extensionCount >= 2) {
      return false;
    }
    
    // Cannot extend if there's a pending extension request
    if (task.hasPendingExtension) {
      return false;
    }
    
    // Can extend if task is overdue OR close to deadline (within 24 hours)
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
    
    return hoursUntilDue < 24 || dueDate < now;
  };

  // ✅ Helper function: Check if task can submit report
  const canSubmitReport = (task) => {
    if (!task) return false;
    
    // Can submit if task is IN_PROGRESS or REVIEW
    if (task.status !== 'IN_PROGRESS' && task.status !== 'REVIEW') {
      return false;
    }
    
    // Cannot submit if overdue (should request extension first)
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    
    if (dueDate < now) {
      return false;
    }
    
    return true;
  };

  // ✅ Helper function: Determine which button to show
  const getTaskActionButton = (task) => {
    const taskIsOverdue = task.dueDate && new Date(task.dueDate) < new Date();
    
    // Priority 1: If overdue -> show Extend button
    if (taskIsOverdue && canRequestExtension(task)) {
      return 'extend';
    }
    
    // Priority 2: If can submit report -> show Report button
    if (canSubmitReport(task)) {
      return 'report';
    }
    
    // Priority 3: If close to deadline and can extend -> show Extend button
    if (canRequestExtension(task)) {
      return 'extend';
    }
    
    // Default: Show Report button (disabled)
    return null;
  };

   // ✅ Handle extension request submission
  const handleRequestExtension = async (extensionData) => {
    console.log('Requesting extension with data:', extensionData);
    try {
      const response = await apiService.requestExtension(extensionModal.task.id, extensionData);
      console.log('Extension request response:', response);
      if (response?.result) {
        showSuccess('Extension request submitted successfully');
        
        // Update task in local state
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === extensionModal.task.id 
              ? { ...t, hasPendingExtension: true }
              : t
          )
        );
        
        // Close modal
        setExtensionModal({ open: false, task: null });
        
        // Optionally reload tasks to get updated data
        await loadMyTasks();
      }
    } catch (error) {
      console.error('Failed to request extension:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit extension request';
      // showError(errorMessage);
    }
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
    setReportModal({ open: false, task: null });

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

  const getStatusConfig = (status) => {
    switch (status) {
      case 'TODO':
        return { label: 'To Do', color: 'gray', icon: Clock };
      case 'IN_PROGRESS':
        return { label: 'In Progress', color: 'blue', icon: Play };
      case 'REVIEW':
        return { label: 'In Review', color: 'orange', icon: FileText };
      case 'TESTING':
        return { label: 'In Testing', color: 'purple', icon: TrendingUp };
      default:
        return { label: 'Unknown', color: 'gray', icon: HelpCircle };
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'LOW':
        return 'border-green-500 text-green-600 bg-green-50';
      case 'MEDIUM':
        return 'border-yellow-500 text-yellow-600 bg-yellow-50';
      case 'HIGH':
        return 'border-red-500 text-red-600 bg-red-50';
      default:
        return 'border-gray-500 text-gray-600 bg-gray-50';
    }
  };

  // --- REDESIGNED TASK CARD (FIXED OVERDUE LOGIC) ---
  const TaskCard = ({ task }) => {
    console.log('Rendering TaskCard for task:', task.title);
    // const statusConfig = getStatusConfig(task.status);
    // const StatusIcon = statusConfig.icon;
    
    // Config màu sắc cho Priority
    const priorityColors = {
      HIGH: 'text-red-600 bg-red-50 border-red-100',
      MEDIUM: 'text-orange-600 bg-orange-50 border-orange-100',
      LOW: 'text-green-600 bg-green-50 border-green-100'
    };

    // --- SỬA LỖI LOGIC OVERDUE TẠI ĐÂY ---
    const checkIsOverdue = (dueDateValue) => {
      if (!dueDateValue) return false;
      
      // Chuyển mọi giá trị về Date object để so sánh
      const due = new Date(dueDateValue);
      const now = new Date();

      // Nếu chỉ có ngày (YYYY-MM-DD), set về cuối ngày
      if (String(dueDateValue).length <= 10) {
          due.setHours(23, 59, 59, 999);
      }

      return due < now;
  };

    const taskIsOverdue = checkIsOverdue(task.dueDate) && task.status !== 'DONE';
    
    // --- LOGIC HIỂN THỊ NÚT BẤM ---
    const getActionView = () => {
      // 1. Task đã xong hoặc hủy -> Không hiện nút
      if (task.status === 'DONE' || task.status === 'CANCELLED') return null;

      // 2. Task Quá hạn -> Ưu tiên hiện Extension
      if (taskIsOverdue) {
        if (canRequestExtension(task)) {
          return (
            <button
              onClick={() => setExtensionModal({ open: true, task })}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 text-xs font-semibold rounded-lg transition-all"
            >
              <Clock className="w-3.5 h-3.5 mr-1.5" /> 
              Extend (Overdue)
            </button>
          );
        } else {
          return (
            <button disabled className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 text-xs font-semibold rounded-lg cursor-not-allowed">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Max Extensions
            </button>
          );
        }
      }

      // 3. Task chưa quá hạn -> Hiện Report
      return (
        <div className="flex gap-2 w-full">
          {task.status === 'IN_PROGRESS' || task.status === 'TODO' ? (

          <button
            onClick={() => setReportModal({ open: true, task })}
            className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white border border-gray-300 dark:border-gray-600 text-xs font-semibold rounded-lg transition-all shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" /> Submit Task
          </button>
          ): (
            <span
              className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 text-xs font-semibold rounded-lg cursor-not-allowed"
            >
              Review
            </span>
          )}

          {/* Nút Submit khi progress cao */}
          {/* {task.progress >= 90 && (
            <button
              onClick={() => setReportModal({ open: true, task })}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-all shadow-sm hover:shadow"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" /> Submit Task
            </button>
          )} */}
          
          {/* Nút Extend phụ (Optional) */}
          {canRequestExtension(task) && (
             <button
                onClick={() => setExtensionModal({ open: true, task })}
                className="p-2 text-orange-600 hover:bg-orange-50 border border-transparent hover:border-orange-200 rounded-lg transition-all"
                title="Request Extension Early"
             >
               <Clock className="w-4 h-4" />
             </button>
          )}
        </div>
      );
    };

    // Helper hiển thị ngày tháng chuẩn (Format lại ngày hiển thị cho đẹp)
    // Tìm hàm này bên trong TaskCard và sửa lại
    const formatDisplayDate = (dateString) => {
        if (!dateString) return 'N/A';

        // ✅ BƯỚC QUAN TRỌNG: Ép kiểu về String để tránh lỗi .endsWith
        const str = String(dateString); 
        
        let normalizedDateStr = str;
        
        // Kiểm tra và xử lý chuỗi
        if (!str.endsWith('Z') && !str.includes('+')) {
            normalizedDateStr += 'Z';
        }
        
        const date = new Date(normalizedDateStr);
        
        // Kiểm tra nếu ngày không hợp lệ (Invalid Date)
        if (isNaN(date.getTime())) return str; 

        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    }

    return (
      <div className="group bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden">
        {/* Priority Stripe */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          task.priority === 'HIGH' ? 'bg-red-500' : task.priority === 'MEDIUM' ? 'bg-orange-500' : 'bg-green-500'
        }`} />

        {/* Header: Project & Meta */}
        <div className="flex justify-between items-start mb-3 pl-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700 dark:bg-gray-700 dark:border-gray-600">
              <FolderOpen className="w-3 h-3 mr-1.5 text-gray-400 dark:text-gray-500 dark:text-gray-300" />
              {task.projectName}
            </span>
            {taskIsOverdue && (
              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-600 border border-red-100 animate-pulse">
                <AlertCircle className="w-3 h-3 mr-1" /> Overdue
              </span>
            )}
          </div>
          <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 p-1 rounded-full hover:bg-gray-50 dark:bg-gray-900">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content */}
        <div className="pl-3 mb-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 leading-snug group-hover:text-indigo-600 transition-colors cursor-pointer dark:text-gray-100">
              {task.title}
            </h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 line-clamp-2 leading-relaxed dark:text-gray-300">
            {task.description}
          </p>
        </div>

        {/* Info Grid */}
        <div className="pl-3 grid grid-cols-2 gap-y-3 gap-x-4 mb-5">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
            <Calendar className="w-3.5 h-3.5 mr-2 text-gray-400 dark:text-gray-500" />
            <span>Due: <span className={`font-medium ${taskIsOverdue ? 'text-red-500' : 'text-gray-700'} dark:text-gray-200`}>
              {/* Sử dụng hàm formatDisplayDate để hiển thị đúng ngày theo giờ địa phương */}
              {formatDisplayDate(task.dueDate)}
            </span></span>
          </div>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
            <User className="w-3.5 h-3.5 mr-2 text-gray-400 dark:text-gray-500" />
            <span className="truncate max-w-[100px]">{task.assignedBy}</span>
          </div>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 col-span-2">
            <div className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${priorityColors[task.priority]}`}>
              {task.priority} Priority
            </div>
            <div className="ml-auto flex items-center gap-1">
               {task.skills.slice(0, 3).map((skill, i) => (
                 <span key={i} className="w-2 h-2 rounded-full bg-indigo-400" title={skill}></span>
               ))}
            </div>
          </div>
        </div>

        {/* Progress & Stats */}
        {/* Progress & Stats Area */}
        <div className="pl-3 bg-gray-50 dark:bg-gray-900 rounded-xl p-3 mb-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-700 dark:border-gray-600">
          {(task.status === 'REVIEW' || task.status === 'DONE') ? (
            /* HIỂN THỊ KHI ĐÃ HOÀN THÀNH HOẶC ĐANG REVIEW */
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide dark:text-gray-100">Progress</span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{task.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3 dark:bg-gray-700">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    task.progress === 100 ? 'bg-green-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${task.progress}%` }}
                ></div>
              </div>
              <div className="flex items-center text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs">
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                <span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{task.actualHours || 0}h</span> 
                  {' / '}{task.estimatedHours}h est.
                </span>
              </div>
            </>
          ) : (
            /* HIỂN THỊ KHI IN_PROGRESS HOẶC CANCELLED (Tính theo thời gian) */
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide dark:text-gray-100">Time Remaining</span>
                <span className={`text-xs font-bold ${task.status === 'CANCELLED' ? 'text-gray-400' : 'text-orange-600'} dark:text-orange-400`}>
                  {(() => {
                    if (task.status === 'CANCELLED') return 'Cancelled';
                    const now = new Date();
                    const due = new Date(task.dueDate);
                    const start = new Date(task.startDate || task.createdDate);
                    const total = due - start;
                    const elapsed = now - start;
                    const percent = Math.min(Math.max(Math.round((elapsed / total) * 100), 0), 100);
                    return `${percent}% time elapsed`;
                  })()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3 dark:bg-gray-700">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    task.status === 'CANCELLED' ? 'bg-gray-400' : 'bg-orange-500'
                  }`}
                  style={{ 
                    width: `${(() => {
                      const now = new Date();
                      const due = new Date(task.dueDate);
                      const start = new Date(task.startDate || task.createdDate);
                      const total = due - start;
                      const elapsed = now - start;
                      return Math.min(Math.max((elapsed / total) * 100, 0), 100);
                    })()}%` 
                  }}
                ></div>
              </div>
              <div className="flex items-center text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs">
                <Timer className="w-3.5 h-3.5 mr-1.5" />
                <span>Deadline Tracking</span>
              </div>
            </>
          )}
        </div>

        {/* Actions Footer */}
        <div className="pl-3 flex items-center justify-end gap-2 pt-2 border-t border-gray-50 mt-4 dark:border-gray-700">
          
          {getActionView()}
          
          <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 1. Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight dark:text-white">My Workspace</h1>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button 
            onClick={loadMyTasks}
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:bg-gray-900 hover:border-gray-300 dark:border-gray-600 transition-all shadow-sm font-medium text-sm dark:hover:bg-gray-700/50"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh Data
          </button>
        </div>

        {/* 2. Stats Overview (Replaced grid of 8 with 4 impactful cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 dark:bg-black">
          <StatCard 
            title="Active Tasks" 
            value={taskStats.inProgress} 
            subValue={`${taskStats.todo} pending start`}
            icon={Briefcase} 
            color="bg-blue-500 dark:bg-blue-600"
          />
          <StatCard 
            title="This Week's Effort" 
            value={`${taskStats.hoursThisWeek}h`} 
            subValue="Tracked hours"
            icon={Timer} 
            color="bg-indigo-500"
          />
          <StatCard 
            title="Completion Rate" 
            value={`${taskStats.completionRate}%`} 
            subValue={`${taskStats.done} tasks finished`}
            icon={CheckCircle2} 
            color="bg-green-500"
          />
          <StatCard 
            title="Attention Needed" 
            value={taskStats.overdue} 
            subValue="Overdue tasks"
            icon={AlertTriangle} 
            color="bg-red-500"
          />
        </div>

        {/* 3. Filters & Controls */}
        <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 sticky top-4 z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 px-2 hide-scrollbar dark:text-white dark::-webkit-scrollbar">
              <StatusTab 
                label="All" 
                count={taskStats.total} 
                active={statusFilter === 'all'} 
                onClick={() => setStatusFilter('all')} 
                color="indigo"
              />
              <StatusTab 
                label="To Do" 
                count={taskStats.todo} 
                active={statusFilter === 'TODO'} 
                onClick={() => setStatusFilter('TODO')} 
                color="gray dark:text-gray-300"
              />
              <StatusTab 
                label="In Progress" 
                count={taskStats.inProgress} 
                active={statusFilter === 'IN_PROGRESS'} 
                onClick={() => setStatusFilter('IN_PROGRESS')} 
                color="blue"
              />
              <StatusTab 
                label="Review" 
                count={taskStats.review} 
                active={statusFilter === 'REVIEW'} 
                onClick={() => setStatusFilter('REVIEW')} 
                color="orange"
              />
              <StatusTab 
                label="Done" 
                count={taskStats.done} 
                active={statusFilter === 'DONE'} 
                onClick={() => setStatusFilter('DONE')} 
                color="green"
              />
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-64 px-2">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border-none bg-gray-50 dark:bg-gray-900 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 4. Task Grid */}
        {filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4">
              <FolderOpen className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No tasks found</h3>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1 max-w-sm mx-auto">
              {searchQuery 
                ? `We couldn't find any tasks matching "${searchQuery}"` 
                : statusFilter !== 'all' 
                  ? `You don't have any tasks in the "${statusFilter.replace('_', ' ')}" status.` 
                  : "You're all caught up! Enjoy your free time."}
            </p>
            {statusFilter !== 'all' && (
              <button 
                onClick={() => setStatusFilter('all')}
                className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Modals (Extension & Report) */}
        {extensionModal.open && (
          <TaskExtensionModal
            isOpen={extensionModal.open}
            task={extensionModal.task}
            onClose={() => setExtensionModal({ open: false, task: null })}
            onSubmit={handleRequestExtension}
          />
        )}

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