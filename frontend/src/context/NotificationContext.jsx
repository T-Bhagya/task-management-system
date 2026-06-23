import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { api } from '../services/api';
import { Snackbar, Alert } from '@mui/material';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  const socketRef = useRef(null);

  // Poll for token updates in localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('token');
      if (currentToken !== token) {
        setToken(currentToken);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [token]);
  
  // Fetch initial notifications
  const fetchNotifications = async () => {
    if (!localStorage.getItem('token')) return;
    try {
      const fetched = await api.getNotifications();
      if (fetched) {
        setNotifications(fetched);
        setUnreadCount(fetched.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err.message);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err.message);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map(n => api.markNotificationAsRead(n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err.message);
    }
  };

  // Connect socket.io when token is available
  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Connect to notification-service on port 3003
    const socket = io('http://localhost:3003', {
      auth: {
        token: token
      }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('📡 Connected to Real-Time Notification Service!');
    });

    // Handle incoming real-time notifications
    socket.on('notification', (newNotif) => {
      console.log('🔔 New real-time notification received:', newNotif);
      
      // Map SQLite notification schema to client format
      const mappedNotif = {
        id: newNotif.id,
        user_id: parseInt(newNotif.userId),
        title: newNotif.title,
        message: newNotif.message,
        type: newNotif.type === 'task_assigned' ? 'ASSIGNMENT' : newNotif.type === 'comment_added' ? 'COMMENT' : 'SYSTEM',
        is_read: newNotif.read,
        created_at: newNotif.createdAt
      };

      setNotifications(prev => [mappedNotif, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Display slide-in Toast notification
      setToastMessage(mappedNotif);
      setToastOpen(true);
    });

    // Handle batch offline notifications delivered on reconnect/connection
    socket.on('offline-notifications', (offlineNotifs) => {
      console.log(`📦 Received ${offlineNotifs.length} offline notifications:`, offlineNotifs);
      
      const mappedList = offlineNotifs.map(newNotif => ({
        id: newNotif.id,
        user_id: parseInt(newNotif.userId),
        title: newNotif.title,
        message: newNotif.message,
        type: newNotif.type === 'task_assigned' ? 'ASSIGNMENT' : newNotif.type === 'comment_added' ? 'COMMENT' : 'SYSTEM',
        is_read: newNotif.read,
        created_at: newNotif.createdAt
      }));

      setNotifications(prev => {
        // Avoid adding duplicate notifications
        const existingIds = new Set(prev.map(n => n.id));
        const filteredNew = mappedList.filter(n => !existingIds.has(n.id));
        return [...filteredNew, ...prev];
      });
      
      setUnreadCount(prev => prev + mappedList.filter(n => !n.is_read).length);
    });

    // Load existing notifications via REST API
    fetchNotifications();

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const handleToastClose = () => {
    setToastOpen(false);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      fetchNotifications,
      markAsRead,
      markAllAsRead
    }}>
      {children}
      <Snackbar
        open={toastOpen}
        autoHideDuration={6000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleToastClose} 
          severity={toastMessage?.type === 'ASSIGNMENT' ? 'success' : 'info'} 
          sx={{ width: '100%', borderRadius: 2.5, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
        >
          <strong>{toastMessage?.title}</strong>: {toastMessage?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
