import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  VideoCameraIcon,
  CheckIcon,
  SparklesIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Users, Search, X, Bell } from 'lucide-react';
import { apiService } from '../services/apiService';

const meetingTypes = [
  { value: 'daily_standup', label: '🏃 Daily Standup', desc: 'Quick daily sync' },
  { value: 'sprint_planning', label: '📋 Sprint Planning', desc: 'Plan sprint tasks' },
  { value: 'sprint_review', label: '🎯 Sprint Review', desc: 'Demo completed work' },
  { value: 'sprint_retro', label: '🔄 Sprint Retrospective', desc: 'Reflect and improve' },
  { value: 'client_meeting', label: '🤝 Client Meeting', desc: 'Meet with clients' },
  { value: 'technical_discussion', label: '💻 Technical Discussion', desc: 'Technical deep dive' },
  { value: 'code_review', label: '👨‍💻 Code Review', desc: 'Review code together' },
  { value: 'team_meeting', label: '👥 Team Meeting', desc: 'General team discussion' },
  { value: 'one_on_one', label: '🗣️ One-on-One', desc: 'Private discussion' },
  { value: 'brainstorming', label: '💡 Brainstorming', desc: 'Creative session' }
];

const CreateMeetingModal = ({ isOpen, onClose, onCreate, projectId }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    duration: 60,
    projectId: projectId || '',
    meetingType: 'team_meeting',
    remindBefore: 15,
  });
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      fetchAvailableUsers();
      
      // Set default start time to now
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5); // 5 minutes from now
      setFormData(prev => ({
        ...prev,
        startTime: now.toISOString().slice(0, 16)
      }));
    }
  }, [isOpen]);

  const fetchProjects = async () => {
    try {
      const response = await apiService.getProjects();
      console.log('Fetched projects:', response);
      if (response?.result) {
        setProjects(response.result);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await apiService.getAllUsers();
      if (response?.result) {
        setAvailableUsers(response.result);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a meeting title');
      return;
    }

    if (selectedParticipants.length === 0) {
      alert('Please select at least one participant');
      return;
    }

    setLoading(true);
    try {
      const meetingData = {
        ...formData,
        participantIds: selectedParticipants.map(p => p.id)
      };
      
      await onCreate(meetingData);
      onClose();
    } catch (error) {
      console.error('Error creating meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (user) => {
    setSelectedParticipants(prev => {
      const exists = prev.find(p => p.id === user.id);
      if (exists) {
        return prev.filter(p => p.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const filteredUsers = availableUsers.filter(user =>
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900/50 via-blue-900/30 to-purple-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden transform transition-all animate-slideUp">
        {/* Header with Gradient */}
        <div className="relative px-8 py-6 bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white dark:bg-gray-800 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white dark:bg-gray-800 rounded-full translate-x-1/2 translate-y-1/2"></div>
          </div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white dark:bg-gray-800/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg"> <VideoCameraIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                  <span>Create New Meeting</span>
                  <SparklesIcon className="h-5 w-5 animate-pulse" />
                </h2>
                <p className="text-blue-100 text-sm mt-1">Schedule your next video conference</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white dark:bg-gray-800/10 hover:bg-white dark:bg-gray-800/20 backdrop-blur-sm rounded-xl text-white transition-all duration-300 flex items-center justify-center hover:rotate-90"> <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto" style={{ maxHeight: 'calc(95vh - 200px)' }}>
          <div className="p-8 space-y-6 bg-gradient-to-b from-gray-50 to-white">
            {/* Meeting Title - Enhanced */}
            <div className="group">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">1</span>
                </div>
                <span>Meeting Title</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Sprint Planning, Team Standup, Client Review..."
                className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 placeholder:text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:border-gray-600"
                required
              />
            </div>

            {/* Meeting Type - NEW */}
            <div className="group">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">🎯</span>
                </div>
                <span>Meeting Type</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {meetingTypes.map((type) => (
                  <div
                    key={type.value}
                    onClick={() => setFormData({ ...formData, meetingType: type.value })}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
                      formData.meetingType === type.value
                        ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{type.label}</span>
                      {formData.meetingType === type.value && (
                        <CheckIcon className="h-5 w-5 text-indigo-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{type.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description - Enhanced */}
            <div className="group">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="h-4 w-4 text-white" />
                </div>
                <span>Description & Agenda</span>
                <span className="text-gray-400 dark:text-gray-500 text-xs font-normal">(Optional)</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add meeting agenda, topics to discuss, or any important notes..."
                rows={4}
                className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-300 placeholder:text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:border-gray-600 resize-none"
              />
            </div>

            {/* Project Selection - Enhanced */}
            <div className="group">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">📁</span>
                </div>
                <span>Link to Project</span>
                <span className="text-gray-400 dark:text-gray-500 text-xs font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all duration-300 appearance-none cursor-pointer hover:border-gray-300 dark:border-gray-600"
                >
                  <option value="">🔍 Select a project...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Date and Time - Enhanced Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <CalendarIcon className="h-5 w-5 text-blue-500" />
                  <span>Start Date & Time</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 hover:border-gray-300 dark:border-gray-600"
                    required
                  />
                </div>
              </div>
              <div className="group">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <ClockIcon className="h-5 w-5 text-purple-500" />
                  <span>Duration</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all duration-300 appearance-none cursor-pointer hover:border-gray-300 dark:border-gray-600"
                  >
                    <option value={15}>⚡ 15 minutes (Quick sync)</option>
                    <option value={30}>🕐 30 minutes (Short meeting)</option>
                    <option value={60}>⏰ 1 hour (Standard)</option>
                    <option value={90}>📊 1.5 hours (Deep dive)</option>
                    <option value={120}>🎯 2 hours (Workshop)</option>
                    <option value={180}>📚 3 hours (Extended)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Reminder - NEW */}
            <div className="group">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Bell className="h-4 w-4 text-white" />
                </div>
                <span>Remind Me Before</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 5, label: '5 min' },
                  { value: 10, label: '10 min' },
                  { value: 15, label: '15 min' },
                  { value: 30, label: '30 min' },
                  { value: 60, label: '1 hour' },
                  { value: 120, label: '2 hours' },
                  { value: 1440, label: '1 day' },
                  { value: 0, label: 'No reminder' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, remindBefore: option.value })}
                    className={`px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all duration-300 ${
                      formData.remindBefore === option.value
                        ? 'border-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-700 shadow-md'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    {option.value === 0 ? '🔕' : '🔔'} {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Participants Selection - Enhanced */}
            <div className="group">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <span>Invite Participants</span>
                <span className="text-red-500">*</span>
                {selectedParticipants.length > 0 && (
                  <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                    {selectedParticipants.length} selected
                  </span>
                )}
              </label>
              
              {/* Search - Enhanced */}
              <div className="relative mb-4">
                <Search className="h-5 w-5 text-gray-400 dark:text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or username..."
                  className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 placeholder:text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:border-gray-600"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Selected Participants - Enhanced Pills */}
              {selectedParticipants.length > 0 && (
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Selected participants</span>
                    <button
                      type="button"
                      onClick={() => setSelectedParticipants([])}
                      className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedParticipants.map((user) => (
                      <div
                        key={user.id}
                        className="group flex items-center space-x-2 bg-white dark:bg-gray-800 hover:bg-blue-50 border-2 border-blue-200 px-3 py-2 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-xs">
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {user.firstName} {user.lastName}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleParticipant(user)}
                          className="text-gray-400 dark:text-gray-500 hover:text-red-600 transition-colors ml-2"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Users List - Enhanced Cards */}
              <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium">No users found</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try adjusting your search</p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto custom-scrollbar">
                    {filteredUsers.map((user) => {
                      const isSelected = selectedParticipants.find(p => p.id === user.id);
                      return (
                        <div
                          key={user.id}
                          onClick={() => toggleParticipant(user)}
                          className={`p-4 cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border-b border-gray-100 last:border-b-0 ${
                            isSelected ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-l-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                isSelected 
                                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg scale-110' 
                                  : 'bg-gradient-to-br from-gray-400 to-gray-500'
                              }`}>
                                <span className="text-white font-semibold">
                                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 truncate">{user.role || 'Team Member'}</p>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="ml-3 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center animate-bounce">
                                <CheckIcon className="h-5 w-5 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer - Enhanced */}
          <div className="sticky bottom-0 px-8 py-5 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {selectedParticipants.length} participant{selectedParticipants.length !== 1 ? 's' : ''} invited
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">They will receive a meeting invitation</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:bg-gray-900 hover:border-gray-400 transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title || selectedParticipants.length === 0}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <VideoCameraIcon className="h-5 w-5" />
                    <span>Create Meeting</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CreateMeetingModal;
