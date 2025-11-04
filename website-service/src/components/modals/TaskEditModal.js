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
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/apiService';
import { useApiNotifications } from '../../hooks/useApiNotifications';

// Recommendation Card Component
const RecommendationCard = ({ recommendation, index, onSelect, getScoreColor, getScoreText }) => {
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

          {recommendation.geminiReasoning && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-gray-700 mb-1">AI Reasoning:</h5>
              <p className="text-xs text-gray-600">{recommendation.geminiReasoning}</p>
            </div>
          )}

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
        </div>
      )}
    </div>
  );
};

const TaskEditModal = ({ isOpen, onClose, task, onTaskUpdated }) => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <PencilSquareIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Edit Task</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter task title"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter task description"
              />
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {TASK_STATUSES.map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {TASK_PRIORITIES.map(priority => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assignee */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700">
                  <UserIcon className="h-4 w-4 inline mr-1" />
                  Assigned To
                </label>
                <button
                  type="button"
                  onClick={loadAIRecommendations}
                  disabled={loadingRecommendations || !task?.id}
                  className="flex items-center px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingRecommendations ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                      AI Analyzing...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-3 w-3 mr-1" />
                      AI Recommend
                    </>
                  )}
                </button>
              </div>
              
              {loadingUsers ? (
                <div className="flex items-center justify-center py-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading users...</span>
                </div>
              ) : (
                <select
                  id="assigneeId"
                  name="assigneeId"
                  value={formData.assigneeId}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select assignee (optional)</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              )}
              
              {/* AI Recommendations Panel */}
              {showRecommendations && recommendations.length > 0 && (
                <div className="mt-3 border border-purple-200 rounded-lg p-4 bg-purple-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-purple-900 flex items-center">
                      <SparklesIcon className="h-4 w-4 mr-1" />
                      AI Employee Recommendations
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowRecommendations(false)}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {recommendations.slice(0, 5).map((rec, index) => (
                      <RecommendationCard
                        key={rec.userId || index}
                        recommendation={rec}
                        index={index}
                        onSelect={handleSelectRecommendation}
                        getScoreColor={getScoreColor}
                        getScoreText={getScoreText}
                      />
                    ))}
                  </div>
                  
                  {recommendations.length > 5 && (
                    <p className="text-xs text-purple-600 mt-2 text-center">
                      Showing top 5 recommendations ({recommendations.length} total)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Due Date
              </label>
              <input
                type="datetime-local"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Task Info Display */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Task Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Project ID:</span> {task.projectId || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Created:</span>{' '}
                  {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'}
                </div>
                {task.estimatedHours && (
                  <div>
                    <span className="font-medium">Estimated Hours:</span> {task.estimatedHours}h
                  </div>
                )}
                {task.actualHours && (
                  <div>
                    <span className="font-medium">Actual Hours:</span> {task.actualHours}h
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.title.trim()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <PencilSquareIcon className="h-4 w-4 mr-2" />
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