import httpClient from '../configurations/httpClient';
import { getToken } from './localStorageService';

const adminUserService = {
  getAllUsers: async () => {
    const response = await httpClient.get('/identity/users', {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.data;
  },
  updateUser: async (userId, userData) => {
    console.log('userData', userData);
    console.log('userId', userId);
    console.log('getToken()', getToken());
      const response = await httpClient.put(`/identity/users/${userId}`, userData, {
        headers: { 
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json"
        },
    });
    return response.data;
  },
  deleteUser: async (userId) => {
    const response = await httpClient.delete(`/identity/users/${userId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return response.data;
  },
};

export default adminUserService;
