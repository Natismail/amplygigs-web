// hooks/useNotifications.js

import { useState, useEffect } from 'react';
import pushNotificationService from '@/lib/pushNotificationService';

export function useNotifications() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported(pushNotificationService.isSupported());
    
    // Check current permission
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
      setIsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const requestPermission = async () => {
    try {
      const granted = await pushNotificationService.requestPermission();
      setIsEnabled(granted);
      setPermission(granted ? 'granted' : 'denied');
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const initialize = async () => {
    try {
      const success = await pushNotificationService.initialize();
      setIsEnabled(success);
      return success;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  };

  const showNotification = (title, options) => {
    if (isEnabled) {
      pushNotificationService.showNotification(title, options);
    }
  };

  const clearNotifications = (tag) => {
    if (tag) {
      pushNotificationService.clearNotification(tag);
    } else {
      pushNotificationService.clearAllNotifications();
    }
  };

  // Tracking-specific notification helpers
  const notify = {
    locationUpdate: (userName, distance, isMusician) => {
      if (isEnabled) {
        pushNotificationService.showLocationUpdateNotification(userName, distance, isMusician);
      }
    },
    arrival: (userName, isMusician) => {
      if (isEnabled) {
        pushNotificationService.showArrivalNotification(userName, isMusician);
      }
    },
    trackingStarted: (userName, isMusician) => {
      if (isEnabled) {
        pushNotificationService.showTrackingStartedNotification(userName, isMusician);
      }
    },
    lowBattery: () => {
      if (isEnabled) {
        pushNotificationService.showLowBatteryWarning();
      }
    },
    connectionLost: () => {
      if (isEnabled) {
        pushNotificationService.showConnectionLostNotification();
      }
    },
    eventReminder: (eventDetails, timeUntilEvent) => {
      if (isEnabled) {
        pushNotificationService.showEventReminderNotification(eventDetails, timeUntilEvent);
      }
    }
  };

  return {
    isEnabled,
    isSupported,
    permission,
    requestPermission,
    initialize,
    showNotification,
    clearNotifications,
    notify
  };
}