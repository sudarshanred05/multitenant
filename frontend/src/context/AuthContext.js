import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      // Optionally verify token with backend
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data.data.tenant);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { tenant, token } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(tenant));
      
      setUser(tenant);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      
      // Extract detailed error message
      let errorMessage = 'Login failed';
      if (error.response?.data) {
        if (error.response.data.errors && error.response.data.errors.length > 0) {
          // Show validation errors
          errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { tenant, token } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(tenant));
      
      setUser(tenant);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      
      // Extract detailed error message
      let errorMessage = 'Registration failed';
      if (error.response?.data) {
        if (error.response.data.errors && error.response.data.errors.length > 0) {
          // Show validation errors
          errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = response.data.data.tenant;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      console.error('Profile update failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Profile update failed' 
      };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
