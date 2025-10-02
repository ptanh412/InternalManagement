import httpClient from './httpClient';

const AI_SERVICE_BASE_URL = 'http://localhost:8089';

class AIService {
  // Import requirements from file and generate AI task recommendations
  async importRequirementsFromFile(formData) {
    try {
      const response = await httpClient.post(
        `${AI_SERVICE_BASE_URL}/ai/requirements/import`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error importing requirements from file:', error);
      throw error;
    }
  }

  // Import requirements from direct text input
  async importRequirementsFromText(requestData) {
    try {
      const response = await httpClient.post(
        `${AI_SERVICE_BASE_URL}/ai/requirements/import/text`,
        requestData
      );
      return response.data;
    } catch (error) {
      console.error('Error importing requirements from text:', error);
      throw error;
    }
  }

  // Create FormData for file upload
  createRequirementUploadFormData({
    files,
    projectId,
    projectName,
    description,
    generateTasks = true,
    analyzeRequirements = true,
    detectConflicts = true,
    identifySkills = true,
    additionalContext,
    priority = 'MEDIUM'
  }) {
    const formData = new FormData();
    
    // Add files
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
    }
    
    // Add other parameters
    formData.append('projectId', projectId);
    if (projectName) formData.append('projectName', projectName);
    if (description) formData.append('description', description);
    formData.append('generateTasks', generateTasks);
    formData.append('analyzeRequirements', analyzeRequirements);
    formData.append('detectConflicts', detectConflicts);
    formData.append('identifySkills', identifySkills);
    if (additionalContext) formData.append('additionalContext', additionalContext);
    formData.append('priority', priority);
    
    return formData;
  }

  // Helper method to create text-based requirement request
  createTextRequirementRequest({
    projectId,
    requirementText,
    projectName,
    description,
    generateTasks = true,
    analyzeRequirements = true,
    detectConflicts = true,
    identifySkills = true,
    additionalContext,
    priority = 'MEDIUM'
  }) {
    return {
      projectId,
      requirementText,
      projectName,
      description,
      generateTasks,
      analyzeRequirements,
      detectConflicts,
      identifySkills,
      additionalContext,
      priority
    };
  }

  // Process AI analysis response and convert to task format for task-service
  transformGeneratedTasksToTaskService(generatedTasks, projectId, createdBy) {
    return generatedTasks.map(task => ({
      title: task.title,
      description: task.description,
      projectId: projectId,
      createdBy: createdBy,
      type: this.mapTaskTypeToTaskService(task.taskType),
      priority: this.mapPriorityToTaskService(task.priority),
      status: 'TODO',
      estimatedHours: Math.round(task.estimatedHours || 8),
      requiredSkills: task.requiredSkills?.map(skill => skill.skillName) || [],
      tags: ['AI_GENERATED'],
      comments: `Auto-generated task (Confidence: ${(task.confidenceScore * 100).toFixed(1)}%)`
    }));
  }

  // Map AI service task types to task-service task types
  mapTaskTypeToTaskService(aiTaskType) {
    const typeMapping = {
      'DEVELOPMENT': 'DEVELOPMENT',
      'FRONTEND_DEVELOPMENT': 'FRONTEND_DEVELOPMENT',
      'BACKEND_DEVELOPMENT': 'BACKEND_DEVELOPMENT',
      'DATABASE_DEVELOPMENT': 'DATABASE_DEVELOPMENT',
      'MOBILE_DEVELOPMENT': 'MOBILE_DEVELOPMENT',
      'TESTING': 'TESTING',
      'UNIT_TESTING': 'UNIT_TESTING',
      'INTEGRATION_TESTING': 'INTEGRATION_TESTING',
      'RESEARCH': 'RESEARCH',
      'DOCUMENTATION': 'DOCUMENTATION',
      'DESIGN': 'DESIGN',
      'CODE_REVIEW': 'CODE_REVIEW',
      'BUG_FIX': 'BUG_FIX',
      'DEPLOYMENT': 'DEPLOYMENT',
      'MAINTENANCE': 'MAINTENANCE',
      'PLANNING': 'PLANNING',
      'ARCHITECTURE': 'ARCHITECTURE'
    };
    return typeMapping[aiTaskType] || 'DEVELOPMENT';
  }

  // Map AI service priorities to task-service priorities
  mapPriorityToTaskService(aiPriority) {
    const priorityMapping = {
      'LOW': 'LOW',
      'MEDIUM': 'MEDIUM',
      'HIGH': 'HIGH',
      'CRITICAL': 'URGENT',
      'URGENT': 'URGENT'
    };
    return priorityMapping[aiPriority] || 'MEDIUM';
  }

  // Validate file types for requirement upload
  isValidFileType(fileName) {
    const validExtensions = [
      '.txt', '.doc', '.docx', '.pdf', '.md', '.rtf',
      '.odt', '.pages', '.tex', '.wpd', '.csv', '.json', '.xml'
    ];
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return validExtensions.includes(fileExtension);
  }

  // Get supported file types for display
  getSupportedFileTypes() {
    return [
      'Text files (.txt, .md)',
      'Word documents (.doc, .docx)',
      'PDF files (.pdf)',
      'Rich Text Format (.rtf)',
      'OpenDocument Text (.odt)',
      'Data files (.csv, .json, .xml)',
      'Other formats (.pages, .tex, .wpd)'
    ];
  }

  // Validate files before upload
  validateFiles(files) {
    const errors = [];
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 10;

    if (!files || files.length === 0) {
      errors.push('Please select at least one file');
      return errors;
    }

    if (files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
    }

    Array.from(files).forEach((file, index) => {
      if (file.size > maxFileSize) {
        errors.push(`File "${file.name}" is too large (max 10MB)`);
      }
      
      if (!this.isValidFileType(file.name)) {
        errors.push(`File "${file.name}" has unsupported format`);
      }
    });

    return errors;
  }

  // Extract analysis summary for display
  getAnalysisSummary(analysisResponse) {
    const { result } = analysisResponse;
    if (!result) return null;

    return {
      projectId: result.projectId,
      analysisId: result.analysisId,
      processedAt: result.processedAt,
      status: result.processingStatus,
      stats: {
        filesProcessed: result.processedFiles?.length || 0,
        requirementsFound: result.totalRequirementsFound || 0,
        tasksGenerated: result.totalTasksGenerated || 0,
        skillsIdentified: Object.keys(result.identifiedSkills || {}).length,
        conflictsDetected: result.detectedConflicts?.length || 0,
        confidenceScore: result.overallConfidenceScore || 0,
        processingTimeMs: result.processingTimeMs || 0
      },
      warnings: result.warnings || [],
      errors: result.errors || [],
      generatedTasks: result.recommendedTasks || [],
      identifiedSkills: result.identifiedSkills || {},
      detectedConflicts: result.detectedConflicts || []
    };
  }

  // Get task generation statistics
  getTaskStats(generatedTasks) {
    if (!generatedTasks || generatedTasks.length === 0) {
      return {
        total: 0,
        byType: {},
        byPriority: {},
        avgConfidence: 0,
        totalEstimatedHours: 0
      };
    }

    const stats = {
      total: generatedTasks.length,
      byType: {},
      byPriority: {},
      avgConfidence: 0,
      totalEstimatedHours: 0
    };

    generatedTasks.forEach(task => {
      // Count by type
      const type = task.taskType || 'UNKNOWN';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Count by priority
      const priority = task.priority || 'MEDIUM';
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;

      // Sum confidence scores
      stats.avgConfidence += (task.confidenceScore || 0);

      // Sum estimated hours
      stats.totalEstimatedHours += (task.estimatedHours || 0);
    });

    // Calculate average confidence
    stats.avgConfidence = stats.avgConfidence / generatedTasks.length;

    return stats;
  }

  // Format confidence score for display
  formatConfidence(confidence) {
    if (typeof confidence !== 'number') return 'N/A';
    return `${(confidence * 100).toFixed(1)}%`;
  }

  // Get confidence level description
  getConfidenceLevel(confidence) {
    if (typeof confidence !== 'number') return 'Unknown';
    
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.75) return 'High';
    if (confidence >= 0.6) return 'Medium';
    if (confidence >= 0.4) return 'Low';
    return 'Very Low';
  }

  // Get priority color for UI
  getPriorityColor(priority) {
    const colorMap = {
      'LOW': 'success',
      'MEDIUM': 'info',
      'HIGH': 'warning',
      'CRITICAL': 'error',
      'URGENT': 'error'
    };
    return colorMap[priority] || 'default';
  }

  // Get task type color for UI
  getTaskTypeColor(taskType) {
    const colorMap = {
      'FRONTEND_DEVELOPMENT': 'primary',
      'BACKEND_DEVELOPMENT': 'secondary',
      'DATABASE_DEVELOPMENT': 'info',
      'MOBILE_DEVELOPMENT': 'success',
      'TESTING': 'warning',
      'DOCUMENTATION': 'default',
      'DESIGN': 'error',
      'RESEARCH': 'info',
      'DEPLOYMENT': 'secondary',
      'MAINTENANCE': 'warning'
    };
    return colorMap[taskType] || 'default';
  }
}

const aiService = new AIService();
export default aiService;