import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  ClockIcon, 
  CalendarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const TaskExtensionModal = ({ 
  isOpen, 
  task, 
  onClose, 
  onSubmit 
}) => {
  const [extensionHours, setExtensionHours] = useState(8);
  const [reason, setReason] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  console.log('Task due date:', task?.dueDate);

  useEffect(() => {
    if (task?.dueDate) {
      // Calculate default new due date (current due date + extension hours)
      const currentDue = new Date(task.dueDate);
      const calculated = new Date(currentDue.getTime() + extensionHours * 60 * 60 * 1000);
      
      // Get date in local timezone (YYYY-MM-DD)
      const year = calculated.getFullYear();
      const month = String(calculated.getMonth() + 1).padStart(2, '0');
      const day = String(calculated.getDate()).padStart(2, '0');
      setSelectedDate(`${year}-${month}-${day}`);
    }
  }, [task, extensionHours]);

  const handleExtensionHoursChange = (hours) => {
    setExtensionHours(hours);
    
    // Auto-calculate new due date
    if (task?.dueDate) {
      const currentDue = new Date(task.dueDate);
      const calculated = new Date(currentDue.getTime() + hours * 60 * 60 * 1000);
      
      // Get date in local timezone (YYYY-MM-DD)
      const year = calculated.getFullYear();
      const month = String(calculated.getMonth() + 1).padStart(2, '0');
      const day = String(calculated.getDate()).padStart(2, '0');
      setSelectedDate(`${year}-${month}-${day}`);
    }
  };

  const handleNewDueDateChange = (dateString) => {
    if (!dateString) {
      setSelectedDate('');
      setExtensionHours(0);
      return;
    }

    setSelectedDate(dateString);
    
    // Calculate extension hours (just estimate, backend will handle exact time)
    if (task?.dueDate) {
      const currentDue = new Date(task.dueDate);
      const newDate = new Date(dateString);
      const hoursDiff = Math.round((newDate - currentDue) / (1000 * 60 * 60));
      setExtensionHours(Math.max(1, hoursDiff));
    }
  };

  const handleSubmit = async () => {
    // Validations
    if (!reason.trim()) {
      alert('Please provide a reason for the extension request.');
      return;
    }

    if (!selectedDate) {
      alert('Please select a new due date.');
      return;
    }

    if (extensionHours < 1) {
      alert('Extension hours must be at least 1 hour.');
      return;
    }

    if (new Date(selectedDate) <= new Date(task.dueDate)) {
      alert('New due date must be after the current due date.');
      return;
    }

    setSubmitting(true);
    try {
      // Gửi ngày đơn giản (YYYY-MM-DD), backend sẽ tự set 23:59:59
      const extensionData = {
        extensionHours: extensionHours,
        newDueDate: selectedDate, // Chỉ gửi YYYY-MM-DD
        reason: reason.trim()
      };

      console.log('📤 Submitting extension request:', {
        ...extensionData,
        currentDueDate: task.dueDate
      });
      
      await onSubmit(extensionData);
      
      // Reset form
      setExtensionHours(8);
      setReason('');
      setSelectedDate('');
      onClose();
      
    } catch (error) {
      console.error('❌ Failed to submit extension request:', error);
      alert(error.response?.data?.message || 'Failed to submit extension request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Request Task Extension</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{task?.title}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {/* Info Alert */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Extension Request Guidelines</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Maximum 2 extensions allowed per task</li>
                <li>Extension requests must be approved by team lead</li>
                <li>Provide clear reasoning for the extension</li>
              </ul>
            </div>
          </div>

          {/* Current Task Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Current Due Date</p>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {new Date(task?.dueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Original Estimate</p>
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {task?.estimatedHours || 0} hours
                </p>
              </div>
            </div>
          </div>

          {/* Extension Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Extension Hours <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="80"
                step="1"
                value={extensionHours}
                onChange={(e) => handleExtensionHoursChange(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <input
                type="number"
                min="1"
                max="200"
                value={extensionHours}
                onChange={(e) => handleExtensionHoursChange(Math.max(1, Number(e.target.value)))}
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">hours</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-2">
              Request additional time to complete the task (1-200 hours)
            </p>
          </div>

          {/* New Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={selectedDate} 
              onChange={(e) => handleNewDueDateChange(e.target.value)}
              min={new Date(task?.dueDate).toISOString().slice(0, 10)} 
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-2">
              Calculated based on extension hours. You can adjust manually.
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for Extension <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Explain why you need additional time for this task. Include any blockers, challenges, or scope changes..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">
              Provide a clear and detailed explanation (minimum 20 characters)
            </p>
          </div>

          {/* Warning for overdue tasks */}
          {task?.dueDate && new Date(task.dueDate) < new Date() && (
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-medium">This task is overdue</p>
                <p className="text-xs mt-1">
                  Extension requests for overdue tasks require additional justification
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 px-6 py-4 flex items-center justify-between border-t">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            New estimated completion: <span className="font-semibold">
              {(task?.estimatedHours || 0) + extensionHours} hours
            </span>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={submitting || !reason.trim() || extensionHours < 1}
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskExtensionModal;