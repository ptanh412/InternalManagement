import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user } = useAuth();
  const userId = user?.id;

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    
    try {
      const count = await notificationService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
      setError(err);
    }
  }, [userId]);

  // Fetch recent notifications
  const fetchRecentNotifications = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const recentNotifications = await notificationService.getRecentNotifications(userId, 7);
      setNotifications(recentNotifications);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch all notifications with pagination
  const fetchNotifications = useCallback(async (page = 0, size = 20) => {
    if (!userId) return { notifications: [], totalElements: 0, totalPages: 0 };
    
    try {
      setLoading(true);
      const response = await notificationService.getUserNotifications(userId, page, size);
      return response;
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err);
      return { notifications: [], totalElements: 0, totalPages: 0 };
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds) => {
    if (!userId || !Array.isArray(notificationIds) || notificationIds.length === 0) return;
    
    try {
      await notificationService.markNotificationsAsRead(userId, notificationIds);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      
      // Update unread count
      const unreadToRead = notifications.filter(n => 
        notificationIds.includes(n.id) && !n.isRead
      ).length;
      setUnreadCount(prev => Math.max(0, prev - unreadToRead));
      
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
      setError(err);
    }
  }, [userId, notifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    
    try {
      await notificationService.markAllNotificationsAsRead(userId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          isRead: true, 
          readAt: new Date().toISOString() 
        }))
      );
      setUnreadCount(0);
      
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      setError(err);
    }
  }, [userId]);

  // Add new notification (for real-time updates)
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // Remove notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      const filtered = prev.filter(n => n.id !== notificationId);
      
      // Update unread count if removed notification was unread
      if (notification && !notification.isRead) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      
      return filtered;
    });
  }, []);

  // Initialize notifications
  useEffect(() => {
    if (userId) {
      fetchUnreadCount();
      fetchRecentNotifications();
    }
  }, [userId, fetchUnreadCount, fetchRecentNotifications]);

  // Refresh notifications periodically
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [userId, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchRecentNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    refreshNotifications: () => {
      fetchUnreadCount();
      fetchRecentNotifications();
    }
  };
};