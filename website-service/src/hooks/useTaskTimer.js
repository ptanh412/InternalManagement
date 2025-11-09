import { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/apiService';

export const useTaskTimer = (taskId, userId) => {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [totalLoggedSeconds, setTotalLoggedSeconds] = useState(0);
  const [currentSessionSeconds, setCurrentSessionSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  // Load timer status khi component mount
  useEffect(() => {
    loadTimerStatus();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [taskId]);

  // Đếm thời gian khi timer đang chạy
  useEffect(() => {
    if (isRunning && startTime) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const start = new Date(startTime);
        const elapsed = Math.floor((now - start) / 1000);
        setCurrentSessionSeconds(elapsed);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, startTime]);

  const loadTimerStatus = async () => {
    const response = await apiService.getTimerStatus(taskId);
    // console.log(response);
    try {
      const response = await apiService.getTimerStatus(taskId);
      const data = response.data;
      
      setIsRunning(response.isRunning);
      setStartTime(response.startTime);
      setTotalLoggedSeconds(response.totalLoggedSeconds || 0);
      setCurrentSessionSeconds(response.currentSessionSeconds || 0);
    } catch (error) {
      console.error('Failed to load timer status:', error);
    }
  };

  const startTimer = async (notes = null) => {
    setLoading(true);
    // console.log("Task ID, userID:", taskId, userId);
    try {
      const response = await apiService.startTimer(taskId);
      const data = response.data;
      
      setIsRunning(true);
      setStartTime(response.startTime);
      setCurrentSessionSeconds(0);
      
      return { success: true, response };
    } catch (error) {
      console.error('Failed to start timer:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to start timer' };
    } finally {
      setLoading(false);
    }
  };

  const stopTimer = async (notes = null) => {
    setLoading(true);
    try {
      const response = await apiService.stopTimer(taskId, notes ? { notes } : null);
      const data = response.data;
      
      setIsRunning(false);
      setStartTime(null);
      setTotalLoggedSeconds(response.totalLoggedSeconds || 0);
      setCurrentSessionSeconds(0);
      
      return { success: true, response };
    } catch (error) {
      console.error('Failed to stop timer:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to stop timer' };
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getTotalHours = () => {
    return (totalLoggedSeconds / 3600).toFixed(1);
  };

  return {
    isRunning,
    totalLoggedSeconds,
    currentSessionSeconds,
    loading,
    startTimer,
    stopTimer,
    refreshStatus: loadTimerStatus,
    formatTime,
    getTotalHours
  };
};