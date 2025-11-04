import React, { useState, useEffect } from 'react';
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  BriefcaseIcon,
  CalendarIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
  ShieldCheckIcon,
  ClockIcon,
  ChartBarIcon,
  AcademicCapIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';


const ProfilePage = () => {
  const { user, getUserRole, checkAuth } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Profile data from profile service
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    city: '',
    dob: '',
    avatar: '',
    skills: [],
    availabilityStatus: '',
    averageTaskCompletionRate: 0,
    totalTasksCompleted: 0,
    currentWorkLoadHours: 0
  });

  // User data from identity service (read-only)
  const [userData, setUserData] = useState({
    roleName: '',
    departmentName: '',
    positionTitle: '',
    seniorityLevel: '',
    performanceScore: 0,
    createdAt: '',
    employeeId: ''
  });

  // Password change data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const userRole = getUserRole();

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch user info from identity service
      const userResponse = await apiService.getProfile();
      const userInfo = userResponse.result;
      
      setUserData({
        roleName: userInfo.roleName || '',
        departmentName: userInfo.departmentName || '',
        positionTitle: userInfo.positionTitle || '',
        seniorityLevel: userInfo.seniorityLevel || '',
        performanceScore: userInfo.performanceScore || 0,
        createdAt: userInfo.createdAt || '',
        employeeId: userInfo.employeeId || ''
      });
      
      // Fetch profile from profile service
      try {
        const profileResponse = await apiService.getMyProfile();
        const profile = profileResponse.result;
        
        setProfileData({
          firstName: userInfo.firstName || '',
          lastName: userInfo.lastName || '',
          email: userInfo.email || '',
          phoneNumber: userInfo.phoneNumber || '',
          city: profile.city || '',
          dob: profile.dob || '',
          avatar: profile.avatar || '',
          skills: profile.skills || [],
          availabilityStatus: profile.availabilityStatus || 'AVAILABLE',
          averageTaskCompletionRate: profile.averageTaskCompletionRate || 0,
          totalTasksCompleted: profile.totalTasksCompleted || 0,
          currentWorkLoadHours: profile.currentWorkLoadHours || 0
        });
      } catch (profileError) {
        // Profile might not exist yet, use default values
        console.log('Profile not found, using user info only');
        setProfileData(prev => ({
          ...prev,
          firstName: userInfo.firstName || '',
          lastName: userInfo.lastName || '',
          email: userInfo.email || '',
          phoneNumber: userInfo.phoneNumber || ''
        }));
      }
      
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'ADMIN': 'from-red-500 to-pink-600',
      'PROJECT_MANAGER': 'from-blue-500 to-indigo-600',
      'TEAM_LEAD': 'from-purple-500 to-pink-600',
      'EMPLOYEE': 'from-green-500 to-teal-600',
      'USER': 'from-gray-500 to-gray-600'
    };
    return colors[role] || colors['USER'];
  };

  const getAvailabilityColor = (status) => {
    const colors = {
      'AVAILABLE': 'bg-green-100 text-green-800',
      'BUSY': 'bg-yellow-100 text-yellow-800',
      'UNAVAILABLE': 'bg-red-100 text-red-800'
    };
    return colors[status] || colors['AVAILABLE'];
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update profile in profile service
      const updateData = {
        city: profileData.city,
        dob: profileData.dob,
        avatar: profileData.avatar
      };
      
      await apiService.updateMyProfile(updateData);
      
      // Update user info in identity service
      const userUpdateData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phoneNumber
      };
      
      await apiService.updateProfile(user.id, userUpdateData);
      
      setIsEditing(false);
      
      // Refresh auth context to update user name
      await checkAuth();
      
      // Refresh profile data
      await fetchProfileData();
      
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    fetchProfileData();
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    console.log("File upload:", file);
    
    if (file) {
        // Validate file size (max 5MB)
        if (file.size > 10 * 1024 * 1024) {
            return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            return;
        }
        
        try {
            setUploadingAvatar(true);
            
            const formData = new FormData();
            formData.append('file', file);
            
            // Upload avatar
            const response = await apiService.uploadFile(formData);
            console.log("File upload sucess: ", response);
            
            // Update local state with new avatar URL
            setProfileData(prev => ({
                ...prev,
                avatar: response.result.url
            }));
            const updateData = {avatar: response.result.url};    
            await apiService.updateMyProfile(updateData);
        } catch (error) {
            console.error('Error uploading avatar:', error);
        } finally {
            setUploadingAvatar(false);
        }
        }
    };  // <-- Chỉ một dấu }; ở đây

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const calculateDaysWorking = (createdAt) => {
    if (!createdAt) return 0;
    const start = new Date(createdAt);
    const today = new Date();
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getSkillTypeColor = (type) => {
    const colors = {
      'TECHNICAL': 'bg-blue-100 text-blue-800',
      'SOFT_SKILL': 'bg-purple-100 text-purple-800',
      'LANGUAGE': 'bg-green-100 text-green-800',
      'TOOL': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getProficiencyColor = (level) => {
    const colors = {
      'BEGINNER': 'bg-gray-100 text-gray-800',
      'INTERMEDIATE': 'bg-blue-100 text-blue-800',
      'ADVANCED': 'bg-purple-100 text-purple-800',
      'EXPERT': 'bg-yellow-100 text-yellow-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const handleChangePassword = async () => {
    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New password and confirm password do not match');
      return;
    }

    // Validate password length
    if (passwordData.newPassword.length < 8) {
      alert('New password must be at least 8 characters long');
      return;
    }

    // Validate all fields are filled
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert('Please fill in all password fields');
      return;
    }

    try {
      setSaving(true);

      // Change password using the correct API method signature
      await apiService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });

      // Clear password fields on success
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      alert('Password changed successfully!');

    } catch (error) {
      console.error('Error changing password:', error);

      // Handle specific error messages from backend
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert('Failed to change password. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  console.log("Profile data:" , profileData);
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-gray-600 mt-2">Manage your personal information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-white/20 backdrop-blur-sm animate-slideInFromLeft">
              {/* Cover Image */}
              <div className="h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 relative">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                      {profileData.avatar ? (
                        <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl font-bold text-white">
                          {profileData.firstName?.charAt(0).toUpperCase()}{profileData.lastName?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-all duration-300 hover:scale-110">
                      {uploadingAvatar ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <CameraIcon className="w-5 h-5" />
                      )}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleAvatarChange}
                        disabled={uploadingAvatar}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="pt-20 pb-6 px-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {profileData.firstName} {profileData.lastName}
                </h2>
                <p className="text-sm text-gray-600 mb-3">
                  {userData.employeeId && `Employee ID: ${userData.employeeId}`}
                </p>
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${getRoleBadgeColor(userRole)} text-white shadow-lg mb-2`}>
                  <ShieldCheckIcon className="w-4 h-4 mr-2" />
                  {userData.roleName?.replace('_', ' ')}
                </div>
                
                {profileData.availabilityStatus && (
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(profileData.availabilityStatus)}`}>
                      {profileData.availabilityStatus}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <PencilIcon className="w-5 h-5" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <CheckIcon className="w-5 h-5" />
                          <span>Save</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XMarkIcon className="w-5 h-5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <ClockIcon className="w-5 h-5 text-blue-600 mr-1" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {calculateDaysWorking(userData.createdAt)}
                    </p>
                    <p className="text-xs text-gray-600">Days Working</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <ChartBarIcon className="w-5 h-5 text-purple-600 mr-1" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {userData.performanceScore?.toFixed(0) || 0}%
                    </p>
                    <p className="text-xs text-gray-600">Performance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/20 backdrop-blur-sm animate-slideInFromRight">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <UserCircleIcon className="w-6 h-6 mr-2 text-blue-600" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  {!isEditing ? (
                    <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl">
                      <UserCircleIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{profileData.firstName}</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  {!isEditing ? (
                    <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl">
                      <UserCircleIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{profileData.lastName}</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gray-100 rounded-xl cursor-not-allowed">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-500">{profileData.email}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {!isEditing ? (
                    <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl">
                      <PhoneIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{profileData.phoneNumber || 'Not set'}</span>
                    </div>
                  ) : (
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={profileData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="+84 123 456 789"
                    />
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  {!isEditing ? (
                    <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl">
                      <MapPinIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{profileData.city || 'Not set'}</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      name="city"
                      value={profileData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Ho Chi Minh City"
                    />
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  {!isEditing ? (
                    <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{profileData.dob ? formatDate(profileData.dob) : 'Not set'}</span>
                    </div>
                  ) : (
                    <input
                      type="date"
                      name="dob"
                      value={profileData.dob}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    />
                  )}
                </div>

                {/* Department - Read Only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gray-100 rounded-xl cursor-not-allowed">
                    <BriefcaseIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-500">{userData.departmentName || 'Not assigned'}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Managed by admin</p>
                </div>

                {/* Position - Read Only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gray-100 rounded-xl cursor-not-allowed">
                    <BriefcaseIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-500">{userData.positionTitle || 'Not assigned'}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Managed by admin</p>
                </div>
              </div>
            </div>

            {/* Skills Section */}
            {profileData.skills && profileData.skills.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/20 backdrop-blur-sm animate-slideInFromRight animation-delay-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <AcademicCapIcon className="w-6 h-6 mr-2 text-purple-600" />
                  Skills & Expertise
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profileData.skills.map((skill, index) => (
                    <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{skill.skillName}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${getSkillTypeColor(skill.skillType)}`}>
                          {skill.skillType?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={`px-2 py-1 rounded-full ${getProficiencyColor(skill.proficiencyLevel)}`}>
                          {skill.proficiencyLevel}
                        </span>
                        {skill.yearsOfExperience && (
                          <span className="text-gray-600">
                            {skill.yearsOfExperience} {skill.yearsOfExperience === 1 ? 'year' : 'years'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Overview */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/20 backdrop-blur-sm animate-slideInFromRight animation-delay-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <ChartBarIcon className="w-6 h-6 mr-2 text-purple-600" />
                Activity Overview
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm font-medium text-gray-600 mb-1">Tasks Completed</p>
                  <p className="text-3xl font-bold text-blue-600">{profileData.totalTasksCompleted || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Total tasks</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                  <p className="text-sm font-medium text-gray-600 mb-1">Completion Rate</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {profileData.averageTaskCompletionRate?.toFixed(0) || 0}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Average rate</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                  <p className="text-sm font-medium text-gray-600 mb-1">Current Workload</p>
                  <p className="text-3xl font-bold text-green-600">{profileData.currentWorkLoadHours || 0}h</p>
                  <p className="text-xs text-gray-500 mt-1">This week</p>
                </div>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/20 backdrop-blur-sm animate-slideInFromRight animation-delay-300">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <KeyIcon className="w-6 h-6 mr-2 text-green-600" />
                Change Password
              </h3>

              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl">
                    <LockClosedIcon className="w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter current password"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-500 hover:text-gray-700 transition-all duration-300"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl">
                    <LockOpenIcon className="w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter new password"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-500 hover:text-gray-700 transition-all duration-300"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl">
                    <LockOpenIcon className="w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Confirm new password"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-500 hover:text-gray-700 transition-all duration-300"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Save Password Button */}
                <div>
                  <button
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <CheckIcon className="w-5 h-5" />
                        <span>Change Password</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        
        .animate-slideInFromLeft {
          animation: slideInFromLeft 0.6s ease-out;
        }
        
        .animate-slideInFromRight {
          animation: slideInFromRight 0.6s ease-out;
        }
        
        .animation-delay-100 {
          animation-delay: 0.1s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
