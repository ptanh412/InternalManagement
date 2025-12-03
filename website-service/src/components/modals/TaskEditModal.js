import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  PencilSquareIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  StarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  MinusCircleIcon,
  InformationCircleIcon,
  CodeBracketIcon,
  PaintBrushIcon,
  BeakerIcon,
  BugAntIcon,
  DocumentCheckIcon,
  ServerIcon,
  WrenchScrewdriverIcon,
  LightBulbIcon,
  CircleStackIcon,
  AcademicCapIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/apiService';
import { useApiNotifications } from '../../hooks/useApiNotifications';
import WorkloadSummaryCard from '../workload/WorkloadSummaryCard';

// Recommendation Card Component
const RecommendationCard = ({ recommendation, index, onSelect, getScoreColor, getScoreText, workloadData, onRefreshWorkload }) => {
  // console.log("Workload data for recommendation:", recommendation.userId, workloadData);
  const [showDetails, setShowDetails] = useState(false);

  const handleSelect = (e) => {
    e.stopPropagation();
    onSelect(recommendation);
  };

  const toggleDetails = (e) => {
    e.stopPropagation();
    setShowDetails(!showDetails);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <StarIcon className="h-4 w-4 text-yellow-500 mr-2" />
          <span className="text-sm font-medium text-gray-900">
            #{recommendation.rank || index + 1} {recommendation.displayName}
          </span>
          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getScoreColor(recommendation.overallScore)}`}>
            {getScoreText(recommendation.overallScore)} match
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggleDetails}
            className="flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
          >
            <InformationCircleIcon className="h-3 w-3 mr-1" />
            Details
          </button>
          <button
            type="button"
            onClick={handleSelect}
            className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Select
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="mb-3">
        <p className="text-xs text-gray-600 mb-1">{recommendation.email}</p>
        {recommendation.recommendationReason && (
          <p className="text-xs text-gray-700 mb-2">{recommendation.recommendationReason}</p>
        )}
      </div>

      {/* Skills Section */}
      <div className="mb-3">
        {/* Matched Skills */}
        {recommendation.matchedSkills && recommendation.matchedSkills.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center mb-1">
              <CheckCircleIcon className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-xs font-medium text-gray-700">Matched Skills:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {recommendation.matchedSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missing Skills */}
        {recommendation.missingSkills && recommendation.missingSkills.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center mb-1">
              <MinusCircleIcon className="h-3 w-3 text-red-600 mr-1" />
              <span className="text-xs font-medium text-gray-700">Missing Skills:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {recommendation.missingSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Score Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        {recommendation.skillMatchScore !== undefined && (
          <div className="flex justify-between">
            <span>Skills:</span>
            <span className={getScoreColor(recommendation.skillMatchScore).split(' ')[0]}>
              {getScoreText(recommendation.skillMatchScore)}
            </span>
          </div>
        )}
        {recommendation.availabilityScore !== undefined && (
          <div className="flex justify-between">
            <span>Available:</span>
            <span className={getScoreColor(recommendation.availabilityScore).split(' ')[0]}>
              {getScoreText(recommendation.availabilityScore)}
            </span>
          </div>
        )}
        {recommendation.workloadScore !== undefined && (
          <div className="flex justify-between">
            <span>Workload:</span>
            <span className={getScoreColor(recommendation.workloadScore).split(' ')[0]}>
              {getScoreText(recommendation.workloadScore)}
            </span>
          </div>
        )}
        {recommendation.performanceScore !== undefined && (
          <div className="flex justify-between">
            <span>Performance:</span>
            <span className={getScoreColor(recommendation.performanceScore).split(' ')[0]}>
              {getScoreText(recommendation.performanceScore)}
            </span>
          </div>
        )}
      </div>

      {/* Details Expansion */}
      {showDetails && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          {recommendation.skillMatchSummary && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-gray-700 mb-1">Skill Match Summary:</h5>
              <p className="text-xs text-gray-600">{recommendation.skillMatchSummary}</p>
            </div>
          )}
          
          {recommendation.skillDevelopmentOpportunity && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-gray-700 mb-1">Development Opportunity:</h5>
              <p className="text-xs text-gray-600">{recommendation.skillDevelopmentOpportunity}</p>
            </div>
          )}

          {/* {recommendation.geminiReasoning && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-gray-700 mb-1">AI Reasoning:</h5>
              <p className="text-xs text-gray-600">{recommendation.geminiReasoning}</p>
            </div>
          )} */}

          {recommendation.bonusSkills && recommendation.bonusSkills.length > 0 && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-gray-700 mb-1">Bonus Skills:</h5>
              <div className="flex flex-wrap gap-1">
                {recommendation.bonusSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Workload Information */}
          <div className="mb-3">
            <h5 className="text-xs font-medium text-gray-700 mb-2">Current Workload:</h5>
            <WorkloadSummaryCard
              workloadData={workloadData}
              compact={false}
              onRefresh={onRefreshWorkload}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const TaskEditModal = ({ isOpen, onClose, task, onTaskUpdated }) => {
  console.log("Opening TaskEditModal for task:", task);
  const notify = useApiNotifications();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    assigneeId: '',
    dueDate: ''
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [selectedRecommendationForDetails, setSelectedRecommendationForDetails] = useState(null);
  const [workloadData, setWorkloadData] = useState({}); // Store workload for recommendations

  const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'];
  const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  useEffect(() => {
    if (isOpen && task) {
      // Populate form with task data
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'TODO',
        priority: task.priority || 'MEDIUM',
        assigneeId: task.assigneeId || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ''
      });
      
      // Load users for assignment
      loadUsers();
    }
  }, [isOpen, task]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await apiService.getAllUsers();
      const userData = response.result || response || [];
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (error) {
      console.warn('Failed to load users:', error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchWorkloadForUser = async (userId) => {
    try {
      const response = await apiService.workload.getUserWorkload(userId);
      // console.log("Fetched workload for user", userId, response);
      return response;
    } catch (error) {
      console.error(`Failed to load workload for user ${userId}:`, error);
      return null;
    }
  };

  const refreshWorkload = async (userId) => {
    const workload = await fetchWorkloadForUser(userId);
    if (workload) {
      setWorkloadData(prev => ({
        ...prev,
        [userId]: workload
      }));
    }
  };

  const loadAIRecommendations = async () => {
    if (!task?.id) {
      notify.error('Task ID is required for AI recommendations');
      return;
    }

    console.log(task?.id);

    setLoadingRecommendations(true);
    try {
      const response = await apiService.getTaskRecommendations(task.id);
      const recommendationsData = response.result || response || [];
      console.log("AI Recommendations data:", recommendationsData);
      
      if (Array.isArray(recommendationsData) && recommendationsData.length > 0) {
        // Enrich recommendations with user data
        const enrichedRecommendations = await Promise.all(
          recommendationsData.map(async (rec) => {
            try {
              const userResponse = await apiService.getUser(rec.userId);
              const userData = userResponse.result || userResponse;
              return {
                ...rec,
                user: userData,
                displayName: userData ? `${userData.firstName} ${userData.lastName}` : 'Unknown User',
                email: userData?.email || 'No email'
              };
            } catch (error) {
              console.warn(`Failed to fetch user data for ${rec.userId}:`, error);
              return {
                ...rec,
                user: null,
                displayName: 'Unknown User',
                email: 'No email'
              };
            }
          })
        );
        
        // Sort by overall score (highest first)
        const sortedRecommendations = enrichedRecommendations.sort(
          (a, b) => (b.overallScore || 0) - (a.overallScore || 0)
        );
        
        setRecommendations(sortedRecommendations);
        setShowRecommendations(true);

        // Fetch workload data for all recommended users
        const workloadPromises = sortedRecommendations.map(rec => 
          fetchWorkloadForUser(rec.userId)
        );
        const workloads = await Promise.all(workloadPromises);
        
        const workloadMap = {};
        sortedRecommendations.forEach((rec, index) => {
          if (workloads[index]) {
            workloadMap[rec.userId] = workloads[index];
          }
        });
        setWorkloadData(workloadMap);

        notify.success(`Found ${sortedRecommendations.length} AI recommendations`);
      } else {
        setRecommendations([]);
        notify.info('No AI recommendations found for this task');
      }
    } catch (error) {
      console.error('Failed to load AI recommendations:', error);
      
      // Fallback to mock recommendations
      const mockRecommendations = [
        {
          userId: 'user-1',
          taskId: task.id,
          overallScore: 0.92,
          skillMatchScore: 0.95,
          workloadScore: 0.85,
          performanceScore: 0.90,
          availabilityScore: 0.98,
          recommendationReason: 'High skill match and excellent performance history',
          rank: 1,
          displayName: 'John Smith',
          email: 'john.smith@company.com'
        },
        {
          userId: 'user-2', 
          taskId: task.id,
          overallScore: 0.87,
          skillMatchScore: 0.88,
          workloadScore: 0.92,
          performanceScore: 0.85,
          availabilityScore: 0.85,
          recommendationReason: 'Good availability and balanced workload',
          rank: 2,
          displayName: 'Jane Doe',
          email: 'jane.doe@company.com'
        },
        {
          userId: 'user-3',
          taskId: task.id,
          overallScore: 0.82,
          skillMatchScore: 0.80,
          workloadScore: 0.88,
          performanceScore: 0.80,
          availabilityScore: 0.80,
          recommendationReason: 'Decent match with moderate workload',
          rank: 3,
          displayName: 'Mike Johnson',
          email: 'mike.johnson@company.com'
        }
      ];
      
      setRecommendations(mockRecommendations);
      setShowRecommendations(true);
      notify.load.warning('Using sample AI recommendations. Connect to AI service for real analysis.');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleSelectRecommendation = (recommendation) => {
    setFormData(prev => ({
      ...prev,
      assigneeId: recommendation.userId
    }));
    setShowRecommendations(false);
    notify.success(`Selected ${recommendation.displayName} based on AI recommendation`);
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreText = (score) => {
    return `${Math.round((score || 0) * 100)}%`;
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      notify.error('Task title is required', 'Validation Error');
      return;
    }

    // Validate: If assignee is selected, due date must be set
    if (formData.assigneeId && !formData.dueDate) {
      notify.error('Please select a due date when assigning a task to someone', 'Due Date Required');
      return;
    }

    setLoading(true);
    try {
      // Prepare update data
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        assigneeId: formData.assigneeId || null,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null
      };
      console.log("Form data before updated", updateData);
      const response = await apiService.updateTask(task.id, updateData);
      const updatedTask = response.result || response;
      console.log("Task updated:", updatedTask);
      notify.update.success('task');
      onTaskUpdated?.(updatedTask);
      onClose();
      
    } catch (error) {
      console.error('Failed to update task:', error);
      if (error.response?.status === 404) {
        notify.error('Task not found. It may have been deleted.');
      } else if (error.response?.status === 403) {
        notify.error('You do not have permission to edit this task.');
      } else {
        notify.update.error('task');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeId: '',
      dueDate: ''
    });
    setRecommendations([]);
    setShowRecommendations(false);
    setSelectedRecommendationForDetails(null);
    onClose();
  };

  if (!isOpen || !task) return null;

  const typeConfig = getTypeConfig(task.type);
  const TypeIcon = typeConfig.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center">
            <div className="bg-blue-600 rounded-lg p-2 mr-3 shadow-md">
              <PencilSquareIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Task</h2>
              <p className="text-xs text-gray-600 mt-0.5">Update task details and assignments</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Task Type and Skills Info Banner */}
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-indigo-100 p-5">
          <div className="flex flex-wrap items-center gap-4">
            {/* Task Type */}
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-600 mr-2">TYPE:</span>
              <div className={`inline-flex items-center px-3 py-1.5 rounded-full border ${typeConfig.color} shadow-sm`}>
                <TypeIcon className="h-4 w-4 mr-1.5" />
                <span className="text-sm font-medium">{typeConfig.label}</span>
              </div>
            </div>

            {/* Required Skills */}
            {(task.requiredSkills || task.skills || task.tags) && (task.requiredSkills || task.skills || task.tags).length > 0 && (
              <div className="flex items-center flex-1">
                <div className="flex items-center mr-2">
                  <AcademicCapIcon className="h-4 w-4 text-gray-600 mr-1" />
                  <span className="text-xs font-medium text-gray-600 uppercase">Skills:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(task.requiredSkills || task.skills || task.tags || []).slice(0, 5).map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white text-indigo-700 border border-indigo-200 shadow-sm"
                    >
                      {skill}
                    </span>
                  ))}
                  {(task.requiredSkills || task.skills || task.tags || []).length > 5 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white text-gray-600 border border-gray-200">
                      +{(task.requiredSkills || task.skills || task.tags).length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* All Skills Expanded */}
          {(task.requiredSkills || task.skills || task.tags) && (task.requiredSkills || task.skills || task.tags).length > 5 && (
            <div className="mt-3 pt-3 border-t border-indigo-100">
              <div className="flex flex-wrap gap-1.5">
                {(task.requiredSkills || task.skills || task.tags || []).map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white text-indigo-700 border border-indigo-200 shadow-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter a clear and concise task title"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                placeholder="Provide detailed information about the task..."
              />
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <div className="relative">
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer transition-all"
                  >
                    {TASK_STATUSES.map(status => (
                      <option key={status} value={status}>
                        {status.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority
                </label>
                <div className="relative">
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-300 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer transition-all"
                  >
                    {TASK_PRIORITIES.map(priority => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignee */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-5 border-2 border-purple-100">
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="assigneeId" className="flex items-center text-sm font-semibold text-gray-800">
                  <UserIcon className="h-5 w-5 mr-2 text-purple-600" />
                  Assign Task to Team Member
                </label>
                <button
                  type="button"
                  onClick={loadAIRecommendations}
                  disabled={loadingRecommendations || !task?.id}
                  className="flex items-center px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
                >
                  {loadingRecommendations ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      AI Analyzing...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      AI Recommend
                    </>
                  )}
                </button>
              </div>
              
              {loadingUsers ? (
                <div className="flex items-center justify-center py-4 bg-white rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent"></div>
                  <span className="ml-3 text-sm text-gray-600 font-medium">Loading team members...</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="assigneeId"
                    name="assigneeId"
                    value={formData.assigneeId}
                    onChange={handleInputChange}
                    className="w-full border-2 border-purple-200 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none bg-white cursor-pointer hover:border-purple-300 transition-all shadow-sm"
                  >
                    <option value="" className="text-gray-500">
                      🔍 Select team member (optional)
                    </option>
                    {users.map(user => (
                      <option key={user.id} value={user.id} className="py-2">
                        👤 {user.firstName} {user.lastName} • {user.email}
                      </option>
                    ))}
                  </select>
                  {/* Custom dropdown icon */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-purple-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
              
              {/* Display selected user info */}
              {formData.assigneeId && users.length > 0 && (
                <div className="mt-3 p-4 bg-white border-2 border-purple-200 rounded-xl shadow-sm">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg text-lg">
                        {(() => {
                          const selectedUser = users.find(u => u.id === formData.assigneeId);
                          return selectedUser ? `${selectedUser.firstName[0]}${selectedUser.lastName[0]}` : '?';
                        })()}
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {(() => {
                          const selectedUser = users.find(u => u.id === formData.assigneeId);
                          return selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : 'Unknown User';
                        })()}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {(() => {
                          const selectedUser = users.find(u => u.id === formData.assigneeId);
                          return selectedUser?.email || 'No email';
                        })()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, assigneeId: '' }))}
                      className="ml-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg p-2 transition-colors"
                      title="Remove assignee"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* AI Recommendations Panel */}
              {showRecommendations && recommendations.length > 0 && (
                <div className="mt-4 border-2 border-purple-300 rounded-xl p-4 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-purple-900 flex items-center">
                      <SparklesIcon className="h-5 w-5 mr-2 text-purple-600" />
                      AI Employee Recommendations
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowRecommendations(false)}
                      className="text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg p-1 transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {recommendations.slice(0, 5).map((rec, index) => (
                      <RecommendationCard
                        key={rec.userId || index}
                        recommendation={rec}
                        index={index}
                        onSelect={handleSelectRecommendation}
                        getScoreColor={getScoreColor}
                        getScoreText={getScoreText}
                        workloadData={workloadData[rec.userId]}
                        onRefreshWorkload={() => refreshWorkload(rec.userId)}
                      />
                    ))}
                  </div>
                  
                  {recommendations.length > 5 && (
                    <p className="text-xs text-purple-700 mt-3 text-center font-medium">
                      Showing top 5 recommendations ({recommendations.length} total)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="dueDate" className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                Due Date {formData.assigneeId && <span className="text-red-600 ml-1">*</span>}
              </label>
              {formData.assigneeId && !formData.dueDate && (
                <div className="mb-3 flex items-start p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-yellow-800 font-medium">
                    Due date is required when assigning a task to someone
                  </span>
                </div>
              )}
              <input
                type="datetime-local"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className={`w-full border-2 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  formData.assigneeId && !formData.dueDate
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-300'
                }`}
              />
            </div>

            {/* Task Info Display */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-5 border-2 border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-600" />
                Task Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <span className="text-xs font-medium text-gray-500 uppercase block mb-1">Project ID</span>
                  <span className="text-sm font-semibold text-gray-900">{task.projectId || 'N/A'}</span>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <span className="text-xs font-medium text-gray-500 uppercase block mb-1">Created</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {task.estimatedHours && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <span className="text-xs font-medium text-gray-500 uppercase block mb-1">Estimated</span>
                    <span className="text-sm font-semibold text-blue-600">{task.estimatedHours}h</span>
                  </div>
                )}
                {task.actualHours !== null && task.actualHours !== undefined && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <span className="text-xs font-medium text-gray-500 uppercase block mb-1">Actual</span>
                    <span className="text-sm font-semibold text-green-600">{task.actualHours}h</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-medium transition-all shadow-sm"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.title.trim()}
            className="flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <PencilSquareIcon className="h-5 w-5 mr-2" />
                Update Task
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskEditModal;