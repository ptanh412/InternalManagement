import React, { useState, useEffect } from 'react';
import { 
  CloudArrowUpIcon,
  DocumentTextIcon,
  XMarkIcon,
  SparklesIcon,
  UserPlusIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ChartBarIcon,
  CalendarIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../hooks/useAuth';


const CVAnalysis = () => {
  const { user, isAuthenticated } = useAuth();
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [editingResult, setEditingResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [stats, setStats] = useState(null);

   // Filter states
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [showHistoryDetail, setShowHistoryDetail] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [roles, setRoles] = useState([]);
  
  // Load master data khi component mount
  useEffect(() => {
    console.log('🔍 CVAnalysis useEffect triggered:', { 
      isAuthenticated, 
      user: user?.email,
      role: user?.role,
      token: localStorage.getItem('token') ? 'Present' : 'Missing'
    });

    if (isAuthenticated && user) {
      console.log('🔐 User authenticated, loading data...', { user: user.role });
      loadAnalysisHistory();
      loadStatistics();
      loadMasterData(); 
    } else {
      console.log('⚠️ User not authenticated, skipping data load');
    }
  }, [isAuthenticated, user]);

  const loadMasterData = async () => {
    if (!isAuthenticated || !user) {
      console.log('⚠️ Not authenticated, cannot load master data');
      return;
    }

    try {
      console.log('📚 Loading master data...'); 
      // Gọi API lấy departments, positions, roles
      const [deptRes, posRes, roleRes] = await Promise.all([
        apiService.admin.getAllDepartments(),
        apiService.admin.getAllPositions(),
        apiService.admin.getAllRoles()
      ]);
      
      setDepartments(deptRes.data?.result || deptRes.result || []);
      setPositions(posRes.data?.result || posRes.result || []);
      setRoles(roleRes.data?.result || roleRes.result || []);
      
      console.log('✅ Loaded master data:', {
        departments: (deptRes.data?.result || deptRes.result || []).length,
        positions: (posRes.data?.result || posRes.result || []).length,
        roles: (roleRes.data?.result || roleRes.result || []).length
      });
    } catch (error) {
      console.error('❌ Failed to load master data:', error);
      if (error.response?.status === 401) {
        console.log('🔒 Authentication error loading master data');
      }
      // Fallback: set empty arrays để không crash
      setDepartments([]);
      setPositions([]);
      setRoles([]);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    setSelectedFiles(files);
  };

  const analyzeSingleCV = async () => {
    if (selectedFiles.length === 0) return;
    
    if (!isAuthenticated || !user) {
      alert('⚠️ You must be logged in to analyze CVs');
      return;
    }

    try {
      setUploadLoading(true);
      console.log('🔍 Analyzing CV:', selectedFiles[0].name);
      
      const formData = new FormData();
      formData.append('file', selectedFiles[0]); // Backend expects 'file' param
      
      // ✅ GỌI API THẬT với authentication
      const response = await apiService.admin.analyzeCV(formData);
      const result = response.data?.result || response.result || response.data;
      
      console.log('✅ CV Analysis completed:', result);
      
      setAnalysisResult(result);
      setEditingResult(JSON.parse(JSON.stringify(result)));
      setShowResultModal(true);
      setSelectedFiles([]);
      
      await loadAnalysisHistory();
      await loadStatistics();
      
    } catch (error) {
      console.error('Failed to analyze CV:', error);
      
      // Show user-friendly error
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      alert(`❌ Failed to analyze CV: ${errorMessage}`);
    } finally {
      setUploadLoading(false);
    }
  };
  const loadAnalysisHistory = async () => {
    if (!isAuthenticated || !user) {
      console.log('⚠️ Not authenticated, cannot load analysis history');
      return;
    }

    try {
      setLoading(true);
      console.log('📊 Loading CV analysis history...');
      
      // ✅ GỌI API THẬT từ admin section
      const response = await apiService.admin.getCVAnalysisHistory();
      const histories = response.data?.result || response.result || [];
      setAnalysisHistory(histories);
      
      console.log('✅ Loaded analysis history:', histories.length, 'items');
    } catch (error) {
      console.error('❌ Failed to load analysis history:', error);
      if (error.response?.status === 401) {
        console.log('🔒 Authentication error - redirecting to login');
      }
      setAnalysisHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    if (!isAuthenticated || !user) {
      console.log('⚠️ Not authenticated, cannot load statistics');
      return;
    }

    try {
      console.log('📈 Loading CV analysis statistics...');
      // ✅ GỌI API THẬT từ admin section
      const response = await apiService.admin.getCVAnalysisStats();
      const stats = response.data?.result || response.result || response.data;
      setStats(stats);
      console.log('✅ Loaded statistics:', stats);
      
    } catch (error) {
      console.error('❌ Failed to load stats:', error);
      if (error.response?.status === 401) {
        console.log('🔒 Authentication error loading statistics');
      }
      setStats(null);
    }
  };
  // Filter and search
  const filteredHistory = analysisHistory.filter(item => {
    const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
    const matchSearch = !searchTerm || 
      item.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.extractedName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.extractedEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });
  // Status badge
  const StatusBadge = ({ status }) => {
    const colors = {
      'USER_CREATED': 'bg-green-100 text-green-800',
      'ANALYZED': 'bg-blue-100 text-blue-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'FAILED': 'bg-red-100 text-red-800'
    };
    const labels = {
      'USER_CREATED': 'User Created',
      'ANALYZED': 'Analyzed',
      'PENDING': 'Pending',
      'FAILED': 'Failed'
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };
  const EditableField = ({ label, value, onChange, type = "text", multiline = false }) => {
    const [isEditing, setIsEditing] = useState(false);

    if (multiline) {
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          {isEditing ? (
            <div className="flex items-start space-x-2">
              <textarea
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
              >
                <CheckIcon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-start space-x-2 group">
              <p className="flex-1 text-gray-900">{value || 'N/A'}</p>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {isEditing ? (
          <div className="flex items-center space-x-2">
            <input
              type={type}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => setIsEditing(false)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
            >
              <CheckIcon className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 group">
            <p className="flex-1 text-gray-900">{value || 'N/A'}</p>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const EditableSkillsList = ({ skills, skillTypes, skillExperience, onChange }) => {
    const [editingSkill, setEditingSkill] = useState(null);
    const [newSkill, setNewSkill] = useState({ name: '', proficiency: 0.5, type: 'TECHNICAL', experience: 0 });

    const updateSkill = (oldName, newData) => {
      const updatedSkills = { ...skills };
      const updatedTypes = { ...skillTypes };
      const updatedExp = { ...skillExperience };

      if (oldName !== newData.name) {
        delete updatedSkills[oldName];
        delete updatedTypes[oldName];
        delete updatedExp[oldName];
      }

      updatedSkills[newData.name] = newData.proficiency;
      updatedTypes[newData.name] = newData.type;
      updatedExp[newData.name] = newData.experience;

      onChange({ skills: updatedSkills, skillTypes: updatedTypes, skillExperience: updatedExp });
      setEditingSkill(null);
    };

    const addSkill = () => {
      if (!newSkill.name) return;
      const updatedSkills = { ...skills, [newSkill.name]: newSkill.proficiency };
      const updatedTypes = { ...skillTypes, [newSkill.name]: newSkill.type };
      const updatedExp = { ...skillExperience, [newSkill.name]: newSkill.experience };
      onChange({ skills: updatedSkills, skillTypes: updatedTypes, skillExperience: updatedExp });
      setNewSkill({ name: '', proficiency: 0.5, type: 'TECHNICAL', experience: 0 });
    };

    const deleteSkill = (skillName) => {
      const updatedSkills = { ...skills };
      const updatedTypes = { ...skillTypes };
      const updatedExp = { ...skillExperience };
      delete updatedSkills[skillName];
      delete updatedTypes[skillName];
      delete updatedExp[skillName];
      onChange({ skills: updatedSkills, skillTypes: updatedTypes, skillExperience: updatedExp });
    };

    const getProficiencyLabel = (score) => {
      if (score >= 0.9) return 'Expert';
      if (score >= 0.8) return 'Advanced';
      if (score >= 0.5) return 'Intermediate';
      return 'Beginner';
    };

    return (
      <div className="space-y-3">
        {Object.entries(skills).map(([skillName, proficiency]) => (
          <div key={skillName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
            {editingSkill === skillName ? (
              <div className="flex-1 grid grid-cols-4 gap-2">
                <input
                  type="text"
                  defaultValue={skillName}
                  onBlur={(e) => updateSkill(skillName, {
                    name: e.target.value,
                    proficiency: proficiency,
                    type: skillTypes[skillName],
                    experience: skillExperience[skillName]
                  })}
                  className="px-2 py-1 border rounded"
                />
                <select
                  defaultValue={skillTypes[skillName]}
                  onChange={(e) => updateSkill(skillName, {
                    name: skillName,
                    proficiency: proficiency,
                    type: e.target.value,
                    experience: skillExperience[skillName]
                  })}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="TECHNICAL">Technical</option>
                  <option value="SOFT">Soft</option>
                  <option value="LANGUAGE">Language</option>
                </select>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  defaultValue={proficiency}
                  onBlur={(e) => updateSkill(skillName, {
                    name: skillName,
                    proficiency: parseFloat(e.target.value),
                    type: skillTypes[skillName],
                    experience: skillExperience[skillName]
                  })}
                  className="px-2 py-1 border rounded text-sm"
                />
                <input
                  type="number"
                  min="0"
                  defaultValue={skillExperience[skillName]}
                  onBlur={(e) => updateSkill(skillName, {
                    name: skillName,
                    proficiency: proficiency,
                    type: skillTypes[skillName],
                    experience: parseInt(e.target.value)
                  })}
                  className="px-2 py-1 border rounded text-sm"
                  placeholder="Years"
                />
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{skillName}</span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {skillTypes[skillName]}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>{getProficiencyLabel(proficiency)}</span>
                        <span>{(proficiency * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${proficiency * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">{skillExperience[skillName]} years</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingSkill(skillName)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteSkill(skillName)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Add new skill */}
        <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
          <input
            type="text"
            placeholder="Skill name"
            value={newSkill.name}
            onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
            className="flex-1 px-2 py-1 border rounded text-sm"
          />
          <select
            value={newSkill.type}
            onChange={(e) => setNewSkill({ ...newSkill, type: e.target.value })}
            className="px-2 py-1 border rounded text-sm"
          >
            <option value="TECHNICAL">Technical</option>
            <option value="SOFT">Soft</option>
            <option value="LANGUAGE">Language</option>
          </select>
          <input
            type="number"
            placeholder="Score"
            min="0"
            max="1"
            step="0.1"
            value={newSkill.proficiency}
            onChange={(e) => setNewSkill({ ...newSkill, proficiency: parseFloat(e.target.value) })}
            className="w-20 px-2 py-1 border rounded text-sm"
          />
          <input
            type="number"
            placeholder="Yrs"
            min="0"
            value={newSkill.experience}
            onChange={(e) => setNewSkill({ ...newSkill, experience: parseInt(e.target.value) })}
            className="w-16 px-2 py-1 border rounded text-sm"
          />
          <button
            onClick={addSkill}
            className="p-1 text-green-600 hover:bg-green-100 rounded"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };

  const ResultModal = () => {
    if (!showResultModal || !editingResult) return null;

    const profile = editingResult.userProfile;

    const updateProfile = (field, value) => {
      setEditingResult({
        ...editingResult,
        userProfile: {
          ...editingResult.userProfile,
          [field]: value
        }
      });
    };

    const updateBusinessMapping = (field, value) => {
    setEditingResult({
      ...editingResult,
      businessMappings: {
        ...editingResult.businessMappings,
        [field]: value
      }
    });
  };

  
  const convertToUserCreationRequest = (cvAnalysisResult) => {
    const profile = cvAnalysisResult.userProfile;
    const businessMappings = cvAnalysisResult.businessMappings;

    if (!profile) {
      throw new Error('User profile is missing from CV analysis result');
    }
    // Split full name
    const splitFullName = (fullName) => {
      if (!fullName) return { firstName: '', lastName: '' };
      
      const parts = fullName.trim().split(/\s+/);
      if (parts.length === 0) return { firstName: '', lastName: '' };
      if (parts.length === 1) return { firstName: parts[0], lastName: '' };
      
      // Vietnamese name format: [LastName] [MiddleName...] [FirstName]
      const lastName = parts[0]; // Họ
      const firstName = parts[parts.length - 1]; // Tên
      
      return { firstName, lastName };
    };

    // Extract basic info
    const { firstName, lastName } = splitFullName(profile.name);
    // Extract username from email
    const extractUsername = (email) => {
      if (!email) return '';
      return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    };
    const username = extractUsername(profile.email);
    // Generate random password
    const generateDefaultPassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        const nums = '0123456789';
        const specials = '@#$';
        
        const randomChars = chars.charAt(Math.floor(Math.random() * chars.length)) +
                          chars.charAt(Math.floor(Math.random() * chars.length)) +
                          chars.charAt(Math.floor(Math.random() * chars.length)).toUpperCase();
        const randomNums = nums.charAt(Math.floor(Math.random() * nums.length)) +
                          nums.charAt(Math.floor(Math.random() * nums.length));
        const randomSpecial = specials.charAt(Math.floor(Math.random() * specials.length));
        
        return 'Welcome' + randomSpecial + randomChars + randomNums; // e.g., Welcome@Abc12
    };
    const password = generateDefaultPassword();
    
    // Map department name to ID
    const mapDepartmentNameToId = (departmentName) => {
      if (!departmentName || departments.length === 0) return null;
      
      // Tìm department khớp tên (case-insensitive)
      const dept = departments.find(d => 
        d.name?.toUpperCase() === departmentName.toUpperCase() ||
        d.name?.toUpperCase().includes(departmentName.toUpperCase())
      );
      
      console.log('Mapping department:', departmentName, '→', dept?.id || 'null');
      return dept?.id || null;
    };

   // 4. Improved mapping with detailed logging
    const mapPositionToId = (currentRole, seniority) => {
      console.log('🔍 Mapping position:', { currentRole, seniority, positionsCount: positions.length });
      
      if (positions.length === 0) {
        console.warn('⚠️ No positions available');
        return null;
      }
      
      // Log available positions for debugging
      console.log('Available positions:', positions.map(p => ({
        id: p.id,
        title: p.title,
        seniorityLevel: p.seniorityLevel
      })));
      
      // Try exact match first
      const position = positions.find(p => {
        const titleMatch = currentRole && p.title?.toLowerCase().includes(currentRole.toLowerCase());
        const seniorityMatch = seniority && p.seniorityLevel?.toUpperCase() === seniority.toUpperCase();
        
        return titleMatch && seniorityMatch;
      });
      
      if (position) {
        console.log('✅ Exact position match:', {
          id: position.id,
          title: position.title,
          seniority: position.seniorityLevel
        });
        return position.id;
      }
      
      // Fallback: match by seniority only
      const fallbackPosition = positions.find(p => 
        p.seniorityLevel?.toUpperCase() === seniority?.toUpperCase()
      );
      
      if (fallbackPosition) {
        console.log('⚠️ Fallback position match:', {
          id: fallbackPosition.id,
          title: fallbackPosition.title,
          seniority: fallbackPosition.seniorityLevel
        });
        return fallbackPosition.id;
      }
      
      console.warn('❌ No position match found');
      return null;
    };

    // Get default EMPLOYEE role ID
    const getDefaultRoleId = () => {
      if (roles.length === 0) return null;
      
      // Tìm role có tên là "EMPLOYEE" hoặc "USER"
      const employeeRole = roles.find(r => 
        r.name?.toUpperCase() === 'EMPLOYEE'
      );
      
      console.log('Default role:', employeeRole?.id || 'null');
      return employeeRole?.id || (roles[0]?.id || null); // Fallback to first role
    };

    // Initialize business mappings if not exists
    if (!editingResult.businessMappings) {
      const profile = editingResult.userProfile;
      editingResult.businessMappings = {
        departmentId: mapDepartmentNameToId(profile.department),
        positionId: mapPositionToId(profile.currentRole, profile.seniority),
        roleId: getDefaultRoleId()
      };
    }

    // Convert proficiency score to level
    const convertScoreToProficiencyLevel = (score) => {
      if (score >= 0.9) return 'EXPERT';
      if (score >= 0.8) return 'ADVANCED';
      if (score >= 0.5) return 'INTERMEDIATE';
      return 'BEGINNER';
    }; 
      // Convert skills to UserSkillRequest format
      const skills = profile.skills ? Object.entries(profile.skills).map(([skillName, proficiency]) => ({
        skillId: null, // Backend will resolve based on skillName
        skillName: skillName,
        proficiencyLevel: convertScoreToProficiencyLevel(proficiency),
        yearsOfExperience: profile.skillExperience?.[skillName] || 0,
        isPrimary: profile.mandatorySkills?.includes(skillName) || false
      })) : [];
      
      // Validate required fields
      if (!username || username.length < 4) {
        throw new Error('Invalid username extracted from email');
      }
      
      if (!profile.email || !profile.email.includes('@')) {
        throw new Error('Invalid email address');
      }
      
      // Build request object matching UserCreationRequest
      const request = {
          // Required fields
          username: username,
          password: '123456',
          email: profile.email,
          firstName: firstName || 'Unknown',
          lastName: lastName || 'User',
          
          // Optional profile fields
          dob: profile.dateOfBirth || null,
          city: profile.city || null,
          avatar: null,
          phoneNumber: profile.phone || null,
          
          // Business attributes
          departmentId: businessMappings?.departmentId || null,
          positionId: businessMappings?.positionId || null,
          roleId: businessMappings?.roleId || null,
          employeeId: null, // Auto-generated by backend
          
          // Skills array
          skills: skills,
          
          // Availability status
          availabilityStatus: 'AVAILABLE'
        };
        
        console.log('🔄 Converted CV Analysis to UserCreationRequest:', {
          username: request.username,
          email: request.email,
          departmentId: request.departmentId,
          positionId: request.positionId,
          roleId: request.roleId,
          skillsCount: request.skills.length
        });
        
        return request;
  };
  const validateUserCreationRequest = (request) => {
    const errors = [];
    
    // Required field validation
    if (!request.username || request.username.length < 4) {
      errors.push('Username must be at least 4 characters');
    }
    
    if (!request.password || request.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
    
    if (!request.email || !request.email.includes('@')) {
      errors.push('Valid email address is required');
    }
    
    if (!request.firstName) {
      errors.push('First name is required');
    }
    
    if (!request.roleId) {
      errors.push('Role ID is required (check if roles are loaded)');
    }
    
    // Warning for optional fields
    if (!request.departmentId) {
      console.warn('⚠️ Department ID is null - user will be created without department');
    }
    
    if (!request.positionId) {
      console.warn('⚠️ Position ID is null - user will be created without position');
    }
    
    if (request.skills.length === 0) {
      console.warn('⚠️ No skills provided');
    }
    
    return errors;
  };
  
  const createProfile = async () => {
    try {
      setUploadLoading(true);
      
      // Convert CV result to UserCreationRequest
      const userCreationRequest = convertToUserCreationRequest(editingResult);
      
      // Validate request
      const validationErrors = validateUserCreationRequest(userCreationRequest);
      if (validationErrors.length > 0) {
        alert('❌ Validation Errors:\n\n' + validationErrors.join('\n'));
        setUploadLoading(false);
        return;
      }
        await apiService.admin.createUser(userCreationRequest);

        setShowResultModal(false);
        setEditingResult(null);
        setAnalysisResult(null);
        
        await loadAnalysisHistory();
        await loadStatistics();
        
      } catch (error) {
        console.error('Failed to create profile:', error);
        
        const errorMessage = error.response?.data?.message || error.message;
        alert(`❌ Failed to create user profile:\n\n${errorMessage}`);
      } finally {
        setUploadLoading(false);
      }
   };

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">CV Analysis Result</h2>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm text-gray-600">
                  Confidence: <span className="font-semibold text-green-600">
                    {(editingResult.confidence * 100).toFixed(0)}%
                  </span>
                </span>
                <span className="text-sm text-gray-600">
                  Processing Time: <span className="font-semibold">{editingResult.processingTime}ms</span>
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowResultModal(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-8">
              {/* Personal Information */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <UserPlusIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <EditableField
                    label="Full Name"
                    value={profile.name}
                    onChange={(val) => updateProfile('name', val)}
                  />
                  <EditableField
                    label="Email"
                    value={profile.email}
                    type="email"
                    onChange={(val) => updateProfile('email', val)}
                  />
                  <EditableField
                    label="Phone"
                    value={profile.phone}
                    onChange={(val) => updateProfile('phone', val)}
                  />
                  <EditableField
                    label="City"
                    value={profile.city}
                    onChange={(val) => updateProfile('city', val)}
                  />
                  <EditableField
                    label="LinkedIn"
                    value={profile.linkedIn}
                    onChange={(val) => updateProfile('linkedIn', val)}
                  />
                  <EditableField
                    label="GitHub"
                    value={profile.github}
                    onChange={(val) => updateProfile('github', val)}
                  />
                  <EditableField
                    label="Date of Birth"
                    value={profile.dateOfBirth}
                    type="date"
                    onChange={(val) => updateProfile('dateOfBirth', val)}
                  />
                </div>
              </section>

              {/* Professional Summary */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-purple-600" />
                  Professional Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <EditableField
                    label="Current Role"
                    value={profile.currentRole}
                    onChange={(val) => updateProfile('currentRole', val)}
                  />
                  <EditableField
                    label="Department"
                    value={profile.department}
                    onChange={(val) => updateProfile('department', val)}
                  />
                  <EditableField
                    label="Seniority Level"
                    value={profile.seniority}
                    onChange={(val) => updateProfile('seniority', val)}
                  />
                  <EditableField
                    label="Years of Experience"
                    value={profile.experienceYears}
                    type="number"
                    onChange={(val) => updateProfile('experienceYears', parseFloat(val))}
                  />
                </div>
              </section>
              {/* NEW: Business Attribute Mappings */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BriefcaseIcon className="h-5 w-5 mr-2 text-indigo-600" />
                Business Attribute Assignment
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (Required for user creation)
                </span>
              </h3>
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-lg border-2 border-indigo-200">
                <div className="grid grid-cols-1 gap-6">
                  {/* Department Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editingResult.businessMappings?.departmentId || ''}
                      onChange={(e) => updateBusinessMapping('departmentId', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                    {editingResult.businessMappings?.departmentId && (
                      <p className="mt-1 text-xs text-green-600 flex items-center">
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Department assigned
                      </p>
                    )}
                  </div>

                  {/* Position Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editingResult.businessMappings?.positionId || ''}
                      onChange={(e) => updateBusinessMapping('positionId', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                      disabled={!editingResult.businessMappings?.departmentId}
                    >
                      <option value="">-- Select Position --</option>
                      {positions
                        .filter(pos => 
                          !editingResult.businessMappings?.departmentId || 
                          pos.departmentId === editingResult.businessMappings?.departmentId
                        )
                        .map(pos => (
                          <option key={pos.id} value={pos.id}>
                            {pos.title} ({pos.seniorityLevel})
                          </option>
                        ))
                      }
                    </select>
                    {!editingResult.businessMappings?.departmentId && (
                      <p className="mt-1 text-xs text-amber-600 flex items-center">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        Please select department first
                      </p>
                    )}
                    {editingResult.businessMappings?.positionId && (
                      <p className="mt-1 text-xs text-green-600 flex items-center">
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Position assigned
                      </p>
                    )}
                  </div>

                  {/* Role Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editingResult.businessMappings?.roleId || ''}
                      onChange={(e) => updateBusinessMapping('roleId', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    >
                      <option value="">-- Select Role --</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name} - {role.description}
                        </option>
                      ))}
                    </select>
                    {editingResult.businessMappings?.roleId && (
                      <p className="mt-1 text-xs text-green-600 flex items-center">
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Role assigned
                      </p>
                    )}
                  </div>
                </div>

                {/* Validation Summary */}
                <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Assignment Summary:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className={editingResult.businessMappings?.departmentId ? "text-green-600 font-medium" : "text-red-600"}>
                        {editingResult.businessMappings?.departmentId 
                          ? departments.find(d => d.id === editingResult.businessMappings.departmentId)?.name 
                          : "Not assigned"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Position:</span>
                      <span className={editingResult.businessMappings?.positionId ? "text-green-600 font-medium" : "text-red-600"}>
                        {editingResult.businessMappings?.positionId 
                          ? positions.find(p => p.id === editingResult.businessMappings.positionId)?.title 
                          : "Not assigned"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Role:</span>
                      <span className={editingResult.businessMappings?.roleId ? "text-green-600 font-medium" : "text-red-600"}>
                        {editingResult.businessMappings?.roleId 
                          ? roles.find(r => r.id === editingResult.businessMappings.roleId)?.name 
                          : "Not assigned"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

              {/* Skills */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <SparklesIcon className="h-5 w-5 mr-2 text-yellow-600" />
                  Skills & Expertise
                </h3>
                <EditableSkillsList
                  skills={profile.skills}
                  skillTypes={profile.skillTypes}
                  skillExperience={profile.skillExperience}
                  onChange={(data) => updateProfile('skills', data.skills) || updateProfile('skillTypes', data.skillTypes) || updateProfile('skillExperience', data.skillExperience)}
                />
              </section>

              {/* Performance Indicators */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
                  Performance Indicators
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Productivity: {(profile.estimatedProductivity * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={profile.estimatedProductivity}
                      onChange={(e) => updateProfile('estimatedProductivity', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adaptability Score: {(profile.adaptabilityScore * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={profile.adaptabilityScore}
                      onChange={(e) => updateProfile('adaptabilityScore', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Leadership Potential: {(profile.leadershipPotential * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={profile.leadershipPotential}
                      onChange={(e) => updateProfile('leadershipPotential', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Technical Complexity: {(profile.technicalComplexityHandling * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={profile.technicalComplexityHandling}
                      onChange={(e) => updateProfile('technicalComplexityHandling', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Collaboration Score: {(profile.collaborationScore * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={profile.collaborationScore}
                      onChange={(e) => updateProfile('collaborationScore', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </section>

              {/* Work Experience Summary */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Work Experience ({profile.workHistory?.length || 0} positions)
                </h3>
                <div className="space-y-3">
                  {profile.workHistory?.map((exp, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{exp.position}</h4>
                          <p className="text-sm text-gray-600">{exp.company} • {exp.duration}</p>
                        </div>
                        <span className="text-xs text-gray-500">{exp.startDate} - {exp.endDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Education Summary */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Education ({profile.education?.length || 0} degrees)
                </h3>
                <div className="space-y-3">
                  {profile.education?.map((edu, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">{edu.degree} in {edu.field}</h4>
                      <p className="text-sm text-gray-600">{edu.institution} • {edu.graduationYear}</p>
                      {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* Footer Actions */}
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {!editingResult.businessMappings?.departmentId || 
             !editingResult.businessMappings?.positionId || 
             !editingResult.businessMappings?.roleId ? (
              <span className="text-amber-600 flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                Please assign all required business attributes
              </span>
            ) : (
              <span className="text-green-600 flex items-center">
                <CheckIcon className="h-4 w-4 mr-1" />
                All required fields are assigned
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowResultModal(false)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={createProfile}
              disabled={
                uploadLoading || 
                !editingResult.businessMappings?.departmentId || 
                !editingResult.businessMappings?.positionId || 
                !editingResult.businessMappings?.roleId
              }
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {uploadLoading ? (
                <>
                  <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Create User Profile
                </>
              )}
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  };

  // Authentication guard
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
          <p className="text-sm text-gray-500 mt-2">Please make sure you are logged in</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">CV Analysis with AI</h2>
        <p className="text-gray-600 mt-1">
          Upload CVs for intelligent analysis and automated profile creation
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload CV for Analysis</h3>
        
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
        >
          <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="mb-4">
            <label className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-500 font-medium">
                Choose file
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <span className="text-gray-500"> or drag and drop</span>
          </div>
          <p className="text-sm text-gray-500">PDF, DOC, DOCX files up to 10MB</p>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Selected File:</h4>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center text-sm text-gray-600">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                <span className="font-medium">{selectedFiles[0].name}</span>
                <span className="ml-2 text-gray-400">
                  ({(selectedFiles[0].size / 1024 / 1024).toFixed(1)} MB)
                </span>
              </div>
              <button
                onClick={() => setSelectedFiles([])}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <button
              onClick={analyzeSingleCV}
              disabled={uploadLoading}
              className="mt-4 w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {uploadLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Analyzing CV with AI...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  <span>Analyze CV</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      
      {/* Result Modal */}
      <ResultModal />

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Analyzed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalAnalyzed}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Users Created</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsersCreated}</p>
                <p className="text-xs text-green-600 mt-1">
                  {(stats.successRate * 100).toFixed(0)}% success rate
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {(stats.averageConfidence * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">AI accuracy</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <SparklesIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending/Failed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.pendingAnalysis + stats.failedAnalysis}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  {stats.pendingAnalysis} pending, {stats.failedAnalysis} failed
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <ClockIcon className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Analysis History Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Analysis History</h3>
            <div className="flex items-center space-x-3">
              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="USER_CREATED">User Created</option>
                <option value="ANALYZED">Analyzed</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>

              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Extracted Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="text-gray-500">Loading history...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No analysis history found
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.fileName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatFileSize(item.fileSize)} • {item.fileType?.split('/')[1]?.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.extractedName ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{item.extractedName}</div>
                          <div className="text-gray-500">{item.extractedEmail}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {item.extractedDepartment} • {item.extractedSeniority} • {item.totalSkills} skills
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No data extracted</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                      {item.createdUsername && (
                        <div className="text-xs text-gray-500 mt-1">
                          User: {item.createdUsername}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${item.confidenceScore * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {(item.confidenceScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.processingTimeMs}ms
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatDate(item.analyzedAt)}
                      </div>
                      {item.userCreatedAt && (
                        <div className="text-xs text-green-600 mt-1">
                          User created: {formatDate(item.userCreatedAt)}
                        </div>
                      )}
                      {item.errorMessage && (
                        <div className="text-xs text-red-600 mt-1">
                          Error: {item.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedHistory(item);
                          setShowHistoryDetail(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Detail Modal */}
      {showHistoryDetail && selectedHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Analysis Details</h3>
              <button
                onClick={() => setShowHistoryDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* File Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">File Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">File Name:</span>
                    <p className="font-medium text-gray-900 mt-1">{selectedHistory.fileName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">File Size:</span>
                    <p className="font-medium text-gray-900 mt-1">{formatFileSize(selectedHistory.fileSize)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <div className="mt-1">
                      <StatusBadge status={selectedHistory.status} />
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Confidence:</span>
                    <p className="font-medium text-gray-900 mt-1">
                      {(selectedHistory.confidenceScore * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Extracted Information */}
              {selectedHistory.extractedName && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Extracted Information</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium text-gray-900 ml-2">{selectedHistory.extractedName}</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-gray-900 ml-2">{selectedHistory.extractedEmail}</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium text-gray-900 ml-2">{selectedHistory.extractedPhone}</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <BriefcaseIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <span className="text-gray-600">Department:</span>
                        <span className="font-medium text-gray-900 ml-2">{selectedHistory.extractedDepartment}</span>
                        <span className="text-gray-600 ml-2">•</span>
                        <span className="font-medium text-gray-900 ml-2">{selectedHistory.extractedSeniority}</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <ChartBarIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <span className="text-gray-600">Skills:</span>
                        <span className="font-medium text-gray-900 ml-2">{selectedHistory.totalSkills} skills identified</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* User Creation Info */}
              {selectedHistory.createdUsername && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">User Created</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Username:</span>
                      <span className="font-medium text-gray-900 ml-2">{selectedHistory.createdUsername}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Created At:</span>
                      <span className="font-medium text-gray-900 ml-2">{formatDate(selectedHistory.userCreatedAt)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="border-l-2 border-gray-200 pl-4 space-y-4">
                <div className="relative">
                  <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-blue-600"></div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">CV Analyzed</p>
                    <p className="text-gray-600">{formatDate(selectedHistory.analyzedAt)}</p>
                    <p className="text-xs text-gray-500 mt-1">Processing time: {selectedHistory.processingTimeMs}ms</p>
                  </div>
                </div>
                
                {selectedHistory.userCreatedAt && (
                  <div className="relative">
                    <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-green-600"></div>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">User Profile Created</p>
                      <p className="text-gray-600">{formatDate(selectedHistory.userCreatedAt)}</p>
                      <p className="text-xs text-gray-500 mt-1">Username: {selectedHistory.createdUsername}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowHistoryDetail(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Features Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">AI-Powered Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-gray-900">Smart Parsing</h4>
              <p className="text-sm text-gray-600 mt-1">Extract structured data from any CV format</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
            <SparklesIcon className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-gray-900">AI Analysis</h4>
              <p className="text-sm text-gray-600 mt-1">Intelligent skill extraction and proficiency scoring</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
            <PencilIcon className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-gray-900">Edit Results</h4>
              <p className="text-sm text-gray-600 mt-1">Review and modify extracted information</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg">
            <UserPlusIcon className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-gray-900">Auto Profile</h4>
              <p className="text-sm text-gray-600 mt-1">Create user profiles with one click</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVAnalysis;