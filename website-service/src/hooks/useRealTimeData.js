import { useState, useEffect, useCallback, useRef } from 'react';
import webSocketService from '../services/webSocketService';
import { apiService } from '../services/apiService';

export const useRealTimeData = (config = {}) => {
  const {
    dashboardType = 'general',
    userId = null,
    teamId = null,
    refreshInterval = 30000, // 30 seconds fallback
    autoConnect = true,
    filters = {}
  } = config;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  // Safely update state only if component is mounted
  const safeSetState = useCallback((setter, value) => {
    if (mountedRef.current) {
      setter(value);
    }
  }, []);

  // Initial data fetch
  const fetchInitialData = useCallback(async () => {
    try {
      safeSetState(setLoading, true);
      safeSetState(setError, null);

      let response;
      
      switch (dashboardType) {
        case 'employee':
          response = await Promise.all([
            apiService.performance.getMyPerformance(),
            apiService.workTime.getMyTimeStats(),
            apiService.projectProgress.getUserParticipation(userId)
          ]);
          break;
          
        case 'team-lead':
          response = await Promise.all([
            apiService.workTime.getTeamProductivity(teamId),
            apiService.performance.getBatchReports([]), // Will get team member IDs
            apiService.workTime.getDepartmentStats(filters.departmentId)
          ]);
          break;
          
        case 'project-manager':
          response = await Promise.all([
            apiService.projectProgress.getProgressOverview(),
            apiService.resources.getAllocationSummary(),
            apiService.projectProgress.getProgressDashboard()
          ]);
          break;
          
        case 'admin':
          response = await Promise.all([
            apiService.admin.getAllUsers(),
            apiService.admin.getAllDepartments(),
            apiService.resources.getUtilizationMetrics(),
            apiService.performance.getDepartmentReports('all')
          ]);
          break;
          
        default:
          response = await apiService.projectProgress.getProgressOverview();
      }

      safeSetState(setData, {
        type: dashboardType,
        payload: response,
        timestamp: new Date().toISOString(),
        source: 'api'
      });

      safeSetState(setLastUpdate, new Date());
      
    } catch (err) {
      console.error('Error fetching initial dashboard data:', err);
      safeSetState(setError, err.response?.data?.message || err.message || 'Failed to fetch data');
    } finally {
      safeSetState(setLoading, false);
    }
  }, [dashboardType, userId, teamId, filters, safeSetState]);

  // WebSocket event handlers
  const handleConnection = useCallback((connectionData) => {
    safeSetState(setIsConnected, connectionData.status === 'connected' || connectionData.status === 'reconnected');
    
    if (connectionData.status === 'connected') {
      // Join appropriate rooms based on dashboard type
      switch (dashboardType) {
        case 'employee':
          webSocketService.joinRoom(`user_${userId}`);
          break;
        case 'team-lead':
          webSocketService.joinRoom(`team_${teamId}`);
          break;
        case 'project-manager':
          webSocketService.joinRoom('project_managers');
          break;
        case 'admin':
          webSocketService.joinRoom('admins');
          break;
      }
    }
  }, [dashboardType, userId, teamId, safeSetState]);

  const handleDashboardUpdate = useCallback((updateData) => {
    if (updateData.type === dashboardType || updateData.type === 'all') {
      safeSetState(setData, prevData => ({
        ...prevData,
        ...updateData,
        timestamp: new Date().toISOString(),
        source: 'websocket'
      }));
      
      safeSetState(setLastUpdate, new Date());
      
      // Trigger chart refresh if callback provided
      if (config.onDataUpdate) {
        config.onDataUpdate(updateData);
      }
    }
  }, [dashboardType, safeSetState, config]);

  const handlePerformanceUpdate = useCallback((performanceData) => {
    if (dashboardType === 'employee' || dashboardType === 'team-lead' || dashboardType === 'admin') {
      safeSetState(setData, prevData => ({
        ...prevData,
        performance: performanceData,
        timestamp: new Date().toISOString(),
        source: 'websocket'
      }));
      
      safeSetState(setLastUpdate, new Date());
    }
  }, [dashboardType, safeSetState]);

  const handleTaskUpdate = useCallback((taskData) => {
    if (taskData.assignedTo === userId || taskData.teamId === teamId || dashboardType === 'admin') {
      safeSetState(setData, prevData => ({
        ...prevData,
        tasks: taskData,
        timestamp: new Date().toISOString(),
        source: 'websocket'
      }));
      
      safeSetState(setLastUpdate, new Date());
    }
  }, [userId, teamId, dashboardType, safeSetState]);

  const handleTeamUpdate = useCallback((teamData) => {
    if ((teamData.teamId === teamId) || dashboardType === 'admin') {
      safeSetState(setData, prevData => ({
        ...prevData,
        team: teamData,
        timestamp: new Date().toISOString(),
        source: 'websocket'
      }));
      
      safeSetState(setLastUpdate, new Date());
    }
  }, [teamId, dashboardType, safeSetState]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchInitialData();
    
    // Request fresh data via WebSocket if connected
    if (webSocketService.isSocketConnected()) {
      webSocketService.requestDashboardData(dashboardType, filters);
    }
  }, [fetchInitialData, dashboardType, filters]);

  // Setup WebSocket connection and subscriptions
  useEffect(() => {
    if (!autoConnect) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Connect WebSocket
    if (!webSocketService.isSocketConnected()) {
      webSocketService.connect(user.id, user.role);
    }

    // Subscribe to events
    const unsubscribeConnection = webSocketService.subscribe('connection', handleConnection);
    const unsubscribeDashboard = webSocketService.subscribe('dashboard_update', handleDashboardUpdate);
    const unsubscribePerformance = webSocketService.subscribe('performance_update', handlePerformanceUpdate);
    const unsubscribeTask = webSocketService.subscribe('task_update', handleTaskUpdate);
    const unsubscribeTeam = webSocketService.subscribe('team_update', handleTeamUpdate);

    // Setup fallback polling if WebSocket fails
    intervalRef.current = setInterval(() => {
      if (!webSocketService.isSocketConnected()) {
        console.log('WebSocket disconnected, falling back to polling');
        fetchInitialData();
      }
    }, refreshInterval);

    return () => {
      unsubscribeConnection();
      unsubscribeDashboard();
      unsubscribePerformance();
      unsubscribeTask();
      unsubscribeTeam();
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    autoConnect,
    handleConnection,
    handleDashboardUpdate,
    handlePerformanceUpdate,
    handleTaskUpdate,
    handleTeamUpdate,
    fetchInitialData,
    refreshInterval
  ]);

  // Initial data fetch
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    isConnected,
    lastUpdate,
    refresh,
    connectionInfo: webSocketService.getConnectionInfo()
  };
};

// Hook for real-time chart data
export const useRealTimeChartData = (chartConfig = {}) => {
  const {
    chartType,
    dataEndpoint,
    updateInterval = 10000,
    userId,
    teamId,
    projectId,
    ...otherConfig
  } = chartConfig;

  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState(null);

  const realTimeConfig = {
    dashboardType: chartType,
    userId,
    teamId,
    refreshInterval: updateInterval,
    onDataUpdate: (data) => {
      // Transform WebSocket data for chart consumption
      if (data.chartData) {
        setChartData(data.chartData);
      }
    },
    ...otherConfig
  };

  const { data: realTimeData, loading, error, refresh } = useRealTimeData(realTimeConfig);

  // Transform real-time data for chart format
  useEffect(() => {
    if (realTimeData && realTimeData.payload) {
      try {
        // Transform based on chart type
        let transformedData;
        
        switch (chartType) {
          case 'performance':
            transformedData = transformPerformanceData(realTimeData.payload);
            break;
          case 'productivity':
            transformedData = transformProductivityData(realTimeData.payload);
            break;
          case 'resource':
            transformedData = transformResourceData(realTimeData.payload);
            break;
          default:
            transformedData = realTimeData.payload;
        }
        
        setChartData(transformedData);
        setChartLoading(false);
      } catch (err) {
        console.error('Error transforming chart data:', err);
        setChartError(err.message);
        setChartLoading(false);
      }
    }
  }, [realTimeData, chartType]);

  return {
    chartData,
    loading: loading || chartLoading,
    error: error || chartError,
    refresh
  };
};

// Data transformation functions
const transformPerformanceData = (data) => {
  // Transform performance API data to Chart.js format
  if (!data || !Array.isArray(data)) return null;
  
  return {
    labels: data.map(item => item.period || item.name),
    datasets: [{
      label: 'Performance Score',
      data: data.map(item => item.score || item.value),
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: '#3B82F6',
      borderWidth: 2,
      fill: true
    }]
  };
};

const transformProductivityData = (data) => {
  // Transform productivity API data to Chart.js format
  if (!data || !Array.isArray(data)) return null;
  
  return {
    labels: data.map(item => item.date || item.period),
    datasets: [{
      label: 'Productivity',
      data: data.map(item => item.productivity || item.value),
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderColor: '#10B981',
      borderWidth: 2,
      fill: true
    }]
  };
};

const transformResourceData = (data) => {
  // Transform resource API data to Chart.js format
  if (!data || !Array.isArray(data)) return null;
  
  return {
    labels: data.map(item => item.resource || item.name),
    datasets: [{
      label: 'Utilization %',
      data: data.map(item => item.utilization || item.percentage),
      backgroundColor: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'
      ]
    }]
  };
};

export { webSocketService };