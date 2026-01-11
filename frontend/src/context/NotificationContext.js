import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isInitialized, setIsInitialized] = useState(false);
  const [dueSoonBooks, setDueSoonBooks] = useState([]);
  const [overdueBooks, setOverdueBooks] = useState([]);

  // Initialize notification service
  useEffect(() => {
    const init = async () => {
      const supported = await notificationService.init();
      setIsSupported(supported);
      setPermission(notificationService.getPermissionStatus());
      setIsInitialized(true);
    };
    init();
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    const result = await notificationService.requestPermission();
    setPermission(result);
    return result;
  }, []);

  // Subscribe to notifications
  const subscribe = useCallback(async (userId) => {
    if (permission !== 'granted') {
      const result = await requestPermission();
      if (result !== 'granted') return false;
    }
    await notificationService.subscribeToPush(userId);
    return true;
  }, [permission, requestPermission]);

  // Check due dates
  const checkDueDates = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const result = await notificationService.checkDueDates(token);
    if (result) {
      setDueSoonBooks(result.dueSoon || []);
      setOverdueBooks(result.overdue || []);
    }
    return result;
  }, []);

  // Start periodic due date checks when user logs in
  const startNotifications = useCallback((token) => {
    notificationService.startDueDateChecker(token, 30); // Check every 30 minutes
  }, []);

  // Stop notifications when user logs out
  const stopNotifications = useCallback(() => {
    notificationService.stopDueDateChecker();
  }, []);

  // Show a notification
  const showNotification = useCallback(async (title, options) => {
    if (permission !== 'granted') {
      console.log('[NotificationContext] Cannot show notification - permission not granted');
      return false;
    }
    return await notificationService.showNotification(title, options);
  }, [permission]);

  // Test notification
  const testNotification = useCallback(async () => {
    return await showNotification('CvSU Library', {
      body: 'Notifications are working! You will be notified when your books are due.',
      tag: 'test-notification'
    });
  }, [showNotification]);

  const value = {
    isSupported,
    permission,
    isInitialized,
    dueSoonBooks,
    overdueBooks,
    requestPermission,
    subscribe,
    checkDueDates,
    startNotifications,
    stopNotifications,
    showNotification,
    testNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;
