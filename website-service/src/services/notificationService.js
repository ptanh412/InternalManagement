import api from './apiService';

class NotificationService {
  // Get all notifications for a user with pagination
  async getUserNotifications(userId, page = 0, size = 20) {
    try {
      const response = await api.get(`/notification/notifications/user/${userId}`, {
        params: { page, size }
      });
      return response;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  // Get unread notifications for a user
  async getUnreadNotifications(userId) {
    try {
      const response = await api.get(`/notification/notifications/user/${userId}/unread`);
      return response;
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  }

  // Get unread count for a user
  async getUnreadCount(userId) {
    try {
      const response = await api.get(`/notification/notifications/user/${userId}/unread-count`);
      return response;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  // Get recent notifications for a user
  async getRecentNotifications(userId, days = 7) {
    try {
      const response = await api.get(`/notification/notifications/user/${userId}/recent`, {
        params: { days }
      });
      return response;
    } catch (error) {
      console.error('Error fetching recent notifications:', error);
      throw error;
    }
  }

  // Mark specific notifications as read
  async markNotificationsAsRead(userId, notificationIds) {
    try {
      const response = await api.post(`/notification/notifications/user/${userId}/mark-read`, {
        ids: notificationIds
      });
      return response;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllNotificationsAsRead(userId) {
    try {
      const response = await api.post(`/notification/notifications/user/${userId}/mark-all-read`);
      return response;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
export default NotificationService;