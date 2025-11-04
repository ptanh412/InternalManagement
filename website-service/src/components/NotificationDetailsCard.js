import {CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const NotificationDetailCard = ({ notification, getTimeAgo }) => {
  // Render task assignment details
  if (notification.type === 'task-assigned' || notification.type === 'TASK_ASSIGNMENT' || notification.type === 'TASK_SUBMISSION') {
    const taskData = notification.data;
    return (
      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <p className="text-xs font-medium text-blue-800 mb-1">Task Details</p>
            <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
          </div>
        </div>
        
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Project:</span>
            <span className="font-medium text-gray-900">{taskData.projectName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Content:</span>
            <span className="font-medium text-gray-900">{notification.message}</span>
          </div>
          {/* <div className="flex items-center justify-between">
            <span className="text-gray-600">Assigned by:</span>
            <span className="font-medium text-gray-900">{notification.teamLeadName || taskData?.assignedBy}</span>
          </div> */}
          {taskData?.dueDate && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Due date:</span>
              <span className="font-medium text-gray-900">{taskData.dueDate}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  if (notification.type === 'TASK_TRANSFER') {
    const taskData = notification.data;
    return (
      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <p className="text-xs font-medium text-blue-800 mb-1">Task Details</p>
            <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
          </div>
        </div>
        
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Project:</span>
            <span className="font-medium text-gray-900">{taskData.projectName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Content:</span>
            <span className="font-medium text-gray-900">{notification.message}</span>
          </div>
          {taskData?.dueDate && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Due date:</span>
              <span className="font-medium text-gray-900">{taskData.dueDate}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render task review details
  if (notification.type === 'task-status-update' || notification.type === 'TASK_REVIEW') {
    const reviewData = notification.submission || notification.data;
    const status = notification.newTaskStatus || reviewData?.reviewStatus;
    const isApproved = status?.toLowerCase() === 'approved';
    
    return (
      <div className={`mt-2 p-3 rounded-lg border ${
        isApproved 
          ? 'bg-green-50 border-green-200' 
          : 'bg-orange-50 border-orange-200'
      }`}>
        <div className="flex items-start space-x-2 mb-2">
          {isApproved ? (
            <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircleIcon className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={`text-xs font-medium mb-1 ${
              isApproved ? 'text-green-800' : 'text-orange-800'
            }`}>
              Review Status: {status}
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {reviewData?.taskTitle || notification.title}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {reviewData?.projectName && (
            <div className="text-xs">
              <span className="text-gray-600">Project: </span>
              <span className="font-medium text-gray-900">{reviewData.projectName}</span>
            </div>
          )}
          
          {reviewData?.reviewedBy && (
            <div className="text-xs">
              <span className="text-gray-600">Reviewed by: </span>
              <span className="font-medium text-gray-900">{reviewData.reviewedBy}</span>
            </div>
          )}

          {reviewData?.newTaskStatus && (
            <div className="text-xs">
              <span className="text-gray-600">New Status: </span>
              <span className={`font-medium px-2 py-0.5 rounded ${
                reviewData.newTaskStatus === 'DONE' 
                  ? 'bg-green-100 text-green-800'
                  : reviewData.newTaskStatus === 'IN_PROGRESS'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {reviewData.newTaskStatus}
              </span>
            </div>
          )}

          {(notification.review || reviewData?.comments) && (
            <div className={`mt-2 p-2 rounded text-xs ${
              isApproved ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              <p className={`font-medium mb-1 ${
                isApproved ? 'text-green-800' : 'text-orange-800'
              }`}>
                Review Comments:
              </p>
              <p className="text-gray-700 whitespace-pre-wrap">
                {notification.review || reviewData?.comments}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render project details for project notifications
  if (notification.project) {
    return (
      <div className="mt-2 p-2 bg-white rounded border">
        <p className="text-xs font-medium text-gray-600">Project:</p>
        <p className="text-sm text-gray-900">{notification.project.name}</p>
        <p className="text-xs text-gray-500">
          Status: {notification.project.status} | Priority: {notification.project.priority}
        </p>
      </div>
    );
  }

  return null;
};

export default NotificationDetailCard;