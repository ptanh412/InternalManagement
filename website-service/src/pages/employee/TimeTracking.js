import React, { useState, useEffect } from 'react';
import { 
  ClockIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

const TimeTracking = () => {
  const { user } = useAuth();
  const [timeEntries, setTimeEntries] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weekStats, setWeekStats] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    loadTimeEntries();
    loadWeekStats();
  }, [selectedDate]);

  const loadTimeEntries = async () => {
    try {
      setLoading(true);
      // API call to get time entries for the user and date
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockEntries = [
        {
          id: 'entry-1',
          taskId: 'task-1',
          taskTitle: 'Implement user authentication',
          projectName: 'Mobile Banking App',
          startTime: '2024-10-14T09:00:00',
          endTime: '2024-10-14T12:30:00',
          duration: 3.5,
          description: 'Working on OAuth 2.0 implementation and JWT token handling',
          date: '2024-10-14',
          isRunning: false
        },
        {
          id: 'entry-2',
          taskId: 'task-2',
          taskTitle: 'Fix responsive design issues',
          projectName: 'E-commerce Platform',
          startTime: '2024-10-14T14:00:00',
          endTime: '2024-10-14T16:15:00',
          duration: 2.25,
          description: 'Fixed mobile layout problems on product pages',
          date: '2024-10-14',
          isRunning: false
        },
        {
          id: 'entry-3',
          taskId: 'task-1',
          taskTitle: 'Implement user authentication',
          projectName: 'Mobile Banking App',
          startTime: '2024-10-14T16:30:00',
          endTime: null,
          duration: 0,
          description: 'Testing authentication flow',
          date: '2024-10-14',
          isRunning: true
        }
      ];

      // Filter by selected date
      const filteredEntries = mockEntries.filter(entry => entry.date === selectedDate);
      setTimeEntries(filteredEntries);
      
      // Set active timer if any
      const runningEntry = filteredEntries.find(entry => entry.isRunning);
      if (runningEntry) {
        setActiveTimer(runningEntry.id);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load time entries:', error);
      setLoading(false);
    }
  };

  const loadWeekStats = async () => {
    try {
      // API call to get weekly statistics
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setWeekStats({
        totalHours: 38.5,
        targetHours: 40,
        todayHours: 7.25,
        averageDaily: 7.7,
        mostProductiveDay: 'Wednesday',
        tasksWorkedOn: 8,
        projectsInvolved: 3
      });
    } catch (error) {
      console.error('Failed to load week stats:', error);
    }
  };

  const handleStartTimer = (taskId, taskTitle, projectName) => {
    const newEntry = {
      id: `entry-${Date.now()}`,
      taskId,
      taskTitle,
      projectName,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
      description: '',
      date: selectedDate,
      isRunning: true
    };

    setTimeEntries([...timeEntries, newEntry]);
    setActiveTimer(newEntry.id);
  };

  const handleStopTimer = (entryId) => {
    const updatedEntries = timeEntries.map(entry => {
      if (entry.id === entryId && entry.isRunning) {
        const endTime = new Date().toISOString();
        const duration = (new Date(endTime) - new Date(entry.startTime)) / (1000 * 60 * 60);
        return {
          ...entry,
          endTime,
          duration: Math.round(duration * 100) / 100,
          isRunning: false
        };
      }
      return entry;
    });

    setTimeEntries(updatedEntries);
    setActiveTimer(null);
  };

  const handleDeleteEntry = async (entryId) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      try {
        // API call to delete time entry
        setTimeEntries(timeEntries.filter(entry => entry.id !== entryId));
      } catch (error) {
        console.error('Failed to delete time entry:', error);
      }
    }
  };

  const handleUpdateEntry = async (entryId, updatedData) => {
    try {
      // API call to update time entry
      setTimeEntries(timeEntries.map(entry => 
        entry.id === entryId ? { ...entry, ...updatedData } : entry
      ));
    } catch (error) {
      console.error('Failed to update time entry:', error);
    }
  };

  const formatDuration = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getTotalHoursForDay = () => {
    return timeEntries.reduce((total, entry) => total + (entry.duration || 0), 0);
  };

  const getRunningEntryDuration = (entry) => {
    if (!entry.isRunning) return entry.duration;
    
    const now = new Date();
    const start = new Date(entry.startTime);
    const duration = (now - start) / (1000 * 60 * 60);
    return Math.round(duration * 100) / 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
              <p className="text-gray-600 mt-2">
                Track your work hours and manage time entries
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Entry
            </button>
          </div>
        </div>

        {/* Week Statistics */}
        {weekStats && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Weekly Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">{weekStats.totalHours}h</div>
                <div className="text-sm text-gray-600">Total This Week</div>
                <div className="text-xs text-gray-500">Target: {weekStats.targetHours}h</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{weekStats.todayHours}h</div>
                <div className="text-sm text-gray-600">Today</div>
                <div className="text-xs text-gray-500">Avg: {weekStats.averageDaily}h</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{weekStats.tasksWorkedOn}</div>
                <div className="text-sm text-gray-600">Tasks</div>
                <div className="text-xs text-gray-500">{weekStats.projectsInvolved} projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{weekStats.mostProductiveDay}</div>
                <div className="text-sm text-gray-600">Most Productive</div>
                <div className="text-xs text-gray-500">This Week</div>
              </div>
            </div>
          </div>
        )}

        {/* Date Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {formatDuration(getTotalHoursForDay())}
              </div>
              <div className="text-sm text-gray-600">Total for {selectedDate}</div>
            </div>
          </div>
        </div>

        {/* Active Timer */}
        {activeTimer && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Timer Running</h3>
                <div className="text-green-100">
                  {timeEntries.find(entry => entry.id === activeTimer)?.taskTitle}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-bold">
                  {formatDuration(getRunningEntryDuration(timeEntries.find(entry => entry.id === activeTimer)))}
                </div>
                <button
                  onClick={() => handleStopTimer(activeTimer)}
                  className="flex items-center bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50"
                >
                  <StopIcon className="h-4 w-4 mr-2" />
                  Stop Timer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Time Entries */}
        <div className="space-y-4">
          {timeEntries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{entry.taskTitle}</h3>
                    {entry.isRunning && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                        RUNNING
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{entry.projectName}</p>

                  {entry.description && (
                    <p className="text-sm text-gray-600 mb-3">{entry.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <PlayIcon className="h-4 w-4 mr-2" />
                      <span>Start: {formatTime(entry.startTime)}</span>
                    </div>
                    <div className="flex items-center">
                      {entry.endTime ? (
                        <>
                          <PauseIcon className="h-4 w-4 mr-2" />
                          <span>End: {formatTime(entry.endTime)}</span>
                        </>
                      ) : (
                        <>
                          <ClockIcon className="h-4 w-4 mr-2" />
                          <span>Running...</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center">
                      <ChartBarIcon className="h-4 w-4 mr-2" />
                      <span className="font-medium">
                        Duration: {entry.isRunning ? formatDuration(getRunningEntryDuration(entry)) : formatDuration(entry.duration)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-6">
                  {entry.isRunning ? (
                    <button
                      onClick={() => handleStopTimer(entry.id)}
                      className="flex items-center text-red-600 hover:text-red-500 text-sm font-medium"
                    >
                      <StopIcon className="h-4 w-4 mr-1" />
                      Stop
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="flex items-center text-primary-600 hover:text-primary-500 text-sm font-medium"
                      >
                        <PencilSquareIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="flex items-center text-red-600 hover:text-red-500 text-sm font-medium"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {timeEntries.length === 0 && (
          <div className="text-center py-12">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No time entries for this date</h3>
            <p className="text-gray-600 mb-6">
              Start tracking your work time by adding a new entry or starting a timer
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              Add Time Entry
            </button>
          </div>
        )}

        {/* Quick Timer Start */}
        {timeEntries.length > 0 && !activeTimer && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Start Timer</h3>
            <div className="flex flex-wrap gap-2">
              {/* Recent tasks from entries */}
              {Array.from(new Set(timeEntries.map(e => e.taskId))).slice(0, 3).map((taskId) => {
                const entry = timeEntries.find(e => e.taskId === taskId);
                return (
                  <button
                    key={taskId}
                    onClick={() => handleStartTimer(entry.taskId, entry.taskTitle, entry.projectName)}
                    className="flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"
                  >
                    <PlayIcon className="h-4 w-4 mr-2" />
                    {entry.taskTitle}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeTracking;