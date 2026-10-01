import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, notificationAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('csrm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('csrm_token') || null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const res = await authAPI.getMe();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('csrm_user', JSON.stringify(res.data));
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      // If token expired or invalid
      logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getMyNotifications();
      if (res.success && res.data) {
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      console.warn('Could not fetch notifications:', err.message);
    }
  };

  const login = (authData) => {
    setToken(authData.token);
    setUser(authData);
    localStorage.setItem('csrm_token', authData.token);
    localStorage.setItem('csrm_user', JSON.stringify(authData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('csrm_token');
    localStorage.removeItem('csrm_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        notifications,
        unreadCount,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
