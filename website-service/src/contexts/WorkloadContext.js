import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { apiService } from '../services/apiService';

const WorkloadContext = createContext();

export const useWorkload = () => {
  const context = useContext(WorkloadContext);
  if (!context) {
    throw new Error('useWorkload must be used within a WorkloadProvider');
  }
  return context;
};

export const WorkloadProvider = ({ children }) => {
  const [teamWorkload, setTeamWorkload] = useState([]);
  const [userWorkloads, setUserWorkloads] = useState({});
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Refresh team workload data for a department
   */
  const refreshTeamWorkload = useCallback(async (departmentId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.workload.getTeamWorkload(departmentId);
      setTeamWorkload(response.result || response);

      return response;
    } catch (err) {
      console.error('Failed to refresh team workload:', err);
      setError(err.message || 'Failed to refresh team workload');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh workload data for a specific user
   */
  const refreshUserWorkload = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.workload.getUserWorkload(userId);
      const workloadData = response.result || response;

      setUserWorkloads(prev => ({
        ...prev,
        [userId]: workloadData
      }));

      return workloadData;
    } catch (err) {
      console.error(`Failed to refresh workload for user ${userId}:`, err);
      setError(err.message || `Failed to refresh workload for user ${userId}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get user availability for task assignment
   */
  const getUserAvailability = useCallback(async (userId) => {
    try {
      const response = await apiService.workload.getUserAvailability(userId);
      return response.result || response;
    } catch (err) {
      console.error(`Failed to get availability for user ${userId}:`, err);
      throw err;
    }
  }, []);

  /**
   * Load workload data for multiple users
   */
  const loadMultipleUserWorkloads = useCallback(async (userIds) => {
    try {
      setLoading(true);
      setError(null);

      const promises = userIds.map(userId =>
        apiService.workload.getUserWorkload(userId)
          .then(response => ({ userId, data: response.result || response }))
          .catch(err => ({ userId, error: err }))
      );

      const results = await Promise.all(promises);

      const newWorkloads = {};
      results.forEach(result => {
        if (result.data) {
          newWorkloads[result.userId] = result.data;
        } else {
          console.error(`Failed to load workload for user ${result.userId}:`, result.error);
        }
      });

      setUserWorkloads(prev => ({
        ...prev,
        ...newWorkloads
      }));

      return newWorkloads;
    } catch (err) {
      console.error('Failed to load multiple user workloads:', err);
      setError(err.message || 'Failed to load workload data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh available users for assignment
   */
  const refreshAvailableUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.workload.getAvailableUsers();
      const users = response.result || response;
      setAvailableUsers(users.availableUsers || users);

      return users;
    } catch (err) {
      console.error('Failed to refresh available users:', err);
      setError(err.message || 'Failed to refresh available users');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user capacity
   */
  const updateUserCapacity = useCallback(async (userId, capacityData) => {
    try {
      const response = await apiService.workload.updateUserCapacity(userId, capacityData);

      // Refresh user workload after capacity update
      await refreshUserWorkload(userId);

      return response;
    } catch (err) {
      console.error(`Failed to update capacity for user ${userId}:`, err);
      throw err;
    }
  }, [refreshUserWorkload]);

  /**
   * Optimize workload for a project
   */
  const optimizeProjectWorkload = useCallback(async (projectId) => {
    try {
      const response = await apiService.workload.optimizeWorkloadForProject(projectId);
      return response.result || response;
    } catch (err) {
      console.error(`Failed to optimize workload for project ${projectId}:`, err);
      throw err;
    }
  }, []);

  /**
   * Clear workload data
   */
  const clearWorkloadData = useCallback(() => {
    setTeamWorkload([]);
    setUserWorkloads({});
    setAvailableUsers([]);
    setError(null);
  }, []);

  /**
   * Get cached user workload
   */
  const getCachedUserWorkload = useCallback((userId) => {
    return userWorkloads[userId] || null;
  }, [userWorkloads]);

  /**
   * Force refresh specific user workload from server
   */
  const forceRefreshUserWorkload = useCallback(async (userId) => {
    try {
      const response = await apiService.workload.refreshUserWorkload(userId);
      await refreshUserWorkload(userId); // Reload the data
      return response;
    } catch (err) {
      console.error(`Failed to force refresh workload for user ${userId}:`, err);
      throw err;
    }
  }, [refreshUserWorkload]);

  const value = {
    // State
    teamWorkload,
    userWorkloads,
    availableUsers,
    loading,
    error,

    // Actions
    refreshTeamWorkload,
    refreshUserWorkload,
    getUserAvailability,
    loadMultipleUserWorkloads,
    refreshAvailableUsers,
    updateUserCapacity,
    optimizeProjectWorkload,
    clearWorkloadData,
    getCachedUserWorkload,
    forceRefreshUserWorkload,

    // Computed values
    getTeamWorkloadSummary: () => {
      if (teamWorkload.length === 0) return null;

      const available = teamWorkload.filter(member =>
        member.utilizationPercentage < 75
      ).length;

      const busy = teamWorkload.filter(member =>
        member.utilizationPercentage >= 75 && member.utilizationPercentage < 100
      ).length;

      const overloaded = teamWorkload.filter(member =>
        member.utilizationPercentage >= 100
      ).length;

      const avgUtilization = teamWorkload.reduce((acc, member) =>
        acc + member.utilizationPercentage, 0
      ) / teamWorkload.length;

      return { available, busy, overloaded, avgUtilization };
    }
  };

  return (
    <WorkloadContext.Provider value={value}>
      {children}
    </WorkloadContext.Provider>
  );
};

WorkloadProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { WorkloadContext };
