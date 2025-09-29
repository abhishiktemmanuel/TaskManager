import React, { useEffect, useState, useCallback, useRef } from 'react';
import { axiosInstance } from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPath';
import { storage } from '../utils/helper';
import { AuthContext, type AuthContextType, type User } from './authContext';

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref to prevent multiple simultaneous operations
  const operationInProgress = useRef(false);

  useEffect(() => {
    const initializeAuth = () => {
      if (operationInProgress.current) return;
      operationInProgress.current = true;
      
      try {
        // Use consistent storage methods to retrieve data
        const savedToken = storage.getToken();
        const savedUser = storage.getUser() as User | null;
        
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear potentially corrupted data
        storage.clearAuth();
      } finally {
        setIsLoading(false);
        operationInProgress.current = false;
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    if (operationInProgress.current) return;
    operationInProgress.current = true;
    
    try {
      const response = await axiosInstance.post(API_PATHS.LOGIN, { email, password });
      const { access_token, user: userData } = response.data.data;

      // Atomic update - set all state together
      setUser(userData);
      setToken(access_token);
      storage.setToken(access_token);
      storage.setUser(userData);
    } finally {
      operationInProgress.current = false;
    }
  };

  const register = async (name: string, email: string, password: string, adminInviteToken?: string) => {
    if (operationInProgress.current) return;
    operationInProgress.current = true;
    
    try {
      const payload = adminInviteToken
        ? { name, email, password, adminInviteToken }
        : { name, email, password };
        
      const response = await axiosInstance.post(API_PATHS.REGISTER, payload);
      const { access_token, user: userData } = response.data.data;

      // Atomic update
      setUser(userData);
      setToken(access_token);
      storage.setToken(access_token);
      storage.setUser(userData);
    } finally {
      operationInProgress.current = false;
    }
  };

  const logout = useCallback(() => {
    if (operationInProgress.current) return;
    operationInProgress.current = true;
    
    try {
      setUser(null);
      setToken(null);
      storage.clearAuth();
    } finally {
      operationInProgress.current = false;
    }
  }, []);

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthProvider };