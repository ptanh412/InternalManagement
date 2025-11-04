import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../hooks/useAuth';

const CreateTaskModal = ({ isOpen, onClose, onTaskCreated, projects, defaultProjectId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: defaultProjectId || '',
    assigneeId: '',
    priority: 'MEDIUM',
    status: 'TODO',
    estimatedHours: '',
    dueDate: '',
    skills: []
  });
  const [errors, setErrors] = useState({});

  const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'TESTING', 'DONE'];

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
      // Set default project if provided
      if (defaultProjectId) {
        setFormData(prev => ({
          ...prev,
          projectId: defaultProjectId
        }));
      }
    }
  }, [isOpen, defaultProjectId]);

  const loadEmployees = async () => {
    try {
      const response = await apiService.getUsersByRole('EMPLOYEE');
      setEmployees(response.result || []);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.projectId) {
      newErrors.projectId = 'Project is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }

    if (formData.estimatedHours && (isNaN(formData.estimatedHours) || formData.estimatedHours < 0)) {
      newErrors.estimatedHours = 'Estimated hours must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : null,
        createdBy: user.id
      };

      const response = await apiService.createTask(taskData);
      
      if (response.result) {
        onTaskCreated(response.result);
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          projectId: defaultProjectId || '',
          assigneeId: '',
          priority: 'MEDIUM',
          status: 'TODO',
          estimatedHours: '',
          dueDate: '',
          skills: []
        });
        setErrors({});
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      setErrors({
        submit: error.response?.data?.message || 'Failed to create task. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Create New Task</h3>
            <p className="text-sm text-gray-600 mt-1">Add a new task to your project</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DocumentTextIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter task title..."
              />
            </div>
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Describe the task in detail..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Project and Assignee Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project <span className="text-red-500">*</span>
              </label>
              <select
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.projectId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="mt-1 text-sm text-red-600">{errors.projectId}</p>
              )}
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignee <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  name="assigneeId"
                  value={formData.assigneeId}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.assigneeId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select an employee</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName} ({employee.email})
                    </option>
                  ))}
                </select>
              </div>
              {errors.assigneeId && (
                <p className="mt-1 text-sm text-red-600">{errors.assigneeId}</p>
              )}
            </div>
          </div>

          {/* Priority and Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <div className="relative">
                <ExclamationTriangleIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {TASK_PRIORITIES.map(priority => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {TASK_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Estimated Hours and Due Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Estimated Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Hours
              </label>
              <div className="relative">
                <ClockIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="number"
                  name="estimatedHours"
                  value={formData.estimatedHours}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.estimatedHours ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Hours"
                />
              </div>
              {errors.estimatedHours && (
                <p className="mt-1 text-sm text-red-600">{errors.estimatedHours}</p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CalendarIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.dueDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;