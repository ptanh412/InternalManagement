import React, { useState, useEffect } from 'react';
import {
  VideoCameraIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  EllipsisVerticalIcon,
  PlayIcon,
  TrashIcon,
  PencilIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Users, Clock, Video, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';
import CreateMeetingModal from '../../components/CreateMeetingModal';
import MeetingRoom from './MeetingRoom';

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

const MeetingsPage = ({ role }) => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [filteredMeetings, setFilteredMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, upcoming, ongoing, past
  const [selectedProject, setSelectedProject] = useState('all');
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadMeetings();
    loadProjects();
  }, []);

  useEffect(() => {
    filterMeetings();
  }, [meetings, searchTerm, filterStatus, selectedProject]);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      // This would call your backend API
      // const response = await apiService.getMeetings();
      
      // Mock data for demonstration
      const mockMeetings = [
        {
          id: '1',
          title: 'Sprint Planning',
          description: 'Planning for Sprint 5',
          startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          endTime: new Date(Date.now() + 7200000).toISOString(),
          duration: 60,
          status: 'upcoming',
          meetingType: 'sprint_planning',
          remindBefore: 15,
          projectId: 'proj1',
          projectName: 'E-commerce Platform',
          hostId: user.id,
          hostName: `${user.firstName} ${user.lastName}`,
          participants: [
            { id: '1', name: 'John Doe', role: 'Developer', avatar: null },
            { id: '2', name: 'Jane Smith', role: 'Designer', avatar: null },
            { id: '3', name: 'Bob Johnson', role: 'QA', avatar: null },
          ],
          meetingLink: 'https://meet.example.com/abc123'
        },
        {
          id: '2',
          title: 'Daily Standup',
          description: 'Team daily sync',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 900000).toISOString(),
          duration: 15,
          status: 'ongoing',
          meetingType: 'daily_standup',
          remindBefore: 5,
          projectId: 'proj1',
          projectName: 'E-commerce Platform',
          hostId: user.id,
          hostName: `${user.firstName} ${user.lastName}`,
          participants: [
            { id: '1', name: 'John Doe', role: 'Developer', avatar: null },
            { id: '2', name: 'Jane Smith', role: 'Designer', avatar: null },
          ],
          meetingLink: 'https://meet.example.com/daily123'
        },
        {
          id: '3',
          title: 'Client Review',
          description: 'Demo to client',
          startTime: new Date(Date.now() - 3600000).toISOString(),
          endTime: new Date(Date.now() - 1800000).toISOString(),
          duration: 30,
          status: 'past',
          meetingType: 'client_meeting',
          remindBefore: 30,
          projectId: 'proj2',
          projectName: 'Mobile App',
          hostId: 'other-user',
          hostName: 'Alice Manager',
          participants: [
            { id: '4', name: 'Client Rep', role: 'Client', avatar: null },
          ],
          meetingLink: 'https://meet.example.com/review123'
        }
      ];
      
      setMeetings(mockMeetings);
    } catch (error) {
      console.error('Error loading meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await apiService.getProjects();
      if (response?.result) {
        setProjects(response.result);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const filterMeetings = () => {
    let filtered = [...meetings];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(meeting =>
        meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meeting.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(meeting => meeting.status === filterStatus);
    }

    // Filter by project
    if (selectedProject !== 'all') {
      filtered = filtered.filter(meeting => meeting.projectId === selectedProject);
    }

    setFilteredMeetings(filtered);
  };

  const handleCreateMeeting = async (meetingData) => {
    try {
      // Call API to create meeting
      // const response = await apiService.createMeeting(meetingData);
      
      console.log('Creating meeting:', meetingData);
      
      // Refresh meetings list
      await loadMeetings();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating meeting:', error);
    }
  };

  const handleJoinMeeting = (meetingId) => {
    setActiveMeeting(meetingId);
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      try {
        // await apiService.deleteMeeting(meetingId);
        await loadMeetings();
      } catch (error) {
        console.error('Error deleting meeting:', error);
      }
    }
  };

  const getMeetingStatusBadge = (status) => {
    const styles = {
      upcoming: 'bg-blue-100 text-blue-700',
      ongoing: 'bg-green-100 text-green-700',
      past: 'bg-gray-100 text-gray-700'
    };
    const labels = {
      upcoming: 'Upcoming',
      ongoing: 'Live',
      past: 'Ended'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (activeMeeting) {
    return (
      <MeetingRoom 
        role={role} 
        meetingId={activeMeeting} 
        onClose={() => setActiveMeeting(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Meetings</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Manage and join your video meetings</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="font-medium">New Meeting</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search meetings..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select>
              </div>

              {/* Project Filter */}
              <div>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="all">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Meetings List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <ArrowPathIcon className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <VideoCameraIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No meetings found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {searchTerm || filterStatus !== 'all' || selectedProject !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first meeting to get started'}
            </p>
            {!searchTerm && filterStatus === 'all' && selectedProject === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Meeting
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onJoin={handleJoinMeeting}
                onDelete={handleDeleteMeeting}
                currentUserId={user.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <CreateMeetingModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateMeeting}
        />
      )}
    </div>
  );
};

// Meeting Card Component
const MeetingCard = ({ meeting, onJoin, onDelete, currentUserId }) => {
  const [showMenu, setShowMenu] = useState(false);
  const isHost = meeting.hostId === currentUserId;
  const canJoin = meeting.status === 'ongoing' || meeting.status === 'upcoming';

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getMeetingStatusBadge = (status) => {
    const styles = {
      upcoming: 'bg-blue-100 text-blue-700',
      ongoing: 'bg-green-100 text-green-700 animate-pulse',
      past: 'bg-gray-100 text-gray-700'
    };
    const labels = {
      upcoming: 'Upcoming',
      ongoing: '● Live',
      past: 'Ended'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{meeting.title}</h3>
              {getMeetingStatusBadge(meeting.status)}
            </div>
            {meeting.description && (
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">{meeting.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(meeting.startTime)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{formatTime(meeting.startTime)} ({meeting.duration} min)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {meeting.meetingType && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                  {meetingTypes.find(t => t.value === meeting.meetingType)?.label || meeting.meetingType}
                </span>
              )}
              {meeting.projectName && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  📁 {meeting.projectName}
                </span>
              )}
              {meeting.remindBefore > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                  🔔 {meeting.remindBefore >= 60 ? `${meeting.remindBefore / 60}h` : `${meeting.remindBefore}m`} reminder
                </span>
              )}
            </div>
          </div>
          <div className="relative ml-4">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors"
            >
              <EllipsisVerticalIcon className="h-5 w-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(meeting.meetingLink);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800"
                >
                  Copy meeting link
                </button>
                {isHost && (
                  <>
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800"
                    >
                      Edit meeting
                    </button>
                    <button
                      onClick={() => {
                        onDelete(meeting.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:bg-gray-800"
                    >
                      Delete meeting
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Participants Preview */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex -space-x-2">
            {meeting.participants.slice(0, 5).map((participant, index) => (
              <div
                key={index}
                className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white"
                title={participant.name}
              >
                <span className="text-white text-xs font-semibold">
                  {participant.name.split(' ').map(n => n.charAt(0)).join('')}
                </span>
              </div>
            ))}
            {meeting.participants.length > 5 && (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-gray-600 dark:text-gray-300 text-xs font-semibold">
                  +{meeting.participants.length - 5}
                </span>
              </div>
            )}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
            Hosted by {meeting.hostName}
          </span>
        </div>

        {/* Action Button */}
        {canJoin && (
          <button
            onClick={() => onJoin(meeting.id)}
            className={`w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
              meeting.status === 'ongoing'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Video className="h-5 w-5" />
            <span>{meeting.status === 'ongoing' ? 'Join Now' : 'Join Meeting'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MeetingsPage;
