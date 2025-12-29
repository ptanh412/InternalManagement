import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      console.log('CheckAuth: Starting authentication check', { 
        hasToken: !!token, 
        hasRefreshToken: !!refreshToken 
      });
      
      if (token) {
        try {
          // Validate token with backend
          console.log('CheckAuth: Validating token with introspect');
          const response = await apiService.introspect(token);
          console.log(response);
          
          if (response.result && response.result.valid) {
            console.log('CheckAuth: Token valid, fetching user profile');
            // Get user profile
            const userProfile = await apiService.getProfile();

            console.log('CheckAuth: Fetched user profile', userProfile);
            
            // ✅ FIX: Include userId in userData
            const userData = {
              id: userProfile.result.id,
              userId: userProfile.result.id, // ✅ Add userId field
              name: `${userProfile.result.firstName} ${userProfile.result.lastName}`,
              email: userProfile.result.email,
              role: userProfile.result.roleName,
              isAdmin: userProfile.result.roleName === 'ADMIN',
              username: userProfile.result.username,
              departmentId: userProfile.result.departmentName, // ✅ Add departmentId
              departmentName: userProfile.result.departmentName,
              positionTitle: userProfile.result.positionTitle,
              avatar: userProfile.result.avatar || null // ✅ Add avatar
            };
            
            // ✅ Store essential info in localStorage for PostsPage
            localStorage.setItem('userId', userData.userId);
            localStorage.setItem('username', userData.username);
            localStorage.setItem('departmentId', userData.departmentName || '');
            if (userData.avatar) {
              localStorage.setItem('avatar', userData.avatar);
            }
            
            setUser(userData);
            setIsAuthenticated(true);
            console.log('CheckAuth: Successfully authenticated user', userData);
          } else {
            console.log('CheckAuth: Token invalid, attempting refresh');
            throw new Error('Token invalid');
          }
        } catch (error) {
          console.log('CheckAuth: Error validating token:', error.message);
          // Try to refresh token if available
          if (refreshToken) {
            try {
              console.log('CheckAuth: Attempting token refresh');
              const refreshResponse = await apiService.refreshToken(refreshToken);
              localStorage.setItem('token', refreshResponse.result.token);
              localStorage.setItem('refreshToken', refreshResponse.result.refreshToken || refreshToken);
              
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Retry with new token
              console.log('CheckAuth: Fetching profile with refreshed token');
              const userProfile = await apiService.getProfile();
              
              // ✅ FIX: Include userId in userData
              const userData = {
                id: userProfile.result.id,
                userId: userProfile.result.id, // ✅ Add userId field
                name: `${userProfile.result.firstName} ${userProfile.result.lastName}`,
                email: userProfile.result.email,
                role: userProfile.result.roleName,
                isAdmin: userProfile.result.roleName === 'ADMIN',
                username: userProfile.result.username,
                departmentId: userProfile.result.departmentId, // ✅ Add departmentId
                departmentName: userProfile.result.departmentName,
                positionTitle: userProfile.result.positionTitle,
                avatar: userProfile.result.avatar || null // ✅ Add avatar
              };
              
              // ✅ Store essential info in localStorage
              localStorage.setItem('userId', userData.userId);
              localStorage.setItem('username', userData.username);
              localStorage.setItem('departmentId', userData.departmentId || '');
              if (userData.avatar) {
                localStorage.setItem('avatar', userData.avatar);
              }
              
              setUser(userData);
              setIsAuthenticated(true);
              console.log('CheckAuth: Successfully authenticated with refreshed token');
            } catch (refreshError) {
              console.log('CheckAuth: Token refresh failed, clearing session');
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('userId');
              localStorage.removeItem('username');
              localStorage.removeItem('departmentId');
              localStorage.removeItem('avatar');
              setUser(null);
              setIsAuthenticated(false);
            }
          } else {
            console.log('CheckAuth: No refresh token available, clearing session');
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            localStorage.removeItem('departmentId');
            localStorage.removeItem('avatar');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } else {
        console.log('CheckAuth: No token found');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('CheckAuth: Authentication check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('departmentId');
      localStorage.removeItem('avatar');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
      console.log('CheckAuth: Authentication check completed');
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);
      
      const response = await apiService.login({ username, password });
      
      if (response.result) {
        const { token, expiryTime, roleName, isAdmin } = response.result;
        
        localStorage.setItem('token', token);
        if (response.result.refreshToken) {
          localStorage.setItem('refreshToken', response.result.refreshToken);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          const userProfile = await apiService.getProfile();
          
          // ✅ FIX: Include userId in userData
          const userData = {
            id: userProfile.result.id,
            userId: userProfile.result.id, // ✅ Add userId field
            name: `${userProfile.result.firstName} ${userProfile.result.lastName}`,
            email: userProfile.result.email,
            role: roleName,
            isAdmin: isAdmin,
            username: userProfile.result.username,
            departmentId: userProfile.result.departmentId, // ✅ Add departmentId
            departmentName: userProfile.result.departmentName,
            positionTitle: userProfile.result.positionTitle,
            avatar: userProfile.result.avatar || null, // ✅ Add avatar
            expiryTime: expiryTime
          };

          // ✅ Store essential info in localStorage
          localStorage.setItem('userId', userData.userId);
          localStorage.setItem('username', userData.username);
          localStorage.setItem('departmentId', userData.departmentId || '');
          if (userData.avatar) {
            localStorage.setItem('avatar', userData.avatar);
          }

          setUser(userData);
          setIsAuthenticated(true);
          
          return { success: true, user: userData };
        } catch (profileError) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          return { 
            success: false, 
            error: 'Failed to load user profile. Please try again.' 
          };
        }
      } else {
        return { 
          success: false, 
          error: 'Invalid response from server' 
        };
      }
    } catch (error) {
      console.error('Login failed:', error);
      
      let errorMessage = 'An error occurred during login';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Invalid username or password';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Call backend logout to invalidate token
        await apiService.logout(token);
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear local storage and state
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      return { success: true, data: response };
    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const getUserRole = () => {
    return user?.role || null;
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    register,
    getUserRole,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};