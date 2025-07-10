import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { requestNotificationPermission } from '../firebase';

export const useNotificationStore = create((set, get) => ({
  fcmToken: null,
  notificationPermission: 'default',
  unreadNotifications: [],
  isLoadingNotifications: false,
  isRegisteringToken: false,

  // Initialize notification system
  initializeNotifications: async () => {
    try {
      const permission = Notification.permission;
      set({ notificationPermission: permission });

      if (permission === 'granted') {
        await get().registerFCMToken();
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  },

  // Request notification permission and register FCM token
  requestPermission: async () => {
    try {
      const token = await requestNotificationPermission();
      if (token) {
        set({ 
          fcmToken: token, 
          notificationPermission: 'granted' 
        });
        await get().registerFCMToken(token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  },

  // Register FCM token with backend
  registerFCMToken: async (token) => {
    set({ isRegisteringToken: true });
    try {
      const fcmToken = token || get().fcmToken;
      if (!fcmToken) {
        console.log('No FCM token available');
        return;
      }

      await axiosInstance.post('/notifications/fcm-token', {
        token: fcmToken,
        platform: 'web',
        deviceId: `web-${navigator.userAgent.slice(0, 50)}`
      });

      console.log('FCM token registered successfully');
      set({ fcmToken });
    } catch (error) {
      console.error('Error registering FCM token:', error);
    } finally {
      set({ isRegisteringToken: false });
    }
  },

  // Remove FCM token on logout
  removeFCMToken: async () => {
    try {
      const { fcmToken } = get();
      if (fcmToken) {
        await axiosInstance.delete('/notifications/fcm-token', {
          data: {
            token: fcmToken,
            deviceId: `web-${navigator.userAgent.slice(0, 50)}`
          }
        });
        set({ fcmToken: null });
        console.log('FCM token removed successfully');
      }
    } catch (error) {
      console.error('Error removing FCM token:', error);
    }
  },

  // Get unread notifications
  getUnreadNotifications: async () => {
    set({ isLoadingNotifications: true });
    try {
      const response = await axiosInstance.get('/notifications/unread');
      set({ unreadNotifications: response.data.notifications });
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    } finally {
      set({ isLoadingNotifications: false });
    }
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    try {
      await axiosInstance.put(`/notifications/read/${notificationId}`);
      set(state => ({
        unreadNotifications: state.unreadNotifications.filter(
          n => n._id !== notificationId
        )
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  // Clear all notifications
  clearAllNotifications: async () => {
    try {
      await axiosInstance.delete('/notifications/clear');
      set({ unreadNotifications: [] });
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  },

  // Send test notification
  sendTestNotification: async () => {
    try {
      await axiosInstance.post('/notifications/test', {
        title: 'Test Notification',
        body: 'This is a test notification from Talkora!',
        type: 'test'
      });
      toast.success('Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    }
  },

  // Handle foreground notifications
  handleForegroundNotification: (payload) => {
    const { notification, data } = payload;
    
    // Show toast notification
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">T</span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {notification.title}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {notification.body}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      ),
      {
        duration: 6000,
        position: 'top-right',
      }
    );

    // Add to unread notifications
    set(state => ({
      unreadNotifications: [
        ...state.unreadNotifications,
        {
          _id: Date.now().toString(),
          type: data.type || 'message',
          title: notification.title,
          body: notification.body,
          data: data,
          read: false,
          createdAt: new Date().toISOString()
        }
      ]
    }));
  },

  // Setup notification listeners
  setupNotificationListeners: () => {
    const authStore = window.authStore || {};
    const socket = authStore.socket;

    if (socket) {
      // Listen for new notification events from Socket.IO
      socket.on('notification', (notificationData) => {
        get().handleForegroundNotification({
          notification: {
            title: notificationData.title,
            body: notificationData.body
          },
          data: notificationData.data || {}
        });
      });
    }
  },

  // Cleanup notification listeners
  cleanupNotificationListeners: () => {
    const authStore = window.authStore || {};
    const socket = authStore.socket;

    if (socket) {
      socket.off('notification');
    }
  }
}));
