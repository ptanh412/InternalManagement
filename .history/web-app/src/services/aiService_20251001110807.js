import httpClient from './httpClient';

const AI_SERVICE_BASE_URL = 'http://localhost:8888/api/v1/ai';

class AIService {
  // Import requirements from file and generate AI task recommendations
  async importRequirementsFromFile(formData) {
    try {
      const response = await httpClient.post(
        `${AI_SERVICE_BASE_URL}/requirements/import`,
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
        `${AI_SERVICE_BASE_URL}/requirements/import/text`,
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

  // ============ MEMBER RECOMMENDATION METHODS ============

  // Generate AI-powered task assignment recommendations
  async generateTaskRecommendations(taskId) {
    try {
      const response = await httpClient.post(
        `${AI_SERVICE_BASE_URL}/recommendations/task/${taskId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error generating task recommendations:', error);
      throw error;
    }
  }

  // Generate emergency task recommendations with relaxed criteria
  async generateEmergencyRecommendations(taskId) {
    try {
      const response = await httpClient.post(
        `${AI_SERVICE_BASE_URL}/recommendations/task/${taskId}/emergency`
      );
      return response.data;
    } catch (error) {
      console.error('Error generating emergency recommendations:', error);
      throw error;
    }
  }

  // Generate team-based recommendations for collaborative tasks
  async generateTeamRecommendations(taskId, teamId) {
    try {
      const response = await httpClient.post(
        `${AI_SERVICE_BASE_URL}/recommendations/task/${taskId}/team/${teamId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error generating team recommendations:', error);
      throw error;
    }
  }

  // Health check for recommendation service
  async checkRecommendationServiceHealth() {
    try {
      const response = await httpClient.get(
        `${AI_SERVICE_BASE_URL}/recommendations/health`
      );
      return response.data;
    } catch (error) {
      console.error('Error checking recommendation service health:', error);
      throw error;
    }
  }

  // Process and rank recommendations for UI display
  processRecommendations(recommendations) {
    if (!recommendations || recommendations.length === 0) {
      return [];
    }

    // Sort by overall score (highest first)
    const sortedRecommendations = [...recommendations].sort((a, b) => 
      (b.overallScore || 0) - (a.overallScore || 0)
    );

    // Add rank if not present
    sortedRecommendations.forEach((rec, index) => {
      if (rec.rank === undefined || rec.rank === null) {
        rec.rank = index + 1;
      }
    });

    return sortedRecommendations;
  }

  // Get recommendation confidence level
  getRecommendationConfidenceLevel(overallScore) {
    if (typeof overallScore !== 'number') return 'Unknown';
    
    if (overallScore >= 0.9) return 'Excellent';
    if (overallScore >= 0.8) return 'Very Good';
    if (overallScore >= 0.7) return 'Good';
    if (overallScore >= 0.6) return 'Fair';
    if (overallScore >= 0.5) return 'Poor';
    return 'Very Poor';
  }

  // Get confidence color for UI
  getConfidenceColor(overallScore) {
    if (typeof overallScore !== 'number') return 'default';
    
    if (overallScore >= 0.8) return 'success';
    if (overallScore >= 0.7) return 'info';
    if (overallScore >= 0.6) return 'warning';
    return 'error';
  }

  // Format recommendation score for display
  formatRecommendationScore(score) {
    if (typeof score !== 'number') return 'N/A';
    return `${(score * 100).toFixed(1)}%`;
  }

  // Get detailed recommendation metrics
  getRecommendationMetrics(recommendation) {
    return {
      overall: recommendation.overallScore || 0,
      skillMatch: recommendation.skillMatchScore || 0,
      workload: recommendation.workloadScore || 0,
      performance: recommendation.performanceScore || 0,
      availability: recommendation.availabilityScore || 0,
      collaboration: recommendation.collaborationScore || 0,
      contentBased: recommendation.contentBasedScore || 0,
      collaborative: recommendation.collaborativeFilteringScore || 0,
      hybrid: recommendation.hybridScore || 0,
      topsis: recommendation.topsScore || 0,
      ahp: recommendation.ahpScore || 0,
      randomForest: recommendation.rfPredictionScore || 0,
      rfConfidence: recommendation.rfConfidence || 0
    };
  }

  // Get recommendation strength indicators
  getRecommendationStrength(recommendation) {
    const metrics = this.getRecommendationMetrics(recommendation);
    
    return {
      skillMatch: this.getStrengthLevel(metrics.skillMatch),
      workload: this.getStrengthLevel(metrics.workload),
      performance: this.getStrengthLevel(metrics.performance),
      availability: this.getStrengthLevel(metrics.availability),
      collaboration: this.getStrengthLevel(metrics.collaboration)
    };
  }

  // Get strength level description
  getStrengthLevel(score) {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.75) return 'Very Good';
    if (score >= 0.6) return 'Good';
    if (score >= 0.45) return 'Fair';
    if (score >= 0.3) return 'Poor';
    return 'Very Poor';
  }

  // Create recommendation summary for display
  createRecommendationSummary(recommendations) {
    if (!recommendations || recommendations.length === 0) {
      return {
        totalRecommendations: 0,
        excellentMatches: 0,
        goodMatches: 0,
        fairMatches: 0,
        averageConfidence: 0
      };
    }

    const totalRecommendations = recommendations.length;
    let excellentMatches = 0;
    let goodMatches = 0;
    let fairMatches = 0;
    let totalConfidence = 0;

    recommendations.forEach(rec => {
      const score = rec.overallScore || 0;
      totalConfidence += score;
      
      if (score >= 0.8) excellentMatches++;
      else if (score >= 0.6) goodMatches++;
      else if (score >= 0.4) fairMatches++;
    });

    return {
      totalRecommendations,
      excellentMatches,
      goodMatches,
      fairMatches,
      averageConfidence: totalConfidence / totalRecommendations
    };
  }

  // Get recommendation explanation
  getRecommendationExplanation(recommendation) {
    const metrics = this.getRecommendationMetrics(recommendation);
    const reasons = [];

    if (metrics.skillMatch >= 0.8) {
      reasons.push('Excellent skill match for this task');
    } else if (metrics.skillMatch >= 0.6) {
      reasons.push('Good skill alignment');
    }

    if (metrics.workload <= 0.3) {
      reasons.push('Currently has low workload');
    } else if (metrics.workload <= 0.6) {
      reasons.push('Manageable current workload');
    }

    if (metrics.performance >= 0.8) {
      reasons.push('Strong historical performance');
    } else if (metrics.performance >= 0.6) {
      reasons.push('Solid track record');
    }

    if (metrics.availability >= 0.8) {
      reasons.push('High availability');
    } else if (metrics.availability >= 0.6) {
      reasons.push('Good availability');
    }

    if (metrics.collaboration >= 0.7) {
      reasons.push('Works well with team');
    }

    if (reasons.length === 0) {
      reasons.push('Basic match criteria met');
    }

    return reasons.join('. ') + '.';
  }

  // ============ CV PARSING METHODS ============

  // Parse CV file and extract user profile data for admin user creation
  async parseCVForUserCreation(cvFile, options = {}) {
    try {
      const formData = new FormData();
      formData.append('cvFile', cvFile);
      
      // Add parsing options
      if (options.additionalNotes) {
        formData.append('additionalNotes', options.additionalNotes);
      }
      if (options.preferredUsername) {
        formData.append('preferredUsername', options.preferredUsername);
      }
      if (options.departmentHint) {
        formData.append('departmentHint', options.departmentHint);
      }
      if (options.positionHint) {
        formData.append('positionHint', options.positionHint);
      }
      
      // Parsing preferences
      formData.append('createIdentityProfile', 'false'); // We'll handle creation in frontend
      formData.append('createUserProfile', 'false'); // We'll handle creation in frontend
      formData.append('extractSkills', 'true');
      formData.append('detectExperience', 'true');

      const response = await httpClient.post(
        `${AI_SERVICE_BASE_URL}/cv/parse-only`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error parsing CV for user creation:', error);
      throw error;
    }
  }

  // Parse CV and automatically create user profiles (full automation)
  async parseCVAndCreateProfiles(cvFile, options = {}) {
    try {
      const formData = new FormData();
      formData.append('cvFile', cvFile);
      
      // Add all available options
      if (options.additionalNotes) {
        formData.append('additionalNotes', options.additionalNotes);
      }
      if (options.preferredUsername) {
        formData.append('preferredUsername', options.preferredUsername);
      }
      if (options.departmentHint) {
        formData.append('departmentHint', options.departmentHint);
      }
      if (options.positionHint) {
        formData.append('positionHint', options.positionHint);
      }
      
      // Service integration settings
      formData.append('createIdentityProfile', options.createIdentityProfile || 'true');
      formData.append('createUserProfile', options.createUserProfile || 'true');
      formData.append('extractSkills', options.extractSkills || 'true');
      formData.append('detectExperience', options.detectExperience || 'true');

      const response = await httpClient.post(
        `${AI_SERVICE_BASE_URL}/cv/parse`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error parsing CV and creating profiles:', error);
      throw error;
    }
  }

  // Get supported CV file formats
  async getSupportedCVFormats() {
    try {
      const response = await httpClient.get(`${AI_SERVICE_BASE_URL}/cv/supported-formats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching supported CV formats:', error);
      throw error;
    }
  }

  // Get CV parsing capabilities
  async getCVParsingCapabilities() {
    try {
      const response = await httpClient.get(`${AI_SERVICE_BASE_URL}/cv/capabilities`);
      return response.data;
    } catch (error) {
      console.error('Error fetching CV parsing capabilities:', error);
      throw error;
    }
  }

  // Check CV parsing service health
  async checkCVParsingHealth() {
    try {
      const response = await httpClient.get(`${AI_SERVICE_BASE_URL}/cv/health`);
      return response.data;
    } catch (error) {
      console.error('Error checking CV parsing service health:', error);
      throw error;
    }
  }

  // Transform CV parsing result to user creation form data
  transformCVToUserForm(cvParsingResponse) {
    const { result } = cvParsingResponse;
    if (!result || result.processingStatus !== 'SUCCESS') {
      return null;
    }

    const personalInfo = result.personalInfo || {};
    const professionalInfo = result.professionalInfo || {};
    const skills = result.skills || [];
    const workExperience = result.workExperience || [];
    const education = result.education || [];

    // Generate username from name and email
    const generateUsername = () => {
      if (personalInfo.firstName && personalInfo.lastName) {
        return `${personalInfo.firstName.toLowerCase()}.${personalInfo.lastName.toLowerCase()}`;
      }
      if (personalInfo.email) {
        return personalInfo.email.split('@')[0];
      }
      return '';
    };

    // Extract skills list
    const extractedSkills = skills.map(skill => ({
      name: skill.skillName,
      category: skill.category,
      level: skill.proficiencyLevel,
      yearsExperience: skill.yearsOfExperience,
      isPrimary: skill.isPrimary
    }));

    // Build user form data
    const userFormData = {
      // Personal Information
      firstName: personalInfo.firstName || '',
      lastName: personalInfo.lastName || '',
      email: personalInfo.email || '',
      username: generateUsername(),
      phoneNumber: personalInfo.phoneNumber || '',
      dateOfBirth: personalInfo.dateOfBirth || null,
      
      // Address Information
      address: personalInfo.address || '',
      city: personalInfo.city || '',
      country: personalInfo.country || '',
      
      // Professional Information
      currentPosition: professionalInfo.currentPosition || '',
      currentCompany: professionalInfo.currentCompany || '',
      department: professionalInfo.department || '',
      seniorityLevel: professionalInfo.seniorityLevel || '',
      totalYearsExperience: professionalInfo.totalYearsExperience || 0,
      professionalSummary: professionalInfo.professionalSummary || '',
      
      // Social Profiles
      linkedinProfile: personalInfo.linkedinProfile || '',
      githubProfile: personalInfo.githubProfile || '',
      
      // Skills and Competencies
      skills: extractedSkills,
      certifications: professionalInfo.certifications || [],
      languages: professionalInfo.languages || [],
      
      // Work Experience
      workExperience: workExperience.map(exp => ({
        position: exp.position,
        company: exp.company,
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description,
        achievements: exp.achievements || [],
        technologies: exp.technologies || []
      })),
      
      // Education
      education: education.map(edu => ({
        degree: edu.degree,
        institution: edu.institution,
        fieldOfStudy: edu.fieldOfStudy,
        graduationDate: edu.graduationDate,
        grade: edu.grade,
        relevantCourses: edu.relevantCourses || []
      })),
      
      // Processing Metadata
      cvProcessingId: result.processingId,
      confidenceScore: result.confidenceScore,
      warnings: result.warnings || [],
      errors: result.errors || []
    };

    return userFormData;
  }

  // Get suggested department based on CV analysis
  suggestDepartment(cvData) {
    if (!cvData.skills || cvData.skills.length === 0) {
      return null;
    }

    const skillCategories = cvData.skills.map(skill => skill.category?.toLowerCase()).filter(Boolean);
    const departmentMapping = {
      'programming languages': 'Engineering',
      'web technologies': 'Frontend Engineering',
      'databases': 'Backend Engineering',
      'cloud platforms': 'DevOps',
      'mobile development': 'Mobile Engineering',
      'data science': 'Data Science',
      'devops': 'DevOps',
      'design': 'Design',
      'management': 'Management',
      'marketing': 'Marketing',
      'sales': 'Sales',
      'finance': 'Finance',
      'hr': 'Human Resources'
    };

    // Find most common skill category
    const categoryCounts = {};
    skillCategories.forEach(category => {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const mostCommonCategory = Object.keys(categoryCounts).reduce((a, b) => 
      categoryCounts[a] > categoryCounts[b] ? a : b
    );

    return departmentMapping[mostCommonCategory] || 'General';
  }

  // Get suggested position based on CV analysis
  suggestPosition(cvData) {
    const professionalInfo = cvData.professionalInfo || {};
    const yearsExperience = professionalInfo.totalYearsExperience || 0;
    const currentPosition = professionalInfo.currentPosition?.toLowerCase() || '';
    
    // Map experience years to seniority
    let suggestedLevel = '';
    if (yearsExperience >= 8) {
      suggestedLevel = 'Senior';
    } else if (yearsExperience >= 4) {
      suggestedLevel = 'Mid-Level';
    } else if (yearsExperience >= 1) {
      suggestedLevel = 'Junior';
    } else {
      suggestedLevel = 'Entry-Level';
    }

    // Extract position type from current position
    let positionType = 'Developer';
    if (currentPosition.includes('manager') || currentPosition.includes('lead')) {
      positionType = 'Manager';
    } else if (currentPosition.includes('architect')) {
      positionType = 'Architect';
    } else if (currentPosition.includes('analyst')) {
      positionType = 'Analyst';
    } else if (currentPosition.includes('designer')) {
      positionType = 'Designer';
    } else if (currentPosition.includes('engineer')) {
      positionType = 'Engineer';
    }

    return `${suggestedLevel} ${positionType}`;
  }

  // Get suggested roles based on CV analysis
  suggestRoles(cvData) {
    const skills = cvData.skills || [];
    const yearsExperience = cvData.professionalInfo?.totalYearsExperience || 0;
    const currentPosition = cvData.professionalInfo?.currentPosition?.toLowerCase() || '';
    
    const suggestedRoles = ['EMPLOYEE']; // Default role
    
    // Add technical roles based on skills
    const hasManagementSkills = skills.some(skill => 
      skill.category?.toLowerCase().includes('management') ||
      skill.name?.toLowerCase().includes('leadership')
    );
    
    const hasArchitectureSkills = skills.some(skill =>
      skill.name?.toLowerCase().includes('architecture') ||
      skill.name?.toLowerCase().includes('system design')
    );
    
    // Experience-based roles
    if (yearsExperience >= 5) {
      suggestedRoles.push('SENIOR_DEVELOPER');
    }
    
    if (yearsExperience >= 8 || hasManagementSkills) {
      suggestedRoles.push('TEAM_LEAD');
    }
    
    if (yearsExperience >= 10 || hasArchitectureSkills) {
      suggestedRoles.push('ARCHITECT');
    }
    
    // Position-based roles
    if (currentPosition.includes('manager') || currentPosition.includes('lead')) {
      if (!suggestedRoles.includes('TEAM_LEAD')) {
        suggestedRoles.push('TEAM_LEAD');
      }
    }
    
    return suggestedRoles;
  }

  // Validate CV file before upload
  validateCVFile(file) {
    const errors = [];
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const supportedFormats = ['pdf', 'docx', 'doc', 'txt', 'rtf'];
    
    if (!file) {
      errors.push('Please select a CV file');
      return errors;
    }
    
    if (file.size > maxFileSize) {
      errors.push('File size must be less than 10MB');
    }
    
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.') + 1);
    if (!supportedFormats.includes(fileExtension)) {
      errors.push(`Unsupported file format. Supported formats: ${supportedFormats.join(', ')}`);
    }
    
    return errors;
  }

  // Get CV parsing progress status
  getCVParsingStatus(processingStatus) {
    const statusMap = {
      'SUCCESS': {
        label: 'Successfully Parsed',
        color: 'success',
        description: 'CV has been successfully analyzed and data extracted'
      },
      'PARTIAL': {
        label: 'Partially Parsed',
        color: 'warning',
        description: 'Some information was extracted but with limitations'
      },
      'FAILED': {
        label: 'Parsing Failed',
        color: 'error',
        description: 'Unable to extract information from the CV'
      },
      'PROCESSING': {
        label: 'Processing',
        color: 'info',
        description: 'CV is being analyzed...'
      }
    };
    
    return statusMap[processingStatus] || statusMap['FAILED'];
  }

  // Format confidence score for CV parsing
  formatCVConfidence(confidence) {
    if (typeof confidence !== 'number') return 'N/A';
    const percentage = (confidence * 100).toFixed(1);
    
    if (confidence >= 0.9) return `${percentage}% (Excellent)`;
    if (confidence >= 0.75) return `${percentage}% (Very Good)`;
    if (confidence >= 0.6) return `${percentage}% (Good)`;
    if (confidence >= 0.4) return `${percentage}% (Fair)`;
    return `${percentage}% (Poor)`;
  }

  // Get CV processing summary for display
  getCVProcessingSummary(cvParsingResponse) {
    const { result } = cvParsingResponse;
    if (!result) return null;
    
    const personalInfo = result.personalInfo || {};
    const professionalInfo = result.professionalInfo || {};
    const skills = result.skills || [];
    const workExperience = result.workExperience || [];
    const education = result.education || [];
    
    return {
      fileName: result.fileName,
      processingStatus: result.processingStatus,
      confidenceScore: result.confidenceScore,
      processingTime: result.processingTimeMs,
      
      // Extracted data summary
      extractedData: {
        personalInfoFound: Object.keys(personalInfo).length > 0,
        professionalInfoFound: Object.keys(professionalInfo).length > 0,
        skillsCount: skills.length,
        workExperienceCount: workExperience.length,
        educationCount: education.length,
        
        // Key information flags
        hasEmail: !!personalInfo.email,
        hasPhone: !!personalInfo.phoneNumber,
        hasExperience: professionalInfo.totalYearsExperience > 0,
        hasTechnicalSkills: skills.some(skill => 
          ['Programming Languages', 'Web Technologies', 'Databases'].includes(skill.category)
        )
      },
      
      warnings: result.warnings || [],
      errors: result.errors || []
    };
  }
}

const aiService = new AIService();
export default aiService;