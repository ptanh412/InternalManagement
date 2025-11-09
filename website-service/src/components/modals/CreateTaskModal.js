import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  TagIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';

const CreateTaskModal = ({ isOpen, onClose, onTaskCreated, projects, defaultProjectId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: defaultProjectId || '',
    assigneeId: '',
    type: 'DEVELOPMENT',
    priority: 'MEDIUM',
    status: 'TODO',
    estimatedHours: '',
    dueDate: '',
    tags: [],
    requiredSkills: []
  });
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');
  const { success, error, warning, info } = useNotification();
  
  // Task Types Enum
  const TASK_TYPES = [
    'DEVELOPMENT',
    'FRONTEND_DEVELOPMENT',
    'BACKEND_DEVELOPMENT',
    'DATABASE_DEVELOPMENT',
    'MOBILE_DEVELOPMENT',
    'TESTING',
    'UNIT_TESTING',
    'INTEGRATION_TESTING',
    'RESEARCH',
    'DOCUMENTATION',
    'DESIGN',
    'CODE_REVIEW',
    'BUG_FIX',
    'DEPLOYMENT',
    'MAINTENANCE',
    'PLANNING',
    'ARCHITECTURE',
    'SECURITY',
    'PERFORMANCE',
    'REFACTORING'
  ];

  // Skill Types Enum
  const SKILL_TYPES = [
    'PROGRAMMING_LANGUAGE',
    'FRAMEWORK',
    'DATABASE',
    'CLOUD_PLATFORM',
    'DEVELOPMENT_TOOL',
    'TESTING_TOOL',
    'ARCHITECTURE',
    'SECURITY',
    'MOBILE_DEVELOPMENT',
    'DATA_ANALYSIS',
    'PROJECT_MANAGEMENT',
    'SOFT_SKILL',
    'FRONTEND_TECHNOLOGY',
    'BACKEND_TECHNOLOGY',
    'DEVOPS_TOOL',
    'API_TECHNOLOGY',
    'PERFORMANCE_OPTIMIZATION',
    'VERSION_CONTROL',
    'BUILD_TOOL',
    'MONITORING_TOOL'
  ];

  // Proficiency Levels Enum
  const PROFICIENCY_LEVELS = [
    'BEGINNER',
    'INTERMEDIATE',
    'ADVANCED',
    'EXPERT',
    'MASTER'
  ];

  const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'TESTING', 'DONE'];

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
      loadSkills();
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

  const loadSkills = async () => {
    try {
      const response = await apiService.getAllSkills();
      const skills = response.result || [];
      
      // Remove duplicates based on skillName
      const uniqueSkills = skills.reduce((acc, current) => {
        const isDuplicate = acc.find(skill => skill.skillName === current.skillName);
        if (!isDuplicate) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      setAvailableSkills(uniqueSkills);
      console.log('Loaded unique skills:', uniqueSkills);
    } catch (error) {
      console.error('Failed to load skills:', error);
      setAvailableSkills([]);
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

  // Add Tag
  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Add Required Skill
  const handleAddSkill = () => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: [
        ...prev.requiredSkills,
        {
          skillType: 'PROGRAMMING_LANGUAGE',
          requiredLevel: 'INTERMEDIATE',
          skillName: '',
          mandatory: true
        }
      ]
    }));
  };

  const handleRemoveSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((_, i) => i !== index)
    }));
  };

  const handleSkillChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.map((skill, i) => 
        i === index ? { ...skill, [field]: value } : skill
      )
    }));
  };

  // Get filtered skills by type
  const getSkillsByType = (skillType) => {
    if (!availableSkills || availableSkills.length === 0) return [];
    
    return availableSkills.filter(skill => 
      skill.skillType === skillType
    );
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

    // Validate required skills
    formData.requiredSkills.forEach((skill, index) => {
      if (!skill.skillName || skill.skillName.trim() === '') {
        newErrors[`skill_${index}`] = 'Skill name is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    console.log('Submitting task creation form:', formData);
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        projectId: formData.projectId,
        assigneeId: formData.assigneeId || null,
        reporterId: user.id,
        type: formData.type,
        priority: formData.priority,
        status: formData.status,
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : null,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        tags: formData.tags,
        requiredSkills: formData.requiredSkills,
        createdBy: user.id
      };

      console.log('📤 Sending task data:', taskData);

      const response = await apiService.createTask(taskData);
      if (response) {
        // Call onTaskCreated callback to refresh parent data
        if (onTaskCreated) {
          onTaskCreated(response);
        }
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          projectId: defaultProjectId || '',
          assigneeId: '',
          type: 'DEVELOPMENT',
          priority: 'MEDIUM',
          status: 'TODO',
          estimatedHours: '',
          dueDate: '',
          tags: [],
          requiredSkills: []
        });
        setErrors({});
        
        // Close modal after successful creation
        onClose();
        success('Task created successfully');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      setErrors({
        submit: error.response?.data?.message || 'Failed to create task. Please try again.'
      });
      error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Create New Task</h3>
            <p className="text-sm text-gray-600 mt-1">Add a new task with detailed requirements</p>
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

          {/* Project, Task Type, and Assignee Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Task Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {TASK_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignee
              </label>
              <div className="relative">
                <UserIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  name="assigneeId"
                  value={formData.assigneeId}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Unassigned</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </option>
                  ))}
                </select>
              </div>
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

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="relative">
              <TagIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Type tag and press Enter..."
              />
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:text-blue-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Required Skills Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <SparklesIcon className="h-5 w-5 text-purple-600 mr-2" />
                <h4 className="text-lg font-semibold text-gray-900">Required Skills</h4>
              </div>
              <button
                type="button"
                onClick={handleAddSkill}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Skill
              </button>
            </div>

            {formData.requiredSkills.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No required skills added yet</p>
                <p className="text-sm text-gray-500 mt-1">Click "Add Skill" to define skill requirements</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.requiredSkills.map((skill, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {/* Skill Type */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Skill Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={skill.skillType}
                          onChange={(e) => handleSkillChange(index, 'skillType', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          {SKILL_TYPES.map(type => (
                            <option key={type} value={type}>
                              {type.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Skill Name - Dropdown or Input */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Skill Name <span className="text-red-500">*</span>
                        </label>
                        {getSkillsByType(skill.skillType).length > 0 ? (
                          <select
                            value={skill.skillName}
                            onChange={(e) => handleSkillChange(index, 'skillName', e.target.value)}
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                              errors[`skill_${index}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                          >
                            <option value="">-- Select Skill --</option>
                            {getSkillsByType(skill.skillType).map(availableSkill => (
                              <option key={availableSkill.id} value={availableSkill.skillName}>
                                {availableSkill.skillName}
                              </option>
                            ))}
                            <option value="__custom__">✏️ Enter Custom Skill...</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={skill.skillName}
                            onChange={(e) => handleSkillChange(index, 'skillName', e.target.value)}
                            placeholder="Enter skill name..."
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                              errors[`skill_${index}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                          />
                        )}
                        {skill.skillName === '__custom__' && (
                          <input
                            type="text"
                            onChange={(e) => handleSkillChange(index, 'skillName', e.target.value)}
                            placeholder="Enter custom skill name..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mt-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        )}
                        {errors[`skill_${index}`] && (
                          <p className="mt-1 text-xs text-red-600">{errors[`skill_${index}`]}</p>
                        )}
                      </div>

                      {/* Required Level */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Level <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={skill.requiredLevel}
                          onChange={(e) => handleSkillChange(index, 'requiredLevel', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          {PROFICIENCY_LEVELS.map(level => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Mandatory & Remove */}
                      <div className="flex items-end space-x-2">
                        <div className="flex-1">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={skill.mandatory}
                              onChange={(e) => handleSkillChange(index, 'mandatory', e.target.checked)}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="ml-2 text-xs text-gray-700">Mandatory</span>
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove skill"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Skill Summary Badge */}
                    <div className="mt-2 flex items-center text-xs text-gray-600">
                      {skill.mandatory ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600 mr-1" />
                      ) : (
                        <span className="text-gray-400 mr-1">○</span>
                      )}
                      <span>
                        {skill.mandatory ? 'Mandatory' : 'Optional'} • 
                        {skill.requiredLevel ? ` ${skill.requiredLevel} level` : ' Level required'} • 
                        {skill.skillName || 'Skill name not set'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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