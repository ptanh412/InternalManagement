import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import TaskRecommendations from './TaskRecommendations';

const TaskRecommendationsModal = ({ 
  isOpen, 
  onClose, 
  taskId, 
  taskTitle, 
  onSelectEmployee 
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const handleSelectEmployee = (userId, recommendationData) => {
    setSelectedEmployee({ userId, recommendationData });
    if (onSelectEmployee) {
      onSelectEmployee(userId, recommendationData);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedEmployee && onSelectEmployee) {
      onSelectEmployee(selectedEmployee.userId, selectedEmployee.recommendationData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI Task Assignment Recommendations</h2>
            {taskTitle && (
              <p className="text-sm text-gray-600 mt-1">
                Task: <span className="font-medium">{taskTitle}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <TaskRecommendations
            taskId={taskId}
            onSelectEmployee={handleSelectEmployee}
            onClose={null} // Don't show close button in the component since we have it in the modal
          />
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedEmployee ? (
                <span className="text-green-600 font-medium">
                  ✅ Employee {selectedEmployee.userId} selected
                </span>
              ) : (
                'Select an employee to assign this task'
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              {selectedEmployee && (
                <button
                  onClick={handleConfirmSelection}
                  className="btn-primary"
                >
                  Confirm Assignment
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskRecommendationsModal;