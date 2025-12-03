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
  ExclamationTriangleIcon,
  CodeBracketIcon,
  PaintBrushIcon,
  BeakerIcon,
  BugAntIcon,
  DocumentCheckIcon,
  ServerIcon,
  WrenchScrewdriverIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/apiService';
import { useApiNotifications } from '../../hooks/useApiNotifications';
import { useAuth } from '../../hooks/useAuth';

const AITaskRecommendationModal = ({ isOpen, onClose, projectId, projectName, onTasksGenerated }) => {
  const notify = useApiNotifications();
  const { user } = useAuth();
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
        console.log('AI Text Analysis Response:', response);

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
        
        console.log("Transformed AI Recommendations:", transformedResponse);
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

    if (!user || !user.id) {
      notify.error('User information not available. Please log in again.', 'Authentication Required');
      return;
    }

    setIsCreatingTasks(true);
    try {
      const tasksToCreate = Array.from(selectedTasks).map(index => {
        const task = recommendations.tasks[index];
        
        // Process skills as strings for tags
        const skillStrings = (task.requiredSkills || task.tags || []).map(skill => {
          if (typeof skill === 'object' && skill !== null) {
            return skill.skillName || skill.name || String(skill);
          }
          return String(skill);
        });

        // Convert skills to proper TaskSkillRequest objects
        const requiredSkillsObjects = skillStrings.map(skillName => ({
          skillName: skillName,
          skillType: mapSkillNameToType(skillName),
          requiredLevel: 'INTERMEDIATE', // Default level
          mandatory: true // Default mandatory
        }));

        // Match the exact structure from CreateTaskModal
        return {
          title: task.title,
          description: task.description,
          projectId: projectId,
          assigneeId: null,
          reporterId: null,
          type: task.type || 'DEVELOPMENT',
          priority: task.priority || 'MEDIUM',
          status: 'TODO',
          estimatedHours: task.estimatedHours ? parseInt(task.estimatedHours) : null,
          dueDate: null,
          tags: skillStrings, // Keep tags as strings
          requiredSkills: requiredSkillsObjects, // Send as objects array
          createdBy: user.id
        };
      });

      // Create tasks one by one
      const createdTasks = [];
      for (const taskData of tasksToCreate) {
        try {
          console.log('📤 Creating AI-generated task:', taskData);
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

  // Helper function to map skill names to skill types
  const mapSkillNameToType = (skillName) => {
    const lower = skillName.toLowerCase();
    
    // Testing tools
    if (lower.includes('selenium') || lower.includes('cypress') || 
        lower.includes('jmeter') || lower.includes('loadrunner') ||
        lower.includes('jest') || lower.includes('junit')) {
      return 'TESTING_TOOL';
    }
    
    // Mobile development
    if (lower.includes('react native') || lower.includes('flutter') || 
        lower.includes('swift') || lower.includes('kotlin') ||
        lower.includes('android') || lower.includes('ios')) {
      return 'MOBILE_DEVELOPMENT';
    }
    
    // Programming languages
    if (lower.includes('javascript') || lower.includes('python') || 
        lower.includes('java') || lower.includes('node.js') ||
        lower.includes('typescript') || lower.includes('go') ||
        lower.includes('rust') || lower.includes('c++')) {
      return 'PROGRAMMING_LANGUAGE';
    }
    
    // Frameworks
    if (lower.includes('react') || lower.includes('angular') || 
        lower.includes('vue') || lower.includes('spring') ||
        lower.includes('django') || lower.includes('express')) {
      return 'FRAMEWORK';
    }
    
    // Databases
    if (lower.includes('sql') || lower.includes('postgres') || 
        lower.includes('mysql') || lower.includes('mongodb') ||
        lower.includes('redis') || lower.includes('database')) {
      return 'DATABASE';
    }
    
    // Cloud platforms
    if (lower.includes('aws') || lower.includes('azure') || 
        lower.includes('gcp') || lower.includes('cloud')) {
      return 'CLOUD_PLATFORM';
    }
    
    // DevOps tools
    if (lower.includes('docker') || lower.includes('kubernetes') || 
        lower.includes('jenkins') || lower.includes('gitlab') ||
        lower.includes('ci/cd')) {
      return 'DEVOPS_TOOL';
    }
    
    // Architecture & Design
    if (lower.includes('design') || lower.includes('architecture') ||
        lower.includes('microservices') || lower.includes('system')) {
      return 'ARCHITECTURE';
    }
    
    // Security
    if (lower.includes('security') || lower.includes('oauth') ||
        lower.includes('encryption')) {
      return 'SECURITY';
    }
    
    // API technologies
    if (lower.includes('rest') || lower.includes('graphql') ||
        lower.includes('api')) {
      return 'API_TECHNOLOGY';
    }
    
    // Version control
    if (lower.includes('git') || lower.includes('version control')) {
      return 'VERSION_CONTROL';
    }
    
    // Soft skills or default
    if (lower.includes('attention') || lower.includes('communication') ||
        lower.includes('teamwork') || lower.includes('leadership')) {
      return 'SOFT_SKILL';
    }
    
    // Default fallback
    return 'SOFT_SKILL';
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
      default:
        return { 
          icon: ClipboardDocumentIcon, 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          label: type || 'Task' 
        };
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
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-100">
                <div className="flex items-center mb-3">
                  <SparklesIcon className="h-5 w-5 text-purple-600 mr-2" />
                  <h3 className="font-semibold text-purple-900">Analysis Summary</h3>
                </div>
                <p className="text-sm text-purple-700 mb-4 leading-relaxed">{recommendations.projectSummary}</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="text-xs text-gray-500 mb-1">Total Tasks</div>
                    <div className="text-2xl font-bold text-purple-600">{recommendations.totalTasks}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <div className="text-xs text-gray-500 mb-1">Estimated Hours</div>
                    <div className="text-2xl font-bold text-blue-600">{recommendations.estimatedTotalHours}h</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-indigo-100">
                    <div className="text-xs text-gray-500 mb-1">AI Model</div>
                    <div className="text-sm font-semibold text-indigo-600 truncate" title={recommendations.aiModel}>
                      {recommendations.aiModel}
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Selection Controls */}
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center">
                  <ClipboardDocumentIcon className="h-5 w-5 text-gray-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recommended Tasks
                  </h3>
                  <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {selectedTasks.size} of {recommendations.tasks.length} selected
                  </span>
                </div>
                <button
                  onClick={handleSelectAll}
                  className="flex items-center px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  {selectedTasks.size === recommendations.tasks.length ? (
                    <>
                      <XMarkIcon className="h-4 w-4 mr-1.5" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-1.5" />
                      Select All
                    </>
                  )}
                </button>
              </div>

              {/* Tasks List */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {recommendations.tasks.map((task, index) => {
                  const typeConfig = getTypeConfig(task.type);
                  const TypeIcon = typeConfig.icon;
                  
                  return (
                    <div
                      key={index}
                      className={`border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 ${
                        selectedTasks.has(index) 
                          ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-blue-50 shadow-md' 
                          : 'border-gray-200 hover:border-purple-300 hover:shadow-sm bg-white'
                      }`}
                      onClick={() => handleTaskSelect(index)}
                    >
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedTasks.has(index)}
                          onChange={() => handleTaskSelect(index)}
                          className="mt-1 mr-4 h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                        
                        <div className="flex-1 min-w-0">
                          {/* Task Header with Title and Type */}
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-900 text-base leading-tight pr-4">
                              {task.title}
                            </h4>
                            <div className={`flex items-center px-3 py-1 rounded-full border ${typeConfig.color} flex-shrink-0`}>
                              <TypeIcon className="h-4 w-4 mr-1.5" />
                              <span className="text-xs font-medium whitespace-nowrap">{typeConfig.label}</span>
                            </div>
                          </div>
                          
                          {/* Description */}
                          <p className="text-sm text-gray-600 leading-relaxed mb-4">
                            {task.description}
                          </p>
                          
                          {/* Metadata Row */}
                          <div className="flex flex-wrap gap-2 items-center mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            
                            {task.estimatedHours && (
                              <span className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                <ClockIcon className="h-3.5 w-3.5 mr-1.5" />
                                {task.estimatedHours}h
                              </span>
                            )}
                            
                            {task.confidenceScore && (
                              <span className="flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                <SparklesIcon className="h-3.5 w-3.5 mr-1.5" />
                                {Math.round(task.confidenceScore * 100)}% confidence
                              </span>
                            )}
                          </div>

                          {/* Skills/Tags */}
                          {(task.requiredSkills || task.tags) && (task.requiredSkills || task.tags).length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {(task.requiredSkills || task.tags || []).map((skill, skillIndex) => (
                                <span
                                  key={skillIndex}
                                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-6 border-t-2 border-gray-100">
                <button
                  onClick={() => setRecommendations(null)}
                  className="flex items-center px-5 py-2.5 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Analysis
                </button>
                
                <button
                  onClick={handleCreateTasks}
                  disabled={selectedTasks.size === 0 || isCreatingTasks}
                  className="flex items-center px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400 shadow-md hover:shadow-lg transition-all font-medium"
                >
                  {isCreatingTasks ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Creating Tasks...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Create {selectedTasks.size > 0 ? selectedTasks.size : ''} Task{selectedTasks.size !== 1 ? 's' : ''}
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