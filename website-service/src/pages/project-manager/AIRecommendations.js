import React, { useState, useEffect } from 'react';
import { 
  SparklesIcon,
  UserIcon,
  DocumentTextIcon,
  ClockIcon,
  StarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  BoltIcon,
  UserGroupIcon,
  ChartBarIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import WorkloadSummaryCard from '../../components/workload/WorkloadSummaryCard';
import apiService from '../../services/apiService';

const AIRecommendations = () => {
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [emergencyRecommendations, setEmergencyRecommendations] = useState([]);
  const [teamRecommendations, setTeamRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recommendationType, setRecommendationType] = useState('standard');
  const [aiCapabilities, setAiCapabilities] = useState(null);
  const [workloadData, setWorkloadData] = useState({}); // Store workload data for recommendations

  useEffect(() => {
    loadTasks();
    loadTeams();
    loadAICapabilities();
  }, []);

  const fetchWorkloadForUser = async (userId) => {
    try {
      const response = await apiService.workload.getUserWorkload(userId);
      return response.data;
    } catch (error) {
      console.error(`Failed to load workload for user ${userId}:`, error);
      return null;
    }
  };

  const refreshWorkload = async (userId) => {
    const workload = await fetchWorkloadForUser(userId);
    if (workload) {
      setWorkloadData(prev => ({
        ...prev,
        [userId]: workload
      }));
    }
  };

  const loadTasks = async () => {
    try {
      // Simulate API call to get unassigned or poorly assigned tasks
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Implement OAuth 2.0 Authentication',
          description: 'Build secure OAuth 2.0 authentication system with multiple providers',
          projectId: 'proj-1',
          projectName: 'Mobile Banking App',
          priority: 'HIGH',
          estimatedHours: 24,
          requiredSkills: ['OAuth', 'Security', 'Node.js', 'JWT'],
          complexity: 'HIGH',
          deadline: '2024-10-25'
        },
        {
          id: 'task-2',
          title: 'Design Payment Gateway UI',
          description: 'Create intuitive and secure payment interface for mobile app',
          projectId: 'proj-1',
          projectName: 'Mobile Banking App',
          priority: 'MEDIUM',
          estimatedHours: 16,
          requiredSkills: ['UI/UX', 'Figma', 'Mobile Design', 'Payment Systems'],
          complexity: 'MEDIUM',
          deadline: '2024-10-20'
        },
        {
          id: 'task-3',
          title: 'Optimize Database Queries',
          description: 'Improve database performance and reduce query execution time',
          projectId: 'proj-2',
          projectName: 'E-commerce Platform',
          priority: 'CRITICAL',
          estimatedHours: 12,
          requiredSkills: ['PostgreSQL', 'Database Optimization', 'Performance Tuning'],
          complexity: 'HIGH',
          deadline: '2024-10-18'
        }
      ];

      setTasks(mockTasks);
      if (mockTasks.length > 0) {
        setSelectedTask(mockTasks[0].id);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const loadTeams = async () => {
    try {
      // Simulate API call to get available teams
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const mockTeams = [
        { id: 'team-1', name: 'Frontend Team', memberCount: 8 },
        { id: 'team-2', name: 'Backend Team', memberCount: 12 },
        { id: 'team-3', name: 'Mobile Team', memberCount: 6 },
        { id: 'team-4', name: 'DevOps Team', memberCount: 4 }
      ];

      setTeams(mockTeams);
      if (mockTeams.length > 0) {
        setSelectedTeam(mockTeams[0].id);
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
  };

  const loadAICapabilities = async () => {
    try {
      // Simulate API call to /ai/capabilities
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAiCapabilities({
        supportsFileUpload: true,
        supportsUrlImport: true,
        supportsDirectTextInput: true,
        supportsBatchProcessing: true,
        supportedFileTypes: ['PDF', 'DOCX', 'TXT', 'MD', 'JSON', 'XML'],
        maxFileSizeMB: 10,
        canGenerateTasks: true,
        canAnalyzeRequirements: true,
        canDetectConflicts: true,
        canIdentifySkills: true
      });
    } catch (error) {
      console.error('Failed to load AI capabilities:', error);
    }
  };

  const generateRecommendations = async (taskId, type = 'standard') => {
    try {
      setLoading(true);
      
      // Simulate API call based on type
      let apiEndpoint = '';
      switch (type) {
        case 'emergency':
          apiEndpoint = `/ai/recommendations/task/${taskId}/emergency`;
          break;
        case 'team':
          apiEndpoint = `/ai/recommendations/task/${taskId}/team/${selectedTeam}`;
          break;
        default:
          apiEndpoint = `/ai/recommendations/task/${taskId}`;
      }
      
      console.log('API call to:', apiEndpoint);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockRecommendations = [
        {
          id: 'rec-1',
          userId: 'user-1',
          userName: 'John Smith',
          userEmail: 'john.smith@company.com',
          department: 'Security Engineering',
          experience: 'Senior',
          matchScore: 95,
          skillMatch: 92,
          availabilityScore: 88,
          workloadScore: 90,
          pastPerformance: 94,
          reasons: [
            'Expert in OAuth 2.0 and security protocols',
            'Successfully implemented 5 authentication systems',
            'Available for 25+ hours this week',
            'High code quality rating (4.8/5)'
          ],
          skills: ['OAuth', 'Security', 'Node.js', 'JWT', 'Authentication'],
          currentWorkload: '65% capacity',
          estimatedCompletion: '2024-10-22',
          riskFactors: [],
          aiConfidence: 'High'
        },
        {
          id: 'rec-2',
          userId: 'user-2',
          userName: 'Sarah Johnson',
          userEmail: 'sarah.johnson@company.com',
          department: 'Backend Development',
          experience: 'Mid-Level',
          matchScore: 78,
          skillMatch: 85,
          availabilityScore: 95,
          workloadScore: 70,
          pastPerformance: 82,
          reasons: [
            'Strong Node.js and JWT experience',
            'Recently completed security training',
            'Very low current workload',
            'Good collaboration history with team'
          ],
          skills: ['Node.js', 'JWT', 'API Development', 'Security Basics'],
          currentWorkload: '40% capacity',
          estimatedCompletion: '2024-10-24',
          riskFactors: ['Limited OAuth experience', 'May need mentorship'],
          aiConfidence: 'Medium'
        },
        {
          id: 'rec-3',
          userId: 'user-3',
          userName: 'Mike Chen',
          userEmail: 'mike.chen@company.com',
          department: 'Full-Stack Development',
          experience: 'Senior',
          matchScore: 72,
          skillMatch: 75,
          availabilityScore: 60,
          workloadScore: 85,
          pastPerformance: 88,
          reasons: [
            'Solid security background',
            'Experience with authentication systems',
            'Strong problem-solving skills',
            'Available for complex projects'
          ],
          skills: ['Security', 'Full-Stack', 'Authentication', 'System Architecture'],
          currentWorkload: '80% capacity',
          estimatedCompletion: '2024-10-26',
          riskFactors: ['High current workload', 'Multiple concurrent projects'],
          aiConfidence: 'Medium'
        }
      ];

      switch (type) {
        case 'emergency':
          setEmergencyRecommendations(mockRecommendations);
          break;
        case 'team':
          setTeamRecommendations(mockRecommendations);
          break;
        default:
          setRecommendations(mockRecommendations);
      }

      // Fetch workload data for all recommended users
      const workloadPromises = mockRecommendations.map(rec => 
        fetchWorkloadForUser(rec.userId)
      );
      const workloads = await Promise.all(workloadPromises);
      
      const workloadMap = {};
      mockRecommendations.forEach((rec, index) => {
        if (workloads[index]) {
          workloadMap[rec.userId] = workloads[index];
        }
      });
      setWorkloadData(workloadMap);

      setLoading(false);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceColor = (confidence) => {
    const colors = {
      'High': 'text-green-600 bg-green-100',
      'Medium': 'text-yellow-600 bg-yellow-100',
      'Low': 'text-red-600 bg-red-100'
    };
    return colors[confidence] || 'text-gray-600 bg-gray-100';
  };

  const getCurrentRecommendations = () => {
    switch (recommendationType) {
      case 'emergency':
        return emergencyRecommendations;
      case 'team':
        return teamRecommendations;
      default:
        return recommendations;
    }
  };

  const selectedTaskData = tasks.find(task => task.id === selectedTask);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <SparklesIcon className="h-8 w-8 text-primary-600 mr-3" />
                AI Task Assignment Recommendations
              </h1>
              <p className="text-gray-600 mt-2">
                Get AI-powered suggestions for optimal task assignments based on skills, availability, and performance
              </p>
            </div>
          </div>
        </div>

        {/* AI Capabilities Panel */}
        {aiCapabilities && (
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg p-6 mb-8">
            <div className="flex items-center mb-4">
              <BoltIcon className="h-6 w-6 mr-2" />
              <h2 className="text-xl font-semibold">AI Engine Status</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Task Generation Ready
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Requirements Analysis
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Conflict Detection
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Skill Identification
              </div>
            </div>
          </div>
        )}

        {/* Task Selection and Recommendation Type */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Task for Assignment
              </label>
              <select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {tasks.map(task => (
                  <option key={task.id} value={task.id}>
                    {task.title} - {task.projectName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recommendation Type
              </label>
              <select
                value={recommendationType}
                onChange={(e) => setRecommendationType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="standard">Standard Recommendations</option>
                <option value="emergency">Emergency Assignment</option>
                <option value="team">Team-Based Assignment</option>
              </select>
            </div>

            {recommendationType === 'team' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Team
                </label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.memberCount} members)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {recommendationType !== 'team' && (
              <div className="flex items-end">
                <button
                  onClick={() => generateRecommendations(selectedTask, recommendationType)}
                  disabled={!selectedTask || loading}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Generate AI Recommendations
                    </>
                  )}
                </button>
              </div>
            )}

            {recommendationType === 'team' && (
              <div className="flex items-end">
                <button
                  onClick={() => generateRecommendations(selectedTask, 'team')}
                  disabled={!selectedTask || !selectedTeam || loading}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <UserGroupIcon className="h-4 w-4 mr-2" />
                      Generate Team Recommendations
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Selected Task Details */}
        {selectedTaskData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Task Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{selectedTaskData.title}</h4>
                <p className="text-sm text-gray-600 mb-4">{selectedTaskData.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Project:</span>
                    <span className="font-medium">{selectedTaskData.projectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priority:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${selectedTaskData.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' : selectedTaskData.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {selectedTaskData.priority}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Hours:</span>
                    <span className="font-medium">{selectedTaskData.estimatedHours}h</span>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Required Skills</h5>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedTaskData.requiredSkills.map((skill, index) => (
                    <span key={index} className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Complexity:</span>
                    <span className={`font-medium ${selectedTaskData.complexity === 'HIGH' ? 'text-red-600' : selectedTaskData.complexity === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'}`}>
                      {selectedTaskData.complexity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deadline:</span>
                    <span className="font-medium">{new Date(selectedTaskData.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        {getCurrentRecommendations().length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <LightBulbIcon className="h-6 w-6 text-yellow-500 mr-2" />
                AI Recommendations
                {recommendationType === 'emergency' && (
                  <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                    EMERGENCY
                  </span>
                )}
                {recommendationType === 'team' && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    TEAM-BASED
                  </span>
                )}
              </h2>
              <div className="text-sm text-gray-600">
                {getCurrentRecommendations().length} recommendation(s) found
              </div>
            </div>

            {getCurrentRecommendations().map((rec, index) => (
              <div key={rec.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{rec.userName}</h3>
                      <p className="text-sm text-gray-600">{rec.department} • {rec.experience}</p>
                      <p className="text-sm text-gray-500">{rec.userEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getScoreColor(rec.matchScore)}`}>
                      {rec.matchScore}% Match
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(rec.aiConfidence)}`}>
                      {rec.aiConfidence} Confidence
                    </span>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className={`text-lg font-bold ${getScoreColor(rec.skillMatch).split(' ')[0]}`}>
                      {rec.skillMatch}%
                    </div>
                    <div className="text-xs text-gray-600">Skill Match</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${getScoreColor(rec.availabilityScore).split(' ')[0]}`}>
                      {rec.availabilityScore}%
                    </div>
                    <div className="text-xs text-gray-600">Availability</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${getScoreColor(rec.workloadScore).split(' ')[0]}`}>
                      {rec.workloadScore}%
                    </div>
                    <div className="text-xs text-gray-600">Workload</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${getScoreColor(rec.pastPerformance).split(' ')[0]}`}>
                      {rec.pastPerformance}%
                    </div>
                    <div className="text-xs text-gray-600">Performance</div>
                  </div>
                </div>

                {/* Skills and Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {rec.skills.map((skill, skillIndex) => (
                        <span key={skillIndex} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Workload:</span>
                      <span className="font-medium">{rec.currentWorkload}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Est. Completion:</span>
                      <span className="font-medium">{new Date(rec.estimatedCompletion).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Workload Summary Card */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Detailed Workload</h4>
                  <WorkloadSummaryCard
                    workloadData={workloadData[rec.userId]}
                    compact={false}
                    onRefresh={refreshWorkload}
                    className="w-full"
                  />
                </div>

                {/* AI Reasoning */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <ChartBarIcon className="h-4 w-4 mr-1" />
                    AI Analysis
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {rec.reasons.map((reason, reasonIndex) => (
                      <li key={reasonIndex} className="flex items-start">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risk Factors */}
                {rec.riskFactors.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1 text-yellow-500" />
                      Risk Factors
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {rec.riskFactors.map((risk, riskIndex) => (
                        <li key={riskIndex} className="flex items-start">
                          <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <button className="btn-secondary flex items-center">
                    <UserIcon className="h-4 w-4 mr-2" />
                    View Profile
                  </button>
                  <button className="btn-primary flex items-center">
                    <ArrowRightIcon className="h-4 w-4 mr-2" />
                    Assign Task
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {getCurrentRecommendations().length === 0 && !loading && (
          <div className="text-center py-12">
            <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations generated yet</h3>
            <p className="text-gray-600 mb-6">
              Select a task and click "Generate AI Recommendations" to get intelligent assignment suggestions
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRecommendations;