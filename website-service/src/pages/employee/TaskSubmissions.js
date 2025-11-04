import React, { useState, useEffect } from 'react';
import { 
  DocumentCheckIcon,
  ClockIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  UserIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  StarIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';
import socketIOService from '../../services/socketIOService';
import { useApiNotifications } from '../../hooks/useApiNotifications';

const TaskSubmissions = () => {
  const { user } = useAuth();
  const notify = useApiNotifications();
  const [submissions, setSubmissions] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('my-submissions');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [editingSubmissionId, setEditingSubmissionId] = useState(null);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedProgressPercentage, setEditedProgressPercentage] = useState(0);

  useEffect(() => {
    loadSubmissions();
    loadPendingReviews();
  }, []);

  useEffect(() => {
    // Connect to SocketIO service
    socketIOService.connect();

    // Subscribe to task assignment events
    const unsubscribeStatusUpdate = socketIOService.subscribe('task-assigned', (data) => {
      console.log("Received status update", data);
      if (data.assignedTo === user?.id) {        
        // Convert the received task to our format
        if (data.statusTask) {
          const newStatus = {
            status: data.statusTask
          };

          // Update the task in the tasks list
        setSubmissions(prevSubmission => 
          prevSubmission.map(submission => 
            submission.id === data.submission.id 
              ? {
                  ...submission,
                  status: newStatus,
                  reviewComments: data.review
                }
              : submission
          )
        );
        }
      }
    });

    // Cleanup subscriptions on component unmount
    return () => {
      unsubscribeStatusUpdate();
    };
  }, [user?.id]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user's submissions from API
      const response = await apiService.getMySubmissions();
      const apiSubmissions = response.result || response || [];
      
      console.log('API Submissions:', apiSubmissions);

      // Transform API data and enrich with task details if needed
      const transformedSubmissions = await Promise.all(
        apiSubmissions.map(async (submission) => {
          let taskTitle = submission.taskTitle || 'Unknown Task';
          let projectName = submission.projectName || 'Unknown Project';
          
          // If task details are not included in submission, fetch them
          if (!submission.taskTitle && submission.taskId) {
            try {
              const taskResponse = await apiService.getTask(submission.taskId);
              const task = taskResponse.result || taskResponse;
              taskTitle = task.title || 'Unknown Task';
              projectName = task.projectName || 'Unknown Project';
            } catch (taskError) {
              console.warn(`Failed to fetch task details for ${submission.taskId}:`, taskError);
            }
          }

          return {
            id: submission.id,
            taskId: submission.taskId,
            taskTitle,
            projectName: submission.projectName,
            teamLeadName: submission.teamLeadName,
            submittedAt: submission.submittedAt,
            status: submission.status || 'PENDING',
            reviewedBy: submission.reviewedBy,
            reviewedAt: submission.reviewedAt,
            feedback: submission.reviewComments,
            rating: submission.rating || null,
            files: submission.attachments || [],
            description: submission.description || '',
            workHours: submission.workHours || 0,
            progressPercentage: submission.progressPercentage || 100 // Default to 100% for submitted tasks
          };
        })
      );

      setSubmissions(transformedSubmissions);
      setError(null);
      
    } catch (error) {
      console.error('Failed to load submissions:', error);
      setError('Failed to load submissions. Showing demo data.');
      
      // Fallback to mock data if API fails
      const mockSubmissions = [
        {
          id: 'sub-1',
          taskId: 'task-1',
          taskTitle: 'Implement user authentication',
          projectName: 'Mobile Banking App',
          submittedAt: '2024-10-14T10:30:00',
          status: 'PENDING',
          reviewedBy: null,
          reviewedAt: null,
          feedback: null,
          rating: null,
          files: [
            { name: 'auth-implementation.js', size: '2.4 KB' },
            { name: 'test-results.png', size: '156 KB' }
          ],
          description: 'Completed the OAuth 2.0 implementation with JWT tokens. All tests passing.',
          workHours: 8.5,
          progressPercentage: 95
        },
        {
          id: 'sub-2',
          taskId: 'task-2',
          taskTitle: 'Fix responsive design issues',
          projectName: 'E-commerce Platform',
          submittedAt: '2024-10-12T15:45:00',
          status: 'APPROVED',
          reviewedBy: 'Sarah Johnson',
          reviewedAt: '2024-10-13T09:20:00',
          feedback: 'Excellent work! The responsive design is now working perfectly across all devices. Great attention to detail.',
          rating: 5,
          files: [
            { name: 'responsive-fixes.css', size: '1.8 KB' },
            { name: 'mobile-screenshots.zip', size: '2.1 MB' }
          ],
          description: 'Fixed all responsive design issues on mobile and tablet devices.',
          workHours: 4.2,
          progressPercentage: 100
        },
        {
          id: 'sub-3',
          taskId: 'task-3',
          taskTitle: 'Database optimization',
          projectName: 'Analytics Dashboard',
          submittedAt: '2024-10-10T14:15:00',
          status: 'REVISION_REQUESTED',
          reviewedBy: 'Mike Chen',
          reviewedAt: '2024-10-11T11:30:00',
          feedback: 'Good optimization work, but please add more comprehensive error handling and logging. Also, consider adding database connection pooling.',
          rating: 3,
          files: [
            { name: 'db-optimization.sql', size: '3.2 KB' },
            { name: 'performance-report.pdf', size: '892 KB' }
          ],
          description: 'Optimized slow queries and added indexing for better performance.',
          workHours: 6.8,
          progressPercentage: 85
        }
      ];
      setSubmissions(mockSubmissions);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingReviews = async () => {
    try {
      // Only load pending reviews if user has review permissions (TEAM_LEAD, PROJECT_MANAGER, etc.)
      if (user.role === 'TEAM_LEAD' || user.role === 'PROJECT_MANAGER' || user.role === 'ADMIN') {
        const response = await apiService.getMySubmmission();
        const apiPendingReviews = response.result || response || [];
        
        console.log('API Pending Reviews:', apiPendingReviews);

        // Transform API data and enrich with task details if needed
        const transformedPendingReviews = await Promise.all(
          apiPendingReviews.map(async (submission) => {
            let taskTitle = submission.taskTitle || 'Unknown Task';
            let projectName = submission.projectName || 'Unknown Project';
            
            // If task details are not included in submission, fetch them
            if (!submission.taskTitle && submission.taskId) {
              try {
                const taskResponse = await apiService.getTask(submission.taskId);
                const task = taskResponse.result || taskResponse;
                taskTitle = task.title || 'Unknown Task';
                projectName = task.projectName || 'Unknown Project';
              } catch (taskError) {
                console.warn(`Failed to fetch task details for ${submission.taskId}:`, taskError);
              }
            }

            return {
              id: submission.id,
              taskId: submission.taskId,
              taskTitle,
              projectName,
              submittedBy: submission.submittedBy || 'Unknown User',
              submittedAt: submission.submittedAt,
              status: submission.status || 'PENDING',
              files: submission.attachments || [],
              description: submission.description || '',
              workHours: submission.workHours || 0
            };
          })
        );

        setPendingReviews(transformedPendingReviews);
      } else {
        // Regular employees don't see pending reviews tab
        setPendingReviews([]);
      }
    } catch (error) {
      console.error('Failed to load pending reviews:', error);
      
      // Fallback to mock data for team leads/managers only
      if (user.role === 'TEAM_LEAD' || user.role === 'PROJECT_MANAGER' || user.role === 'ADMIN') {
        const mockPendingReviews = [
          {
            id: 'sub-4',
            taskId: 'task-4',
            taskTitle: 'API endpoint development',
            projectName: 'Mobile Banking App',
            submittedBy: 'John Doe',
            submittedAt: '2024-10-14T16:20:00',
            status: 'PENDING',
            files: [
              { name: 'api-endpoints.js', size: '4.1 KB' },
              { name: 'api-tests.js', size: '2.8 KB' }
            ],
            description: 'Implemented new REST API endpoints for user management with full CRUD operations.',
            workHours: 12.0
          }
        ];
        setPendingReviews(mockPendingReviews);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      NEEDS_REVISION: 'bg-orange-100 text-orange-800',
      // Legacy status mapping for backwards compatibility
      REVISION_REQUESTED: 'bg-orange-100 text-orange-800',
      IN_REVIEW: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'REJECTED':
        return <XMarkIcon className="h-5 w-5 text-red-600" />;
      case 'NEEDS_REVISION':
      case 'REVISION_REQUESTED': // Legacy support
        return <XMarkIcon className="h-5 w-5 text-orange-600" />;
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return <DocumentCheckIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRatingStars = (rating) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating}/5)</span>
      </div>
    );
  };

  const handleReviewSubmission = async (submissionId, approved, feedback, rating) => {
    try {
      // API call to PUT /submissions/{submissionId}/review
      console.log('Reviewing submission:', submissionId, { approved, feedback, rating });
      
      setPendingReviews(prev => prev.filter(sub => sub.id !== submissionId));
    } catch (error) {
      console.error('Failed to review submission:', error);
    }
  };

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
  };

  const refreshSubmissions = async () => {
    await loadSubmissions();
    await loadPendingReviews();
  };

   // NEW: Handle edit submission
  const handleEditSubmission = async (submissionId) => {
    const submission = submissions.find(s => s.id === submissionId);
    if (submission) {
      setEditingSubmissionId(submissionId);
      setEditedDescription(submission.description);
      // Set current progress or default to 100% for submitted tasks
      setEditedProgressPercentage(submission.progressPercentage || 100);
    }
  };

  // NEW: Save edited submission
  const handleSaveEdit = async (submissionId, taskId) => {
    try {
      // Validate progress percentage
      if (editedProgressPercentage < 0 || editedProgressPercentage > 100) {
        notify.error('Progress percentage must be between 0 and 100');
        return;
      }

      const updateRequest = {
        description: editedDescription,
        progressPercentage: editedProgressPercentage,
        attachments: submissions.find(s => s.id === submissionId)?.files || []
      };

      await apiService.editSubmission(taskId, submissionId, updateRequest);
      notify.success('Submission updated successfully');
      
      // Refresh submissions
      await loadSubmissions();
      
      // Exit edit mode
      setEditingSubmissionId(null);
      setEditedDescription('');
      setEditedProgressPercentage(0);
    } catch (error) {
      console.error('Failed to update submission:', error);
      notify.error('Failed to update submission');
    }
  };

  // NEW: Cancel edit
  const handleCancelEdit = () => {
    setEditingSubmissionId(null);
    setEditedDescription('');
    setEditedProgressPercentage(0);
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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Task Submissions</h1>
              <p className="text-gray-600 mt-2">
                Track your task submissions and review others' work
              </p>
            </div>
            <button
              onClick={refreshSubmissions}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XMarkIcon className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('my-submissions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-submissions'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Submissions ({submissions.length})
              </button>
              
              {(user.role === 'TEAM_LEAD' || user.role === 'PROJECT_MANAGER' || user.role === 'ADMIN') && (
                <button
                  onClick={() => setActiveTab('pending-reviews')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'pending-reviews'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Pending Reviews ({pendingReviews.length})
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* My Submissions Tab */}
        {activeTab === 'my-submissions' && (
          <div className="space-y-6">
            {submissions.map((submission) => (
              <div key={submission.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{submission.taskTitle}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(submission.status)}`}>
                        {submission.status.replace('_', ' ')}
                      </span>
                      {getStatusIcon(submission.status)}
                    </div>

                    {/* Description and Progress - Editable */}
                    <div className='flex items-start space-x-3 mb-4'>
                      <p className="text-gray-800 font-bold whitespace-nowrap">Description:</p>
                      {editingSubmissionId === submission.id ? (
                        <div className="flex-1">
                          <textarea
                            value={editedDescription}
                            onChange={(e) => setEditedDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={3}
                            placeholder="Describe your work and what you've accomplished..."
                          />
                          
                          {/* Progress Percentage Input */}
                          <div className="mt-3 flex items-center space-x-4">
                            <label className="text-sm font-medium text-gray-700">
                              Progress Percentage:
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={editedProgressPercentage}
                                onChange={(e) => setEditedProgressPercentage(Number(e.target.value))}
                                className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              />
                              <span className="text-sm text-gray-500">%</span>
                              <div className="flex-1 max-w-32">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(100, Math.max(0, editedProgressPercentage))}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 mt-3">
                            <button
                              onClick={() => handleSaveEdit(submission.id, submission.taskId)}
                              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 mb-2">{submission.description}</p>
                          
                          {/* Display current progress percentage */}
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span className="font-medium">Progress:</span>
                            <span>{submission.progressPercentage || 100}%</span>
                            <div className="flex-1 max-w-24">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ width: `${submission.progressPercentage || 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        <span>{submission.projectName}</span>
                      </div>
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-2" />
                        <span>{submission.teamLeadName}</span>
                      </div>
                      <div className="flex items-center">
                        <CalendarDaysIcon className="h-4 w-4 mr-2" />
                        <span>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        <span>{submission.workHours}h logged</span>
                      </div>
                    </div>

                    {/* Files */}
                    {submission.files && submission.files.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Submitted Files:</h4>
                        <div className="flex flex-wrap gap-2">
                          {submission.files.map((file, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              <DocumentTextIcon className="h-3 w-3 mr-1" />
                              {file.name} ({file.size})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Review Feedback */}
                    {submission.reviewedBy && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                              Reviewed by {submission.reviewedBy}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {new Date(submission.reviewedAt).toLocaleDateString()}
                            </span>
                            {getRatingStars(submission.rating)}
                          </div>
                        </div>
                        {submission.feedback && (
                          <div className="flex items-start space-x-2">
                            <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600">{submission.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end space-y-2 ml-6">
                    <button
                      onClick={() => handleViewSubmission(submission)}
                      className="flex items-center text-primary-600 hover:text-primary-500 text-sm font-medium"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                    
                    {/* Show Edit button for PENDING or NEEDS_REVISION status */}
                    {(submission.status === 'PENDING' || submission.status === 'NEEDS_REVISION') && 
                     editingSubmissionId !== submission.id && (
                      <button
                        onClick={() => handleEditSubmission(submission.id)}
                        className="flex items-center text-blue-600 hover:text-blue-500 text-sm font-medium"
                      >
                        <PencilSquareIcon className="h-4 w-4 mr-1" />
                        Edit Submission
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pending Reviews Tab */}
        {activeTab === 'pending-reviews' && (
          <div className="space-y-6">
            {pendingReviews.map((submission) => (
              <div key={submission.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                {/* Pending review content */}
              </div>
            ))}

            {pendingReviews.length === 0 && (
              <div className="text-center py-12">
                <DocumentCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending reviews</h3>
                <p className="text-gray-600">
                  All submissions have been reviewed
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {activeTab === 'my-submissions' && submissions.length === 0 && !loading && (
          <div className="text-center py-12">
            <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
            <p className="text-gray-600">
              Complete and submit your tasks to see them here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskSubmissions;