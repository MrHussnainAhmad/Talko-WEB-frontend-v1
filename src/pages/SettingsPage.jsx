import React, { useState, useEffect } from "react";
import { useThemeStore } from "../store/useThemeStore.js";
import { THEMES } from "../constants/index.js";
import { useNotificationStore } from "../store/useNotificationStore.jsx";
import { Bell, BellOff, TestTube, Trash2, Settings, AlertCircle, Chrome, Compass, Volume2, VolumeX, Unlock } from "lucide-react";
import { soundManager } from '../utils/soundManager';
import { useAuthStore } from "../store/useAuthStore";
import { useSettingsStore } from "../store/useSettingsStore.js";

const PREVIEW_MESSAGES = [
  {
    id: 1,
    content: "This is a preview message",
    sender: "user",
  },
  {
    id: 2,
    content: "This is another preview message",
    sender: "assistant",
  },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const notificationStore = useNotificationStore();
  const {
    notificationPermission,
    fcmToken,
    isRegisteringToken,
    requestPermission,
    sendTestNotification,
    clearAllNotifications,
    unreadNotifications,
    getUnreadNotifications
  } = notificationStore;

  const authStore = useAuthStore();
  const { blockedUsers, getBlockedUsers, unblockUser } = authStore;

  const settingsStore = useSettingsStore();
  const { inChatSoundEnabled, setInChatSoundEnabled } = settingsStore;
  
  const [browserInfo, setBrowserInfo] = useState({ browser: 'unknown', isBrave: false });
  const [showBraveGuide, setShowBraveGuide] = useState(false);
  const [soundStatus, setSoundStatus] = useState({ isSpamBlocked: false, notificationCount: 0 });
  
  // Detect browser on component mount
  useEffect(() => {
    const detectBrowser = async () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const vendor = navigator.vendor?.toLowerCase() || '';
      let detectedBrowser = 'unknown';
      let isBrave = false;
      
      // Check for Brave
      if (navigator.brave && await navigator.brave.isBrave()) {
        detectedBrowser = 'brave';
        isBrave = true;
      } else if (userAgent.includes('firefox')) {
        detectedBrowser = 'firefox';
      } else if (userAgent.includes('edg')) {
        detectedBrowser = 'edge';
      } else if (userAgent.includes('chrome') && vendor.includes('google')) {
        detectedBrowser = 'chrome';
      } else if (userAgent.includes('safari') && vendor.includes('apple')) {
        detectedBrowser = 'safari';
      }
      
      setBrowserInfo({ browser: detectedBrowser, isBrave });
    };
    
    detectBrowser();
  }, []);
  
  React.useEffect(() => {
    getUnreadNotifications();
    getBlockedUsers();
    
    // Update sound status periodically
    const updateSoundStatus = () => {
      setSoundStatus(soundManager.getStatus());
    };
    
    updateSoundStatus();
    const interval = setInterval(updateSoundStatus, 1000);
    
    return () => clearInterval(interval);
  }, [getUnreadNotifications, getBlockedUsers]);
  
  const handleRequestPermission = async () => {
    const success = await requestPermission();
    if (success) {
      // Permission granted successfully handled in the store
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

  return (
  <div className="h-screen container mx-auto px-4 pt-20 max-w-5xl">
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Theme</h2>
        <p className="text-sm text-base-content/70">
          Choose a theme for your chat!
        </p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {THEMES.map((t) => (
          <button
            key={t}
            className={`group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors ${
              theme === t ? "bg-base-200" : "hover:bg-base-200/50"
            }`}
            onClick={() => setTheme(t)}
          >
            <div
              className="relative h-8 w-full rounded-md overflow-hidden"
              data-theme={t}
            >
              <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                <div className="rounded bg-primary"></div>
                <div className="rounded bg-secondary"></div>
                <div className="rounded bg-accent"></div>
                <div className="rounded bg-neutral"></div>
              </div>
            </div>
            <span className="text-[11px] font-medium truncate w-full text-center">
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </span>
          </button>
        ))}
      </div>
      
      {/* Notification Settings Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </h2>
          <p className="text-sm text-base-content/70">
            Manage your notification preferences and settings.
          </p>
        </div>
        
        {/* Browser Detection Alert for Brave */}
        {browserInfo.isBrave && (
          <div className="alert alert-warning shadow-lg">
            <AlertCircle className="h-5 w-5" />
            <div className="flex-1">
              <h3 className="font-semibold">Brave Browser Detected</h3>
              <p className="text-sm mt-1">
                Brave's privacy shields may block notifications. You might need to disable shields for this site.
              </p>
            </div>
            <button 
              onClick={() => setShowBraveGuide(true)}
              className="btn btn-sm btn-outline"
            >
              View Guide
            </button>
          </div>
        )}
        
        {/* Brave Setup Guide Modal */}
        {showBraveGuide && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-base-100 rounded-lg max-w-lg w-full p-6 space-y-4">
              <h3 className="text-lg font-semibold">Enable Notifications in Brave</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-primary">1.</span>
                  <p>Click the Brave shield icon (lion) in the address bar</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-primary">2.</span>
                  <p>Turn shields OFF for this site (simplest solution)</p>
                </div>
                <div className="divider">OR</div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-primary">3.</span>
                  <p>Keep shields ON but go to Settings → Privacy → Use Google services for push messaging → Enable</p>
                </div>
              </div>
              <div className="alert alert-info">
                <p className="text-sm">
                  <strong>Alternative:</strong> Use Chrome or Firefox for full notification support without configuration.
                </p>
              </div>
              <button 
                onClick={() => setShowBraveGuide(false)}
                className="btn btn-primary w-full"
              >
                Got it
              </button>
            </div>
          </div>
        )}
        
        {/* Permission Status Card */}
        <div className="bg-base-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {notificationPermission === 'granted' ? (
                <Bell className="h-6 w-6 text-green-600" />
              ) : (
                <BellOff className="h-6 w-6 text-gray-400" />
              )}
              <div>
                <h3 className="font-medium text-base-content">
                  Browser Notifications
                </h3>
                <p className="text-sm text-base-content/70">
                  Status: <span className={getPermissionStatusColor()}>
                    {getPermissionStatusText()}
                  </span>
                  {browserInfo.browser !== 'unknown' && (
                    <span className="text-xs text-base-content/50 ml-2">
                      ({browserInfo.browser})
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            {notificationPermission !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                disabled={isRegisteringToken}
                className="btn btn-primary btn-sm"
              >
                {isRegisteringToken ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>Enable Notifications</>
                )}
              </button>
            )}
          </div>
          
          {/* FCM Token Status */}
          {notificationPermission === 'granted' && (
            <div className="pt-3 border-t border-base-300">
              <p className="text-xs text-base-content/60">
                Push notifications: {fcmToken ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          )}
        </div>
        
        {/* Sound Status */}
        {notificationPermission === 'granted' && (
          <div className="bg-base-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              {soundStatus.isSpamBlocked ? (
                <VolumeX className="h-5 w-5 text-red-600" />
              ) : (
                <Volume2 className="h-5 w-5 text-green-600" />
              )}
              <div>
                <h4 className="font-medium text-base-content">Sound Status</h4>
                <p className="text-sm text-base-content/70">
                  {soundStatus.isSpamBlocked ? (
                    <span className="text-red-600">
                      Muted for {Math.ceil(soundStatus.remainingBlockTime / 1000)}s (spam protection)
                    </span>
                  ) : (
                    <span className="text-green-600">
                      Sounds enabled ({soundStatus.notificationCount}/4 notifications)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => soundManager.testSound()}
                className="btn btn-outline btn-sm flex-1"
                disabled={soundStatus.isSpamBlocked}
              >
                Test Sound
              </button>
              <button
                onClick={() => soundManager.forceReset()}
                className="btn btn-outline btn-sm flex-1"
              >
                Reset Counter
              </button>
            </div>
          </div>
        )}
        
        {/* In-Chat Sound Settings */}
        <div className="bg-base-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            {inChatSoundEnabled ? (
              <Volume2 className="h-5 w-5 text-green-600" />
            ) : (
              <VolumeX className="h-5 w-5 text-red-600" />
            )}
            <div>
              <h4 className="font-medium text-base-content">In-Chat Sound</h4>
              <p className="text-sm text-base-content/70">Toggle sound for message sending and receiving in chat</p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={inChatSoundEnabled}
              onChange={(e) => setInChatSoundEnabled(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm text-base-content">
              {inChatSoundEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>

        {/* Blocked Users Section */}
        {blockedUsers.length > 0 && (
          <div className="bg-base-200 rounded-lg p-4">
            <h4 className="font-medium text-base-content mb-3 flex items-center gap-2">
              <Unlock className="h-4 w-4" />
              Blocked Users ({blockedUsers.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {blockedUsers.map((user) => (
                <div key={user._id} className="flex items-center gap-3 p-2 bg-base-100 rounded-lg">
                  <img
                    src={user.profilePic || '/Profile.png'}
                    alt={user.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1">
                    <span className="text-base-content font-medium">
                      {user.fullname || user.username}
                    </span>
                    <p className="text-xs text-base-content/70">@{user.username}</p>
                  </div>
                  <button
                    onClick={() => unblockUser(user._id)}
                    className="btn btn-outline btn-error btn-xs"
                  >
                    <Unlock className="h-3 w-3 mr-1" />
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Notification Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Test Notification */}
          {notificationPermission === 'granted' && (
            <div className="bg-base-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <TestTube className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-base-content">Test Notification</h4>
                  <p className="text-sm text-base-content/70">Send a test notification</p>
                </div>
              </div>
              <button
                onClick={sendTestNotification}
                className="btn btn-outline btn-sm w-full"
              >
                Send Test
              </button>
            </div>
          )}
          
          {/* Clear Notifications */}
          {unreadNotifications.length > 0 && (
            <div className="bg-base-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Trash2 className="h-5 w-5 text-red-600" />
                <div>
                  <h4 className="font-medium text-base-content">Clear All</h4>
                  <p className="text-sm text-base-content/70">
                    {unreadNotifications.length} unread notifications
                  </p>
                </div>
              </div>
              <button
                onClick={clearAllNotifications}
                className="btn btn-outline btn-error btn-sm w-full"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
        
        {/* Notification History */}
        {unreadNotifications.length > 0 && (
          <div className="bg-base-200 rounded-lg p-4">
            <h4 className="font-medium text-base-content mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Recent Notifications ({unreadNotifications.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {unreadNotifications.slice(0, 5).map((notification) => (
                <div
                  key={notification._id}
                  className="bg-base-100 rounded-lg p-3 border border-base-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-base-content">
                        {notification.title}
                      </p>
                      <p className="text-xs text-base-content/70 mt-1">
                        {notification.body}
                      </p>
                      <p className="text-xs text-base-content/50 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {unreadNotifications.length > 5 && (
                <p className="text-xs text-base-content/60 text-center pt-2">
                  +{unreadNotifications.length - 5} more notifications
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Notification Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            How notifications work
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>• Real-time notifications when you're online</li>
            <li>• Push notifications when you're away from the app</li>
            <li>• Stored notifications for when you return</li>
            <li>• Different sounds for in-chat vs out-of-chat messages</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  );
};

export default SettingsPage;
