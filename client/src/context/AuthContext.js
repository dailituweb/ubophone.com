import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import webSocketService from '../services/websocketService';

// Configure axios base URL for development and production
const API_BASE = process.env.NODE_ENV === 'production' 
  ? (process.env.REACT_APP_API_URL || '') 
  : 'http://localhost:5001';
axios.defaults.baseURL = API_BASE;

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // No auto-setup - users must login manually
    
    if (token) {
      // Handle mock token in demo mode (development and production)
      if (token === 'mock-token') {
        // 检查 currentBalance 是否存在，如果不存在则初始化
        const currentBalance = localStorage.getItem('currentBalance');
        if (!currentBalance) {
          localStorage.setItem('currentBalance', '60.00');
        }
        const balanceValue = parseFloat(currentBalance || '60.00');
        
        setUser({
          id: 'mock-user',
          email: 'demo@ubophone.com',
          name: 'Demo User',
          balance: balanceValue,
          token: 'mock-token'
        });
        setBalance(balanceValue);
        
        // Connect to WebSocket for demo user
        webSocketService.connect('mock-token');
        setLoading(false);
        return;
      }
      
      fetchUser();
    } else {
      setLoading(false);
    }

    // Handle social login callback
    const handleSocialLogin = () => {
      if (window.location.pathname === '/auth/social-callback') {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
          localStorage.setItem('token', token);
          fetchUser();
          window.location.href = '/dashboard';
        }
      }
    };

    handleSocialLogin();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Always fetch from server for real data
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const serverBalance = parseFloat(response.data.user.balance || response.data.balance || 0);
      console.log('👤 fetchUser - Server returned balance:', serverBalance);
      console.log('👤 fetchUser - User data:', response.data.user);
      
      // 将token添加到用户对象中，供其他组件使用
      setUser({ ...response.data.user, token: token });
      setBalance(serverBalance);
      
      // Connect to WebSocket
      webSocketService.connect(token);
    } catch (error) {
      console.error('Failed to fetch user:', error.response?.data?.message || error.message);
      localStorage.removeItem('token');
      setUser(null);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser({ ...user, token: token });
      setBalance(parseFloat(user.balance || 0));
      
      // Connect to WebSocket
      webSocketService.connect(token);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post('/api/auth/register', { 
        name, email, password 
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser({ ...user, token: token });
      setBalance(parseFloat(user.balance || 0));
      
      // Connect to WebSocket
      webSocketService.connect(token);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      return { 
        success: true, 
        message: response.data.message,
        demo: response.data.demo,
        previewUrl: response.data.previewUrl
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to process request' 
      };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const response = await axios.post('/api/auth/reset-password', { token, password });
      return { 
        success: true, 
        message: response.data.message 
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to reset password' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setBalance(0);
    
    // Disconnect WebSocket
    webSocketService.disconnect();
  };

  const updateBalance = (newBalance) => {
    console.log('💰 updateBalance called - old balance:', balance, 'new balance:', newBalance);
    console.log('💰 updateBalance - user token type:', user?.token === 'mock-token' ? 'mock' : 'real');
    
    setBalance(newBalance);
    // 只在mock-token用户时更新 localStorage
    if (user && user.token === 'mock-token') {
      localStorage.setItem('currentBalance', newBalance.toString());
      console.log('💰 updateBalance - saved to localStorage for mock user');
    }
    // 如果是真实用户，也要更新用户对象中的余额
    if (user && user.token !== 'mock-token') {
      setUser(prevUser => ({ ...prevUser, balance: newBalance }));
      console.log('💰 updateBalance - updated user object for real user');
    }
  };

  const value = {
    user,
    balance,
    loading,
    login,
    register,
    logout,
    updateBalance,
    fetchUser,
    forgotPassword,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 