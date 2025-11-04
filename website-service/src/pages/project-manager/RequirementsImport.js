import React, { useState, useEffect } from 'react';
import { 
  CloudArrowUpIcon,
  DocumentTextIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CogIcon,
  FolderOpenIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

const RequirementsImport = ({ teamLeadMode = false }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analysisSettings, setAnalysisSettings] = useState({
    generateTasks: true,
    analyzeRequirements: true,
    detectConflicts: true,
    identifySkills: true,
    priority: 'MEDIUM'
  });
  const [additionalContext, setAdditionalContext] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [supportedFormats] = useState(['PDF', 'DOCX', 'TXT', 'MD', 'JSON', 'XML']);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      // Simulate API call to get projects
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockProjects = [
        { id: 'proj-1', name: 'Mobile Banking App' },
        { id: 'proj-2', name: 'E-commerce Platform' },
        { id: 'proj-3', name: 'IoT Monitoring System' },
        { id: 'proj-4', name: 'Healthcare Management System' }
      ];

      setProjects(mockProjects);
      if (mockProjects.length > 0) {
        setSelectedProject(mockProjects[0].id);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const extension = file.name.split('.').pop().toUpperCase();
      return supportedFormats.includes(extension) && file.size <= 10 * 1024 * 1024; // 10MB limit
    });

    setSelectedFiles(prevFiles => [...prevFiles, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleImportRequirements = async () => {
    if (!selectedProject || selectedFiles.length === 0) {
      alert('Please select a project and at least one file');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate file upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadProgress(i);
      }

      // Simulate API call to /ai/requirements/import
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockAnalysisResults = {
        projectId: selectedProject,
        projectName: projectName || projects.find(p => p.id === selectedProject)?.name,
        totalRequirements: 47,
        analyzedRequirements: [
          {
            id: 'req-1',
            title: 'User Authentication System',
            description: 'Implement secure user authentication with multi-factor authentication support',
            priority: 'HIGH',
            category: 'Security',
            complexity: 'MEDIUM',
            estimatedHours: 24,
            skills: ['Authentication', 'Security', 'JWT', 'OAuth'],
            conflicts: [],
            dependencies: ['req-3']
          },
          {
            id: 'req-2',
            title: 'Payment Processing Integration',
            description: 'Integrate with multiple payment gateways for secure transaction processing',
            priority: 'CRITICAL',
            category: 'Payment',
            complexity: 'HIGH',
            estimatedHours: 40,
            skills: ['Payment Gateways', 'API Integration', 'Security', 'PCI Compliance'],
            conflicts: ['req-5'],
            dependencies: ['req-1']
          },
          {
            id: 'req-3',
            title: 'User Profile Management',
            description: 'Allow users to create and manage their profiles with personal information',
            priority: 'MEDIUM',
            category: 'User Management',
            complexity: 'LOW',
            estimatedHours: 16,
            skills: ['Frontend Development', 'Database Design', 'Validation'],
            conflicts: [],
            dependencies: []
          },
          {
            id: 'req-4',
            title: 'Real-time Notifications',
            description: 'Implement push notifications for transaction updates and alerts',
            priority: 'MEDIUM',
            category: 'Communication',
            complexity: 'MEDIUM',
            estimatedHours: 20,
            skills: ['WebSockets', 'Push Notifications', 'Real-time Systems'],
            conflicts: [],
            dependencies: ['req-1']
          }
        ],
        generatedTasks: [
          {
            id: 'task-gen-1',
            title: 'Set up authentication infrastructure',
            description: 'Create base authentication system with JWT token management',
            requirementId: 'req-1',
            priority: 'HIGH',
            estimatedHours: 12,
            skills: ['Node.js', 'JWT', 'Security'],
            assignmentSuggestions: ['John Smith', 'Sarah Johnson']
          },
          {
            id: 'task-gen-2',
            title: 'Implement multi-factor authentication',
            description: 'Add MFA support using TOTP and SMS verification',
            requirementId: 'req-1',
            priority: 'HIGH',
            estimatedHours: 12,
            skills: ['Authentication', 'TOTP', 'SMS Gateway'],
            assignmentSuggestions: ['John Smith']
          },
          {
            id: 'task-gen-3',
            title: 'Design user profile database schema',
            description: 'Create database tables and relationships for user profiles',
            requirementId: 'req-3',
            priority: 'MEDIUM',
            estimatedHours: 6,
            skills: ['Database Design', 'PostgreSQL', 'Data Modeling'],
            assignmentSuggestions: ['Mike Chen', 'Alex Wilson']
          }
        ],
        detectedConflicts: [
          {
            id: 'conflict-1',
            type: 'REQUIREMENT_CONFLICT',
            severity: 'MEDIUM',
            description: 'Payment processing requirement conflicts with user privacy requirement',
            affectedRequirements: ['req-2', 'req-5'],
            suggestion: 'Consider implementing optional payment features with user consent'
          }
        ],
        identifiedSkills: [
          { skill: 'Authentication', frequency: 5, priority: 'HIGH' },
          { skill: 'Security', frequency: 4, priority: 'HIGH' },
          { skill: 'Payment Gateways', frequency: 3, priority: 'CRITICAL' },
          { skill: 'Frontend Development', frequency: 8, priority: 'MEDIUM' },
          { skill: 'Database Design', frequency: 6, priority: 'MEDIUM' },
          { skill: 'API Integration', frequency: 7, priority: 'HIGH' }
        ],
        processingTime: '3.2 seconds',
        confidence: 'HIGH'
      };

      setAnalysisResults(mockAnalysisResults);
      setIsUploading(false);
      setUploadProgress(0);
    } catch (error) {
      console.error('Failed to import requirements:', error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: 'text-green-600 bg-green-100',
      MEDIUM: 'text-yellow-600 bg-yellow-100',
      HIGH: 'text-orange-600 bg-orange-100',
      CRITICAL: 'text-red-600 bg-red-100'
    };
    return colors[priority] || 'text-gray-600 bg-gray-100';
  };

  const getComplexityColor = (complexity) => {
    const colors = {
      LOW: 'text-green-600',
      MEDIUM: 'text-yellow-600',
      HIGH: 'text-red-600'
    };
    return colors[complexity] || 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <SparklesIcon className="h-8 w-8 text-primary-600 mr-3" />
            AI Requirements Import & Analysis
          </h1>
          <p className="text-gray-600 mt-2">
            Upload requirement documents and let AI generate tasks and analysis automatically
            {teamLeadMode && ' (Team Lead Mode)'}
          </p>
        </div>

        {!analysisResults ? (
          <>
            {/* Project Selection */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Project Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Target Project
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a project...</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name (optional)
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Override project name..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description (optional)
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Additional project context..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Requirements Documents</h2>
              
              {/* Supported Formats */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Supported formats:</p>
                <div className="flex flex-wrap gap-2">
                  {supportedFormats.map(format => (
                    <span key={format} className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded">
                      {format}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Maximum file size: 10MB per file</p>
              </div>

              {/* File Drop Zone */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.md,.json,.xml"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop files here or click to browse
                  </p>
                  <p className="text-sm text-gray-600">
                    Upload requirement documents, specifications, or project files
                  </p>
                </label>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Selected Files</h3>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-600">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-500"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Settings */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <CogIcon className="h-5 w-5 mr-2" />
                AI Analysis Settings
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="generateTasks"
                      checked={analysisSettings.generateTasks}
                      onChange={(e) => setAnalysisSettings(prev => ({ ...prev, generateTasks: e.target.checked }))}
                      className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <label htmlFor="generateTasks" className="ml-2 text-sm font-medium text-gray-700">
                      Generate AI Tasks
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="analyzeRequirements"
                      checked={analysisSettings.analyzeRequirements}
                      onChange={(e) => setAnalysisSettings(prev => ({ ...prev, analyzeRequirements: e.target.checked }))}
                      className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <label htmlFor="analyzeRequirements" className="ml-2 text-sm font-medium text-gray-700">
                      Analyze Requirements
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="detectConflicts"
                      checked={analysisSettings.detectConflicts}
                      onChange={(e) => setAnalysisSettings(prev => ({ ...prev, detectConflicts: e.target.checked }))}
                      className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <label htmlFor="detectConflicts" className="ml-2 text-sm font-medium text-gray-700">
                      Detect Conflicts
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="identifySkills"
                      checked={analysisSettings.identifySkills}
                      onChange={(e) => setAnalysisSettings(prev => ({ ...prev, identifySkills: e.target.checked }))}
                      className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <label htmlFor="identifySkills" className="ml-2 text-sm font-medium text-gray-700">
                      Identify Required Skills
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Priority
                  </label>
                  <select
                    value={analysisSettings.priority}
                    onChange={(e) => setAnalysisSettings(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Context (optional)
                </label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Provide additional context to help AI understand the requirements better..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex items-center mb-4">
                  <SparklesIcon className="h-5 w-5 text-primary-600 mr-2 animate-pulse" />
                  <h3 className="text-lg font-medium text-gray-900">Processing Requirements...</h3>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {uploadProgress < 100 ? 'Uploading files...' : 'Analyzing requirements with AI...'}
                </p>
              </div>
            )}

            {/* Start Import Button */}
            <div className="text-center">
              <button
                onClick={handleImportRequirements}
                disabled={!selectedProject || selectedFiles.length === 0 || isUploading}
                className="btn-primary inline-flex items-center px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-5 w-5 mr-2" />
                    Start AI Analysis
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Analysis Results */
          <div className="space-y-8">
            {/* Analysis Summary */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Analysis Complete!</h2>
                  <p className="text-green-100">
                    Successfully processed {selectedFiles.length} file(s) and analyzed {analysisResults.totalRequirements} requirements
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{analysisResults.confidence}</div>
                  <div className="text-green-100">Confidence</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{analysisResults.analyzedRequirements.length}</div>
                  <div className="text-green-100">Requirements</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{analysisResults.generatedTasks.length}</div>
                  <div className="text-green-100">Generated Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{analysisResults.detectedConflicts.length}</div>
                  <div className="text-green-100">Conflicts Found</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{analysisResults.identifiedSkills.length}</div>
                  <div className="text-green-100">Skills Identified</div>
                </div>
              </div>
            </div>

            {/* Requirements Analysis */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Analyzed Requirements</h3>
              <div className="space-y-4">
                {analysisResults.analyzedRequirements.map((req) => (
                  <div key={req.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-lg font-medium text-gray-900">{req.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(req.priority)}`}>
                          {req.priority}
                        </span>
                        <span className={`text-xs font-medium ${getComplexityColor(req.complexity)}`}>
                          {req.complexity} Complexity
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{req.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Category:</span>
                        <span className="ml-1 font-medium">{req.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Est. Hours:</span>
                        <span className="ml-1 font-medium">{req.estimatedHours}h</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Dependencies:</span>
                        <span className="ml-1 font-medium">{req.dependencies.length}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-1">Required Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {req.skills.map((skill, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated Tasks */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">AI Generated Tasks</h3>
              <div className="space-y-4">
                {analysisResults.generatedTasks.map((task) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-lg font-medium text-gray-900">{task.title}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Estimated Hours:</span>
                        <span className="ml-1 font-medium">{task.estimatedHours}h</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Assignment Suggestions:</span>
                        <span className="ml-1 font-medium">{task.assignmentSuggestions.join(', ')}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Required Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {task.skills.map((skill, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conflicts and Skills */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Detected Conflicts */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  Detected Conflicts
                </h3>
                {analysisResults.detectedConflicts.length > 0 ? (
                  <div className="space-y-4">
                    {analysisResults.detectedConflicts.map((conflict) => (
                      <div key={conflict.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-200 text-yellow-800">
                            {conflict.severity}
                          </span>
                          <span className="ml-2 text-sm font-medium text-gray-900">{conflict.type}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{conflict.description}</p>
                        <p className="text-xs text-gray-600">
                          <strong>Suggestion:</strong> {conflict.suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No conflicts detected</p>
                )}
              </div>

              {/* Identified Skills */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Identified Skills</h3>
                <div className="space-y-3">
                  {analysisResults.identifiedSkills.map((skillData, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{skillData.skill}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600">{skillData.frequency}x</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(skillData.priority)}`}>
                          {skillData.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setAnalysisResults(null)}
                className="btn-secondary"
              >
                Import More Requirements
              </button>
              <button className="btn-primary">
                Create Project Tasks
              </button>
              <button
                onClick={() => window.location.href = teamLeadMode ? '/team-lead/projects' : '/project-manager/projects'}
                className="btn-outline"
              >
                Back to Projects
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequirementsImport;