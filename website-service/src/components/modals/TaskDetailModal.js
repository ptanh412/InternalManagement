import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  UserIcon,
  CalendarDaysIcon,
  ClockIcon,
  TagIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/apiService';
import { useApiNotifications } from '../../hooks/useApiNotifications';
import { useAuth } from '../../hooks/useAuth';
import ImagePreviewModal from '../ImagePreviewModal';

const SubmissionReviewCard = ({ submission, onReview, onEditReview, onEditSubmission, currentUser, userRole }) => {
  const [reviewMode, setReviewMode] = useState(false);
  const [editReviewMode, setEditReviewMode] = useState(false);
  const [editSubmissionMode, setEditSubmissionMode] = useState(false);
  const [reviewComments, setReviewComments] = useState('');
  const [qualityRating, setQualityRating] = useState(null);
  const [taskComplexity, setTaskComplexity] = useState('MEDIUM');
  const [editedComments, setEditedComments] = useState(submission.reviewComments || '');
  const [editedDescription, setEditedDescription] = useState(submission.description || '');
  const [editedStatus, setEditedStatus] = useState(submission.status);
  const [previewImage, setPreviewImage] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const getSubmissionStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'NEEDS_REVISION': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleReview = (status) => {
    onReview(submission.id, status, reviewComments, qualityRating, taskComplexity);
    setReviewMode(false);
    setReviewComments('');
    setQualityRating(null);
    setTaskComplexity('MEDIUM');
  };

  // console.log(submission.id, editedStatus, editedComments);
  const handleEditReview = () => {
    onEditReview(submission.id, editedStatus, editedComments);
    setEditReviewMode(false);
  };

  const handleEditSubmission = () => {
    onEditSubmission(submission.id, {
      description: editedDescription,
      attachments: submission.attachments
    });
    setEditSubmissionMode(false);
  };

  const isImageFile = (fileType) => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    return imageTypes.includes(fileType?.toLowerCase());
  };
  const handleDownloadfile = async (fileUrl, fileType, fileName) => {
    const urlParts = fileUrl.split('/');
    const fileId = urlParts[urlParts.length - 1];
    
    try {
        const response = await apiService.dowloadFile(fileId);
        
        
        const contentType = response.headers?.['content-type'] || fileType;
        
        const blob = new Blob([response.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Download failed:', error);
    }  
  }
  // Handle click vào attachment
  const handleAttachmentClick = (attachment) => {
    if (isImageFile(attachment.type)) {
      // Nếu là hình ảnh, mở preview modal
      setPreviewImage(attachment);
      setIsPreviewOpen(true);
    } else {
      // Nếu không phải hình ảnh, tải xuống trực tiếp
      handleDownloadfile(attachment.url, attachment.type);
    }
  };

  // Handle download từ preview modal
  const handleDownloadFromPreview = () => {
    if (previewImage) {
      handleDownloadfile(previewImage.url, previewImage.type);
    }
  };
 
  // Check if current user can edit review
  const canEditReview = currentUser.role === 'TEAM_LEAD' || currentUser.userRole === 'PROJECT_MANAGER' || currentUser.userRole === 'ADMIN';

  // Check if current user can edit submission
  const canEditSubmission = 
    (submission.status === 'PENDING' || submission.status === 'REJECTED');

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      {/* Submission Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h5 className="text-lg font-medium text-gray-900">
              Submission #{submission.id || 'N/A'}
            </h5>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSubmissionStatusColor(submission.status || 'PENDING')}`}>
              {submission.status || 'PENDING'}
            </span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Submitted by: {submission.submittedBy || 'Unknown'}</p>
            <p>Date: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Unknown'}</p>
          </div>
        </div>

        {/* Edit Submission Button */}
        {canEditSubmission && !editSubmissionMode && (
          <button
            onClick={() => setEditSubmissionMode(true)}
            className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <PencilSquareIcon className="h-4 w-4 mr-1" />
            Edit Submission
          </button>
        )}
      </div>

      {/* Submission Content */}
      <div className="space-y-4 mb-4">
        {/* Description */}
        <div>
          <h6 className="text-sm font-medium text-gray-700 mb-2">Description</h6>
          {editSubmissionMode ? (
            <textarea
              rows={4}
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Update your submission description..."
            />
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-900">
                {submission.description || 'No description provided'}
              </p>
            </div>
          )}
        </div>

        {/* Attachments */}
        {submission.attachments && submission.attachments.length > 0 && (
          <div>
            <h6 className="text-sm font-medium text-gray-700 mb-2">Attachments</h6>
            <div className="space-y-2">
              {submission.attachments.map((attachment, idx) => {
                const isImage = isImageFile(attachment.type);

                return (
                  <div 
                    key={idx} 
                    className={`flex items-center space-x-3 p-3 bg-gray-50 rounded-lg ${
                      isImage ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''
                    }`}
                    onClick={() => isImage && handleAttachmentClick(attachment)}
                  >
                    {/* Icon hiển thị khác nhau cho hình ảnh */}
                    {isImage ? (
                      <div className="relative h-12 w-12 flex-shrink-0">
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="h-12 w-12 object-cover rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <DocumentTextIcon 
                          className="h-12 w-12 text-gray-500 hidden" 
                        />
                      </div>
                    ) : (
                      <DocumentTextIcon className="h-8 w-8 text-gray-500 flex-shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {attachment.name}
                      </p>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-gray-500">
                          {attachment.size || 'Unknown size'}
                        </p>
                        {isImage && (
                          <span className="text-xs text-blue-600 font-medium">
                            Click to preview
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {attachment.url && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadfile(attachment.url, attachment.type, attachment.name);
                        }}
                        className="inline-flex items-center px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex-shrink-0"
                      >
                        <CloudArrowDownIcon className="h-3 w-3 mr-1" />
                        Download
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ImagePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        imageUrl={previewImage?.url}
        imageName={previewImage?.name}
        onDownload={handleDownloadFromPreview}
      />

      {/* Edit Submission Actions */}
      {editSubmissionMode && (
        <div className="border-t border-gray-200 pt-4 mb-4">
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setEditSubmissionMode(false);
                setEditedDescription(submission.description || '');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleEditSubmission}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Review Section - For Pending Submissions */}
      {submission.status === 'PENDING' && !editSubmissionMode && (
        <div className="border-t border-gray-200 pt-4">
          {reviewMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review Comments</label>
                <textarea
                  rows={3}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Provide feedback for the team member..."
                />
              </div>

              {/* Quality Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality Rating (1-5) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setQualityRating(rating)}
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        qualityRating === rating
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700 font-bold'
                          : 'border-gray-300 hover:border-yellow-300 text-gray-600'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  1 = Poor, 2 = Fair, 3 = Good, 4 = Very Good, 5 = Excellent
                </p>
              </div>

              {/* Task Complexity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Complexity <span className="text-red-500">*</span>
                </label>
                <select
                  value={taskComplexity}
                  onChange={(e) => setTaskComplexity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="LOW">Low - Simple task, minimal effort required</option>
                  <option value="MEDIUM">Medium - Moderate complexity and effort</option>
                  <option value="HIGH">High - Complex task requiring significant effort</option>
                  <option value="CRITICAL">Critical - Highly complex, mission-critical task</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setReviewMode(false);
                    setReviewComments('');
                    setQualityRating(null);
                    setTaskComplexity('MEDIUM');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReview('REJECTED')}
                  disabled={!qualityRating}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleReview('NEEDS_REVISION')}
                  disabled={!qualityRating}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Request Changes
                </button>
                <button
                  onClick={() => handleReview('APPROVED')}
                  disabled={!qualityRating}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Approve
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                onClick={() => setReviewMode(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Review Submission
              </button>
            </div>
          )}
        </div>
      )}

      {/* Previous Review Section */}
      {submission.reviewComments && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h6 className="text-sm font-medium text-gray-700">Review Feedback</h6>
            {canEditReview && !editReviewMode && (
              <button
                onClick={() => setEditReviewMode(true)}
                className="flex items-center px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
              >
                <PencilSquareIcon className="h-3 w-3 mr-1" />
                Edit Review
              </button>
            )}
          </div>

          {editReviewMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={editedStatus}
                  onChange={(e) => setEditedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="NEEDS_REVISION">Needs Revision</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
                <textarea
                  rows={3}
                  value={editedComments}
                  onChange={(e) => setEditedComments(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Update your review comments..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setEditReviewMode(false);
                    setEditedComments(submission.reviewComments || '');
                    setEditedStatus(submission.status);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditReview}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Update Review
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-900">{submission.reviewComments}</p>
              {submission.reviewedBy && (
                <p className="text-xs text-gray-500 mt-2">
                  Reviewed by {submission.reviewedBy} on {new Date(submission.reviewedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TaskDetailModal = ({ isOpen, onClose, taskId, onEdit }) => {
  const notify = useApiNotifications();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assigneeName, setAssigneeName] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && taskId) {
      loadTaskDetails();
      // Load submissions if user has permission (team lead, project manager, admin)
      if (user.role === 'TEAM_LEAD' || user.role === 'PROJECT_MANAGER' || user.role === 'ADMIN') {
        loadSubmissions();
      }
    }
  }, [isOpen, taskId, user.role]);

  const loadTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTask(taskId);
      
      // Handle direct response or wrapped response
      const taskData = response.result || response;
      setTask(taskData);
      
      // Load assignee name if assigneeId exists
      if (taskData.assigneeId) {
        try {
          const userResponse = await apiService.getUser(taskData.assigneeId);
          const userData = userResponse.result || userResponse;
          if (userData) {
            setAssigneeName(`${userData.firstName} ${userData.lastName}`);
          }
        } catch (error) {
          console.warn('Failed to load assignee details:', error);
          setAssigneeName('Unknown User');
        }
      }
      
    } catch (error) {
      console.error('Failed to load task details:', error);
      notify.load.error('task details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    if (!taskId) return;
    
    try {
      setSubmissionsLoading(true);
      const response = await apiService.getTaskSubmissions(taskId);
      const submissionData = response.result || response || [];
      setSubmissions(submissionData);
    } catch (error) {
      console.error('Failed to load submissions:', error);
      notify.load.error('task submissions');
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleReviewSubmission = async (submissionId, status, comments = '', qualityRating = null, taskComplexity = 'MEDIUM') => {
    try {
      await apiService.reviewSubmission(task.id, submissionId, status, comments, qualityRating, taskComplexity);
      notify.success(`Submission ${status.toLowerCase()} successfully`);
      // Reload submissions to reflect the update
      await loadSubmissions();
    } catch (error) {
      console.error('Failed to review submission:', error);
      notify.error('Failed to review submission');
    }
  };
const handleEditReview = async (submissionId, status, comments) => {
  console.log("Result: ", submissionId, status, comments);
  try {
    await apiService.editReview(task.id, submissionId, status, comments);
    notify.success('Review updated successfully');
    // Reload submissions to reflect the update
    await loadSubmissions();
  } catch (error) {
    console.error('Failed to edit review:', error);
    notify.error('Failed to update review');
  }
 };
  const handleEdit = () => {
    onEdit(task);
    onClose();
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
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'IN_PROGRESS':
        return <ClockIcon className="h-5 w-5 text-blue-600" />;
      case 'IN_REVIEW':
        return <DocumentTextIcon className="h-5 w-5 text-purple-600" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Task Management</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs - only show submissions tab if user has permission */}
        {(user.role === 'TEAM_LEAD' || user.role === 'PROJECT_MANAGER' || user.role === 'ADMIN') && (
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'details'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Task Details
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'submissions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Submissions ({submissions.length})
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'details' && (
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : task ? (
            <div className="space-y-6">
              {/* Title and Status */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  {getStatusIcon(task.status)}
                  <h3 className="text-2xl font-bold text-gray-900">{task.title}</h3>
                </div>
                <div className="flex gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                    {task.status?.replace('_', ' ')}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority} Priority
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600 leading-relaxed">
                  {task.description || 'No description provided'}
                </p>
              </div>

              {/* Task Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assignment Info */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Assignment</h4>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <UserIcon className="h-4 w-4 mr-2" />
                    <span className="font-medium mr-2">Assigned to:</span>
                    {assigneeName || 'Unassigned'}
                  </div>
                  
                  {task.createdBy && (
                    <div className="flex items-center text-sm text-gray-600">
                      <UserIcon className="h-4 w-4 mr-2" />
                      <span className="font-medium mr-2">Created by:</span>
                      {task.createdBy}
                    </div>
                  )}
                </div>

                {/* Timeline Info */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Timeline</h4>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarDaysIcon className="h-4 w-4 mr-2" />
                    <span className="font-medium mr-2">Due Date:</span>
                    {formatDate(task.dueDate)}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarDaysIcon className="h-4 w-4 mr-2" />
                    <span className="font-medium mr-2">Created:</span>
                    {formatDate(task.createdAt)}
                  </div>
                  
                  {task.updatedAt && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarDaysIcon className="h-4 w-4 mr-2" />
                      <span className="font-medium mr-2">Last Updated:</span>
                      {formatDate(task.updatedAt)}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress and Time Tracking */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Time Tracking */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Time Tracking</h4>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span className="font-medium mr-2">Estimated:</span>
                    {task.estimatedHours || 0} hours
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span className="font-medium mr-2">Actual:</span>
                    {task.actualHours || 0} hours
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Progress</h4>
                  
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Completion</span>
                      <span>{task.progressPercentage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${task.progressPercentage || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags and Skills */}
              {(task.tags?.length > 0 || task.requiredSkills?.length > 0) && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Tags & Skills</h4>
                  
                  {task.tags?.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 mb-2 block">Tags:</span>
                      <div className="flex flex-wrap gap-2">
                        {task.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                          >
                            <TagIcon className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {task.requiredSkills?.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700 mb-2 block">Required Skills:</span>
                      <div className="flex flex-wrap gap-2">
                        {task.requiredSkills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {task.type && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Type:</span>
                    <span className="ml-2 text-sm text-gray-600">{task.type}</span>
                  </div>
                )}
                
                {task.difficulty && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Difficulty:</span>
                    <span className="ml-2 text-sm text-gray-600">{task.difficulty}</span>
                  </div>
                )}
                
                {task.department && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Department:</span>
                    <span className="ml-2 text-sm text-gray-600">{task.department}</span>
                  </div>
                )}
                
                {task.taskType && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Task Type:</span>
                    <span className="ml-2 text-sm text-gray-600">{task.taskType}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
                <div className="text-center py-12">
                  <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Task not found</h3>
                  <p className="text-gray-600">The task details could not be loaded.</p>
                </div>
              )}
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === 'submissions' && (user.role === 'TEAM_LEAD' || user.role === 'PROJECT_MANAGER' || user.role === 'ADMIN') && (
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">Task Submissions</h4>
                <p className="text-sm text-gray-600">
                  Review and manage submissions for this task.
                </p>
              </div>

              {submissionsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
                  <p className="text-gray-600">
                    No submissions have been made for this task.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {submissions.map((submission, index) => (
                    <SubmissionReviewCard 
                      key={submission.id || index}
                      submission={submission}
                      onReview={handleReviewSubmission}
                      onEditReview={handleEditReview}  // Thêm dòng này
                      currentUser= {user}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          
          {task && (
            <button
              onClick={handleEdit}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PencilSquareIcon className="h-4 w-4 mr-2" />
              Edit Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;