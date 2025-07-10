import { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X, TestTube } from 'lucide-react';
import { useNotificationStore } from '../store/useNotificationStore';
import toast from 'react-hot-toast';

const NotificationSettings = ({ isOpen, onClose }) => {
  const {
    notificationPermission,
    fcmToken,
    isRegisteringToken,
    requestPermission,
    sendTestNotification,
    clearAllNotifications,
    unreadNotifications,
    getUnreadNotifications
  } = useNotificationStore();

  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getUnreadNotifications();
    }
  }, [isOpen, getUnreadNotifications]);

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    try {
      const success = await requestPermission();
      if (success) {
        toast.success('Notifications enabled successfully!');
      } else {
        toast.error('Failed to enable notifications. Please check your browser settings.');
      }
    } catch (error) {
      toast.error('Failed to enable notifications');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const getPermissionStatusColor = () => {
    switch (notificationPermission) {
      case 'granted':
        return 'text-green-600';
      case 'denied':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getPermissionStatusText = () => {
    switch (notificationPermission) {
      case 'granted':
        return 'Enabled';
      case 'denied':
        return 'Denied';
      default:
        return 'Not requested';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Notification Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Permission Status */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Browser Notifications
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Status: <span className={getPermissionStatusColor()}>
                    {getPermissionStatusText()}
                  </span>
                </p>
              </div>
              <div className="flex items-center">
                {notificationPermission === 'granted' ? (
                  <Bell className="h-6 w-6 text-green-600" />
                ) : (
                  <BellOff className="h-6 w-6 text-gray-400" />
                )}
              </div>
            </div>

            {/* FCM Token Status */}
            {notificationPermission === 'granted' && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Push notifications: {fcmToken ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            )}
          </div>

          {/* Enable Notifications Button */}
          {notificationPermission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              disabled={isRequestingPermission || isRegisteringToken}
              className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isRequestingPermission || isRegisteringToken ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Bell className="mr-2 h-4 w-4" />
              )}
              Enable Notifications
            </button>
          )}

          {/* Test Notification */}
          {notificationPermission === 'granted' && (
            <button
              onClick={sendTestNotification}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center"
            >
              <TestTube className="mr-2 h-4 w-4" />
              Send Test Notification
            </button>
          )}

          {/* Unread Notifications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Unread Notifications ({unreadNotifications.length})
              </h3>
              {unreadNotifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {unreadNotifications.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No unread notifications
                </p>
              ) : (
                unreadNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {notification.body}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
              How notifications work:
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <li>• Real-time notifications when you're online</li>
              <li>• Push notifications when you're away</li>
              <li>• Stored notifications for when you return</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
