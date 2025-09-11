// lib/pushNotificationService.js

class PushNotificationService {
  constructor() {
    this.registration = null;
    this.permission = Notification.permission;
  }

  // Check if push notifications are supported
  isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    if (this.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    
    return permission === 'granted';
  }

  // Register service worker
  async registerServiceWorker() {
    if (!this.isSupported()) {
      throw new Error('Service workers are not supported');
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');
      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  // Initialize push notifications
  async initialize() {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('Notification permission denied');
      }

      await this.registerServiceWorker();
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  // Show local notification
  showNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const defaultOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'amplyGigs-notification',
      requireInteraction: false,
      ...options
    };

    if (this.registration) {
      // Use service worker to show notification
      this.registration.showNotification(title, defaultOptions);
    } else {
      // Fallback to basic notification
      new Notification(title, defaultOptions);
    }
  }

  // Tracking specific notifications
  showLocationUpdateNotification(userName, distance, isMusician = false) {
    const title = isMusician 
      ? `🎵 ${userName} is on the way` 
      : `📍 ${userName} location updated`;
    
    const body = `${userName} is ${distance}km away from the venue`;
    
    this.showNotification(title, {
      body,
      icon: '/icons/location-icon.png',
      tag: 'location-update',
      data: { type: 'location_update', userName, distance }
    });
  }

  showArrivalNotification(userName, isMusician = false) {
    const title = isMusician 
      ? `🎵 Musician has arrived!` 
      : `👤 ${userName} has arrived`;
    
    const body = `${userName} has reached the venue`;
    
    this.showNotification(title, {
      body,
      icon: '/icons/arrival-icon.png',
      tag: 'arrival',
      requireInteraction: true,
      data: { type: 'arrival', userName }
    });
  }

  showTrackingStartedNotification(userName, isMusician = false) {
    const title = `🚀 Live tracking started`;
    const body = isMusician 
      ? `Your musician ${userName} started sharing location`
      : `${userName} started sharing location with you`;
    
    this.showNotification(title, {
      body,
      icon: '/icons/tracking-icon.png',
      tag: 'tracking-started',
      data: { type: 'tracking_started', userName }
    });
  }

  showLowBatteryWarning() {
    this.showNotification('⚡ Low Battery Warning', {
      body: 'Your device battery is low. Location tracking might be affected.',
      icon: '/icons/battery-icon.png',
      tag: 'low-battery',
      requireInteraction: true,
      data: { type: 'low_battery' }
    });
  }

  showConnectionLostNotification() {
    this.showNotification('📶 Connection Lost', {
      body: 'Lost connection. Location updates will resume when reconnected.',
      icon: '/icons/offline-icon.png',
      tag: 'connection-lost',
      data: { type: 'connection_lost' }
    });
  }

  showEventReminderNotification(eventDetails, timeUntilEvent) {
    this.showNotification(`🎭 Event Reminder`, {
      body: `Your event "${eventDetails.title}" starts in ${timeUntilEvent}`,
      icon: '/icons/event-icon.png',
      tag: 'event-reminder',
      requireInteraction: true,
      data: { type: 'event_reminder', eventDetails }
    });
  }

  // Clear specific notification
  clearNotification(tag) {
    if (this.registration) {
      this.registration.getNotifications({ tag }).then(notifications => {
        notifications.forEach(notification => notification.close());
      });
    }
  }

  // Clear all notifications
  clearAllNotifications() {
    if (this.registration) {
      this.registration.getNotifications().then(notifications => {
        notifications.forEach(notification => notification.close());
      });
    }
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();
export default pushNotificationService;