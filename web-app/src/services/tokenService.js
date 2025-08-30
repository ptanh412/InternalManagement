import { getToken } from "./localStorageService";

/**
 * Decode JWT token to get user information
 */
export const getCurrentUserFromToken = () => {
  try {
    const token = getToken();
    if (!token) return null;

    // Decode the JWT token (this is just the payload, not verification)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    
    return {
      userId: payload.sub || payload.userId || payload.id,
      username: payload.username || payload.preferred_username,
      email: payload.email,
      roles: payload.roles || payload.authorities || [],
      exp: payload.exp,
      iat: payload.iat
    };
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

/**
 * Get current user ID from token
 */
export const getCurrentUserId = () => {
  const userInfo = getCurrentUserFromToken();
  return userInfo?.userId;
};

/**
 * Check if token is expired
 */
export const isTokenExpired = () => {
  const userInfo = getCurrentUserFromToken();
  if (!userInfo?.exp) return true;
  
  const currentTime = Date.now() / 1000;
  return userInfo.exp < currentTime;
};
