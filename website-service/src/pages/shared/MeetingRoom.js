import React, { useState, useEffect, useRef } from 'react';
import {
  VideoCameraIcon,
  MicrophoneIcon,
  PhoneXMarkIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
  PlusIcon,
  ClockIcon,
  CalendarIcon,
  VideoCameraSlashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MonitorUp,
  PhoneOff,
  MoreVertical,
  Users,
  MessageSquare,
  Settings,
  Hand,
  Grid3x3,
  LayoutGrid,
  Send,
  Copy,
  Share2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';

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

const MeetingRoom = ({ role, meetingId, onClose }) => {
  const { user } = useAuth();
  const [meeting, setMeeting] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [participants, setParticipants] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // grid, speaker, sidebar
  const [handRaised, setHandRaised] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});

  useEffect(() => {
    if (meetingId) {
      loadMeetingData();
      initializeMediaDevices();
    }
    return () => {
      cleanupMediaDevices();
    };
  }, [meetingId]);

  const loadMeetingData = async () => {
    // Fetch meeting details
    // This would connect to your backend meeting service
    setMeeting({
      id: meetingId,
      title: 'Project Sprint Planning',
      meetingType: 'sprint_planning',
      remindBefore: 15,
      startTime: new Date(),
      participants: [
        { id: '1', name: 'John Doe', role: 'Project Manager', isHost: true, isMuted: false, isVideoOff: false, handRaised: false },
        { id: '2', name: 'Jane Smith', role: 'Team Lead', isHost: false, isMuted: true, isVideoOff: false, handRaised: false },
        { id: '3', name: 'Bob Johnson', role: 'Developer', isHost: false, isMuted: false, isVideoOff: true, handRaised: false },
      ]
    });
    setParticipants([
      { id: '1', name: 'John Doe', role: 'Project Manager', isHost: true, isMuted: false, isVideoOff: false, handRaised: false },
      { id: '2', name: 'Jane Smith', role: 'Team Lead', isHost: false, isMuted: true, isVideoOff: false, handRaised: false },
      { id: '3', name: 'Bob Johnson', role: 'Developer', isHost: false, isMuted: false, isVideoOff: true, handRaised: false },
    ]);
  };

  const initializeMediaDevices = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const cleanupMediaDevices = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const audioTracks = localVideoRef.current.srcObject.getAudioTracks();
      audioTracks.forEach(track => track.enabled = isMuted);
    }
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const videoTracks = localVideoRef.current.srcObject.getVideoTracks();
      videoTracks.forEach(track => track.enabled = isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true 
        });
        setIsScreenSharing(true);
        // Handle screen share stream
      } else {
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };

  const sendChatMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: Date.now(),
        sender: user.firstName + ' ' + user.lastName,
        message: chatMessage,
        timestamp: new Date()
      };
      setChatMessages([...chatMessages, newMessage]);
      setChatMessage('');
    }
  };

  const copyMeetingLink = () => {
    const link = `${window.location.origin}/meeting/${meetingId}`;
    navigator.clipboard.writeText(link);
    // Show toast notification
  };

  const leaveMeeting = () => {
    cleanupMediaDevices();
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-white font-semibold text-lg">{meeting?.title || 'Meeting Room'}</h1>
              {meeting?.meetingType && (
                <span className="px-2 py-1 bg-indigo-600/30 text-indigo-300 rounded-md text-xs font-medium">
                  {meetingTypes.find(t => t.value === meeting.meetingType)?.label || meeting.meetingType}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3 mt-1">
              <div className="flex items-center space-x-2 text-gray-400 dark:text-gray-500 text-xs">
                <ClockIcon className="h-3 w-3" />
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
              {recordingStatus && (
                <div className="flex items-center space-x-2 text-red-400 text-xs animate-pulse">
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                  <span>Recording</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={copyMeetingLink}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Share2 className="h-4 w-4" />
            <span>Share Link</span>
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className={`grid gap-4 h-full ${
            viewMode === 'grid' 
              ? participants.length <= 2 ? 'grid-cols-2' : participants.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
              : 'grid-cols-1'
          }`}>
            {/* Local Video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-3xl font-semibold">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 left-3 flex items-center space-x-2">
                <span className="bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                  You {handRaised && '✋'}
                </span>
                {isMuted && (
                  <div className="bg-red-600 p-1.5 rounded-full">
                    <MicOff className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Remote Videos */}
            {participants.map((participant) => (
              <div key={participant.id} className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                {!participant.isVideoOff ? (
                  <video
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-3xl font-semibold">
                        {participant.name.split(' ').map(n => n.charAt(0)).join('')}
                      </span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 flex items-center space-x-2">
                  <span className="bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                    {participant.name} {participant.handRaised && '✋'}
                  </span>
                  {participant.isMuted && (
                    <div className="bg-red-600 p-1.5 rounded-full">
                      <MicOff className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {participant.isHost && (
                    <div className="bg-blue-600 px-2 py-0.5 rounded text-xs text-white">
                      Host
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar - Chat/Participants */}
        {(showChat || showParticipants) && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => { setShowChat(true); setShowParticipants(false); }}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  showChat ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat</span>
                </div>
              </button>
              <button
                onClick={() => { setShowParticipants(true); setShowChat(false); }}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  showParticipants ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Participants ({participants.length + 1})</span>
                </div>
              </button>
            </div>

            {/* Chat Panel */}
            {showChat && (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="space-y-1">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-sm font-medium text-white">{msg.sender}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{msg.message}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-700">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={sendChatMessage}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Participants Panel */}
            {showParticipants && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {/* Host */}
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">Host</h3>
                  {participants.filter(p => p.isHost).map((participant) => (
                    <ParticipantItem key={participant.id} participant={participant} isHost />
                  ))}
                </div>
                
                {/* Other Participants */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">
                    Participants ({participants.filter(p => !p.isHost).length + 1})
                  </h3>
                  <ParticipantItem 
                    participant={{ 
                      name: `${user.firstName} ${user.lastName}`, 
                      role: role,
                      isMuted, 
                      isVideoOff,
                      handRaised
                    }} 
                    isYou 
                  />
                  {participants.filter(p => !p.isHost).map((participant) => (
                    <ParticipantItem key={participant.id} participant={participant} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className={`p-3 rounded-full transition-colors ${
                isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isMuted ? (
                <MicOff className="h-5 w-5 text-white" />
              ) : (
                <Mic className="h-5 w-5 text-white" />
              )}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full transition-colors ${
                isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isVideoOff ? (
                <VideoOff className="h-5 w-5 text-white" />
              ) : (
                <VideoIcon className="h-5 w-5 text-white" />
              )}
            </button>
            <button
              onClick={toggleScreenShare}
              className={`p-3 rounded-full transition-colors ${
                isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <MonitorUp className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Center Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setHandRaised(!handRaised)}
              className={`p-3 rounded-full transition-colors ${
                handRaised ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title="Raise hand"
            >
              <Hand className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
              className={`p-3 rounded-full transition-colors ${
                showChat ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <MessageSquare className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
              className={`p-3 rounded-full transition-colors ${
                showParticipants ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Users className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'speaker' : 'grid')}
              className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
              title="Change layout"
            >
              {viewMode === 'grid' ? (
                <LayoutGrid className="h-5 w-5 text-white" />
              ) : (
                <Grid3x3 className="h-5 w-5 text-white" />
              )}
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={leaveMeeting}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-colors flex items-center space-x-2"
            >
              <PhoneOff className="h-5 w-5" />
              <span>Leave</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Participant Item Component
const ParticipantItem = ({ participant, isHost, isYou }) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-700 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-sm">
            {participant.name.split(' ').map(n => n.charAt(0)).join('')}
          </span>
        </div>
        <div>
          <p className="text-white font-medium text-sm">
            {participant.name} {isYou && '(You)'}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs">{participant.role}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {participant.handRaised && (
          <span className="text-yellow-400">✋</span>
        )}
        {participant.isMuted ? (
          <MicOff className="h-4 w-4 text-red-400" />
        ) : (
          <Mic className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        )}
        {participant.isVideoOff && (
          <VideoOff className="h-4 w-4 text-red-400" />
        )}
        {isHost && (
          <span className="bg-blue-600 px-2 py-0.5 rounded text-xs text-white">Host</span>
        )}
      </div>
    </div>
  );
};

export default MeetingRoom;
