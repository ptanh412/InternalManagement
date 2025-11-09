import React, { useState } from 'react';
import { 
  XMarkIcon, 
  SparklesIcon, 
  DocumentTextIcon,
  ClipboardDocumentIcon,
  CloudArrowUpIcon,
  PlusIcon,
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/apiService';
import { useApiNotifications } from '../../hooks/useApiNotifications';

const AITaskRecommendationModal = ({ isOpen, onClose, projectId, projectName, onTasksGenerated }) => {
  const notify = useApiNotifications();
  const [analysisMode, setAnalysisMode] = useState('text'); // 'text' or 'file'
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [projectType, setProjectType] = useState('WEB_APPLICATION');
  const [methodology, setMethodology] = useState('AGILE');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);

  const PROJECT_TYPES = [
    'WEB_APPLICATION',
    'MOBILE_APPLICATION', 
    'DESKTOP_APPLICATION',
    'API_DEVELOPMENT',
    'DATA_ANALYSIS',
    'MACHINE_LEARNING',
    'TESTING_QA',
    'INFRASTRUCTURE',
    'OTHER'
  ];

  const METHODOLOGIES = [
    'AGILE',
    'WATERFALL', 
    'SCRUM',
    'KANBAN',
    'LEAN'
  ];

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAnalyze = async () => {
    console.log('Starting AI analysis with mode:', analysisMode);
    if (analysisMode === 'text' && !textContent.trim()) {
      notify.error('Please enter some content to analyze', 'Input Required');
      return;
    }
    
    if (analysisMode === 'file' && !selectedFile) {
      notify.error('Please select a file to analyze', 'File Required');
      return;
    }

    setIsAnalyzing(true);
    try {
      let response;
      
      if (analysisMode === 'text') {
        const analysisData = {
          projectId: projectId,
          projectName: projectName,
          requirementText: textContent,
          generateTasks: true,
          analyzeRequirements: true,
          detectConflicts: true,
          identifySkills: true,
          priority: 'MEDIUM'
        };
        response = await apiService.analyzeTextForTasks(analysisData);
        console.log('AI Text Analysis Response:', response);
      } else {
        const formData = new FormData();
        formData.append('files', selectedFile);
        formData.append('projectId', projectId);
        formData.append('projectName', projectName || 'AI Generated Project');
        formData.append('generateTasks', 'true');
        formData.append('analyzeRequirements', 'true');
        formData.append('detectConflicts', 'true');
        formData.append('identifySkills', 'true');
        formData.append('priority', 'MEDIUM');
        response = await apiService.analyzeFileForTasks(formData);
      }

      if (response && response.result && response.result.recommendedTasks) {
        // Transform AI service response to expected format
        const transformedResponse = {
          tasks: response.result.recommendedTasks.map(task => {
            // Extract skill names from skill objects or use as-is if they're strings
            const skills = (task.requiredSkills || []).map(skill => {
              if (typeof skill === 'object' && skill !== null) {
                return skill.skillName || skill.name || JSON.stringify(skill);
              }
              return skill;
            });

            return {
              title: task.title,
              description: task.description,
              priority: task.priority || 'MEDIUM',
              type: task.taskType || 'DEVELOPMENT',
              estimatedHours: task.estimatedHours,
              tags: skills,
              dependencies: [],
              assigneeRole: 'DEVELOPER',
              confidenceScore: task.confidenceScore,
              requiredSkills: skills
            };
          }),
          totalTasks: response.result.totalTasksGenerated || response.result.recommendedTasks.length,
          analysisType: analysisMode.toUpperCase(),
          projectSummary: `Analysis completed successfully. Found ${response.result.totalRequirementsFound || 0} requirements.`,
          estimatedTotalHours: response.result.recommendedTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
          aiModel: response.result.aiModelUsed || 'AI Requirements Engine'
        };
        
        setRecommendations(transformedResponse);
        setSelectedTasks(new Set()); // Reset selections
        notify.success(`Generated ${transformedResponse.totalTasks} task recommendations`);
      } else {
        throw new Error('Invalid response format from AI service');
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error code:', error.code);
      
      let errorMessage = 'Failed to generate task recommendations. Please try again.';
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'AI analysis is taking longer than expected. Using sample recommendations instead.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid request format. Please check your input and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please refresh the page and try again.';
      } else if (error.response?.status === 503) {
        errorMessage = 'AI service is temporarily unavailable. Using sample recommendations.';
      } else if (!error.response) {
        errorMessage = 'Cannot connect to AI service. Using sample recommendations instead.';
      }
      
      notify.error(errorMessage);
      
      // Fallback to mock recommendations
      const mockRecommendations = {
        tasks: [
          {
            title: 'Requirements Analysis & Documentation',
            description: 'Analyze project requirements and create detailed technical documentation based on provided specifications.',
            priority: 'HIGH',
            estimatedHours: 12,
            requiredSkills: ['Requirements Analysis', 'Technical Writing', 'Documentation']
          },
          {
            title: 'System Architecture Design',
            description: `Design system architecture for ${projectName}. Create component diagrams, API specifications, and database schema.`,
            priority: 'HIGH',
            estimatedHours: 16,
            requiredSkills: ['System Design', 'Architecture Patterns', 'API Design']
          },
          {
            title: 'Setup Development Environment',
            description: 'Initialize project repository, configure build tools, and setup development environment',
            priority: 'HIGH',
            estimatedHours: 8,
            requiredSkills: ['Git', 'CI/CD', 'Development Tools']
          },
          {
            title: 'Core Feature Development',
            description: 'Implement core functionality based on requirements analysis and system architecture design.',
            priority: 'MEDIUM',
            estimatedHours: 24,
            requiredSkills: ['Frontend Development', 'Backend Development', 'Database']
          },
          {
            title: 'Testing & Quality Assurance',
            description: `Comprehensive testing suite for ${projectName}. Unit tests, integration tests, and user acceptance testing.`,
            priority: 'MEDIUM',
            estimatedHours: 20,
            requiredSkills: ['Testing Frameworks', 'Test Automation', 'Quality Assurance']
          }
        ],
        totalTasks: 5,
        analysisType: analysisMode.toUpperCase(),
        projectSummary: `AI-generated task breakdown for ${projectName}. Based on ${analysisMode === 'text' ? 'text requirements' : 'uploaded documentation'}, identified key development phases and milestones.`,
        estimatedTotalHours: 80,
        aiModel: 'Gemini Pro (Fallback Mode)'
      };
      setRecommendations(mockRecommendations);
      setSelectedTasks(new Set());
      notify.load.warning('Using sample AI recommendations. Connect to AI service for real analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTaskSelect = (taskIndex) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskIndex)) {
      newSelected.delete(taskIndex);
    } else {
      newSelected.add(taskIndex);
    }
    setSelectedTasks(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === recommendations.tasks.length) {
      setSelectedTasks(new Set()); // Deselect all
    } else {
      setSelectedTasks(new Set(recommendations.tasks.map((_, index) => index))); // Select all
    }
  };

  const handleCreateTasks = async () => {
    if (selectedTasks.size === 0) {
      notify.error('Please select at least one task to create', 'Selection Required');
      return;
    }

    setIsCreatingTasks(true);
    try {
      const tasksToCreate = Array.from(selectedTasks).map(index => {
        const task = recommendations.tasks[index];
        // Ensure skills are strings
        const skills = (task.requiredSkills || task.tags || []).map(skill => {
          if (typeof skill === 'object' && skill !== null) {
            return skill.skillName || skill.name || String(skill);
          }
          return String(skill);
        });

        return {
          title: task.title,
          description: task.description,
          priority: task.priority || 'MEDIUM',
          status: 'TODO',
          projectId: projectId,
          estimatedHours: task.estimatedHours,
          skills: skills,
          // Additional fields that might be needed
          dueDate: null,
          assigneeId: null
        };
      });

      // Create tasks one by one
      const createdTasks = [];
      for (const taskData of tasksToCreate) {
        try {
          const response = await apiService.createTask(taskData);
          if (response) {
            createdTasks.push(response);
          }
        } catch (error) {
          console.warn('Failed to create task:', taskData.title, error);
        }
      }

      if (createdTasks.length > 0) {
        notify.success(`Successfully created ${createdTasks.length} tasks`);
        
        // Call onTasksGenerated callback to refresh parent data
        if (onTasksGenerated) {
          onTasksGenerated(createdTasks);
        }
        
        // Close modal after successful creation
        handleClose();
      } else {
        notify.error('Failed to create tasks. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create tasks:', error);
      notify.error('Failed to create tasks. Please try again.');
    } finally {
      setIsCreatingTasks(false);
    }
  };

  const handleClose = () => {
    setTextContent('');
    setSelectedFile(null);
    setRecommendations(null);
    setSelectedTasks(new Set());
    setIsAnalyzing(false);
    setIsCreatingTasks(false);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <SparklesIcon className="h-6 w-6 text-purple-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">AI Task Recommendations</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!recommendations ? (
            // Analysis Setup
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Generate AI Task Recommendations for {projectName}
                </h3>
                <p className="text-gray-600">
                  Provide project requirements to generate intelligent task recommendations using AI.
                </p>
              </div>

              {/* Analysis Mode Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">Analysis Mode</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="text"
                      checked={analysisMode === 'text'}
                      onChange={(e) => setAnalysisMode(e.target.value)}
                      className="mr-2"
                    />
                    <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-600" />
                    Text Description
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="file"
                      checked={analysisMode === 'file'}
                      onChange={(e) => setAnalysisMode(e.target.value)}
                      className="mr-2"
                    />
                    <CloudArrowUpIcon className="h-5 w-5 mr-2 text-gray-600" />
                    Upload File
                  </label>
                </div>
              </div>

              {/* Content Input */}
              {analysisMode === 'text' ? (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Project Requirements *
                  </label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={8}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Describe your project requirements, features, goals, and any specific tasks you need help with..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Provide detailed project requirements to get better AI recommendations
                  </p>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Requirements Document *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.docx,.doc,.txt,.md"
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Supports PDF, DOC, DOCX, TXT, MD files
                      </p>
                    </label>
                    {selectedFile && (
                      <p className="mt-2 text-sm text-green-600">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Project Configuration */}
              {/* <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Project Type
                  </label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {PROJECT_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Methodology
                  </label>
                  <select
                    value={methodology}
                    onChange={(e) => setMethodology(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {METHODOLOGIES.map(method => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
              </div> */}

              {/* Analyze Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || (analysisMode === 'text' && !textContent.trim()) || (analysisMode === 'file' && !selectedFile)}
                  className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing... (This may take up to 2 minutes)
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Generate Recommendations
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            // Recommendations Display
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-medium text-purple-900 mb-2">Analysis Summary</h3>
                <p className="text-sm text-purple-700 mb-3">{recommendations.projectSummary}</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Tasks:</span> {recommendations.totalTasks}
                  </div>
                  <div>
                    <span className="font-medium">Estimated Hours:</span> {recommendations.estimatedTotalHours}h
                  </div>
                  <div>
                    <span className="font-medium">AI Model:</span> {recommendations.aiModel}
                  </div>
                </div>
              </div>

              {/* Task Selection Controls */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Recommended Tasks ({selectedTasks.size} selected)
                </h3>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  {selectedTasks.size === recommendations.tasks.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recommendations.tasks.map((task, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedTasks.has(index) 
                        ? 'border-purple-300 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleTaskSelect(index)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedTasks.has(index)}
                          onChange={() => handleTaskSelect(index)}
                          className="mt-1 mr-3"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                          
                          <div className="flex flex-wrap gap-2 items-center text-xs">
                            <span className={`px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            
                            {task.estimatedHours && (
                              <span className="flex items-center text-gray-600">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {task.estimatedHours}h
                              </span>
                            )}
                            
                            {task.confidenceScore && (
                              <span className="flex items-center text-gray-600">
                                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                                {Math.round(task.confidenceScore * 100)}% confidence
                              </span>
                            )}
                          </div>

                          {(task.requiredSkills || task.tags) && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {(task.requiredSkills || task.tags || []).map((skill, skillIndex) => (
                                <span
                                  key={skillIndex}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => setRecommendations(null)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back to Analysis
                </button>
                
                <button
                  onClick={handleCreateTasks}
                  disabled={selectedTasks.size === 0 || isCreatingTasks}
                  className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingTasks ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Tasks...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Selected Tasks ({selectedTasks.size})
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AITaskRecommendationModal;