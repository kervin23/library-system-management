// Notification Service for PWA
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

class NotificationService {
  constructor() {
    this.swRegistration = null;
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Initialize service worker
  async init() {
    if (!this.isSupported) {
      console.log('[Notification] Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('[Notification] Service Worker registered:', this.swRegistration);

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('[Notification] Service Worker is ready');

      return true;
    } catch (error) {
      console.error('[Notification] Service Worker registration failed:', error);
      return false;
    }
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('[Notification] Permission:', permission);
      return permission;
    } catch (error) {
      console.error('[Notification] Permission request failed:', error);
      return 'denied';
    }
  }

  // Check if notifications are enabled
  getPermissionStatus() {
    if (!this.isSupported) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  // Show a local notification
  async showNotification(title, options = {}) {
    if (!this.isSupported || Notification.permission !== 'granted') {
      console.log('[Notification] Cannot show notification - not permitted');
      return false;
    }

    try {
      if (this.swRegistration) {
        await this.swRegistration.showNotification(title, {
          body: options.body || '',
          icon: options.icon || '/icon-192.png',
          badge: '/icon-192.png',
          tag: options.tag || 'library-notification',
          requireInteraction: options.requireInteraction || false,
          vibrate: [200, 100, 200],
          data: options.data || {},
          ...options
        });
        return true;
      }
    } catch (error) {
      console.error('[Notification] Show notification failed:', error);
    }
    return false;
  }

  // Subscribe to push notifications
  async subscribeToPush(userId) {
    if (!this.isSupported || !this.swRegistration) {
      return null;
    }

    try {
      // Check for existing subscription
      let subscription = await this.swRegistration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription (for local notifications, we don't need VAPID keys)
        // This is a simplified version for local use
        console.log('[Notification] No push subscription, using local notifications');
      }

      // Save subscription to backend
      if (userId) {
        await this.saveSubscription(userId, subscription);
      }

      return subscription;
    } catch (error) {
      console.error('[Notification] Subscribe failed:', error);
      return null;
    }
  }

  // Save subscription to backend
  async saveSubscription(userId, subscription) {
    try {
      const response = await fetch(`${API_URL}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId,
          subscription: subscription ? JSON.stringify(subscription) : null,
          enabled: true
        })
      });
      return response.ok;
    } catch (error) {
      console.error('[Notification] Save subscription failed:', error);
      return false;
    }
  }

  // Check due dates and show notifications
  async checkDueDates(token) {
    try {
      const response = await fetch(`${API_URL}/notifications/check-due-dates`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Show notifications for due soon books
        if (data.dueSoon && data.dueSoon.length > 0) {
          for (const book of data.dueSoon) {
            await this.showNotification('Book Due Soon!', {
              body: `"${book.title}" is due on ${new Date(book.dueDate).toLocaleDateString()}`,
              tag: `due-soon-${book.id}`,
              requireInteraction: true,
              data: { url: '/student', bookId: book.id }
            });
          }
        }

        // Show notifications for overdue books
        if (data.overdue && data.overdue.length > 0) {
          for (const book of data.overdue) {
            await this.showNotification('Book Overdue!', {
              body: `"${book.title}" was due on ${new Date(book.dueDate).toLocaleDateString()}. Please return it ASAP.`,
              tag: `overdue-${book.id}`,
              requireInteraction: true,
              data: { url: '/student', bookId: book.id }
            });
          }
        }

        return data;
      }
    } catch (error) {
      console.error('[Notification] Check due dates failed:', error);
    }
    return null;
  }

  // Start periodic due date checks
  startDueDateChecker(token, intervalMinutes = 60) {
    // Initial check
    this.checkDueDates(token);

    // Set up periodic checks
    const intervalMs = intervalMinutes * 60 * 1000;
    this.dueDateInterval = setInterval(() => {
      this.checkDueDates(token);
    }, intervalMs);

    console.log(`[Notification] Due date checker started (every ${intervalMinutes} minutes)`);
  }

  // Stop periodic checks
  stopDueDateChecker() {
    if (this.dueDateInterval) {
      clearInterval(this.dueDateInterval);
      this.dueDateInterval = null;
      console.log('[Notification] Due date checker stopped');
    }
  }

  // Unsubscribe from notifications
  async unsubscribe() {
    if (!this.swRegistration) return false;

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
      return true;
    } catch (error) {
      console.error('[Notification] Unsubscribe failed:', error);
      return false;
    }
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
