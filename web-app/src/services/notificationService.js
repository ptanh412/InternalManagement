import httpClient from '../configurations/httpClient';
import { getToken } from './localStorageService';

const notificationService = {
  getNotifications: async (userId) => {
    const response = await httpClient.get(`/notification/notifications/user/${userId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    console.log("Notification123:", response.data);
    return response.data;
  },
  markAsRead: async (userId, notificationIds) => {
    // Ensure notificationIds is always an array
    const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
    const response = await httpClient.post(
        `/notification/notifications/user/${userId}/mark-read`,
        { ids },
        { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    return response.data;
},
};

export default notificationService;
