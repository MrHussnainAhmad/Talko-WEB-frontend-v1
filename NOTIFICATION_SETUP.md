# Notification System Setup Guide

This guide will help you set up Firebase Cloud Messaging (FCM) for web push notifications in your Talkora frontend.

## Prerequisites

1. A Firebase project with Cloud Messaging enabled
2. Web app configuration from Firebase Console
3. VAPID key pair generated in Firebase Console

## Setup Steps

### 1. Firebase Project Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project or create a new one
3. Go to Project Settings → General
4. Add a web app if you haven't already
5. Copy the Firebase configuration object

### 2. Environment Variables

Create a `.env` file in the frontend directory and add your Firebase configuration:

```bash
# Firebase Configuration for Web Push Notifications
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_public_key

# API Configuration
VITE_API_URL=https://talkora-private-chat.up.railway.app
```

### 3. Generate VAPID Keys

1. In Firebase Console, go to Project Settings → Cloud Messaging
2. In the "Web configuration" section, click "Generate key pair"
3. Copy the public key and add it to your `.env` file as `VITE_FIREBASE_VAPID_KEY`

### 4. Update Service Worker

Update the Firebase configuration in `public/firebase-messaging-sw.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN", 
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 5. Install Dependencies

Make sure Firebase is installed:

```bash
npm install firebase
```

### 6. Backend Configuration

Ensure your backend has the matching Firebase configuration:

1. Download the service account key from Firebase Console
2. Place it in your backend project
3. Update the backend `.env` file:

```bash
ENABLE_PUSH_NOTIFICATIONS=true
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
```

## Features

### Real-time Notifications
- Socket.IO for immediate notifications when users are online
- Automatic fallback to push notifications when offline

### Push Notifications
- Background notifications when the app is closed
- Notification click handling to open the app
- Custom notification icons and actions

### Notification Management
- Unread notification tracking
- Notification history
- Clear all notifications functionality
- Test notification feature

### Granular Controls
- Enable/disable notifications per type
- Browser permission management
- Feature toggles for different notification methods

## Usage

### In Components

```javascript
import { useNotificationStore } from '../store/useNotificationStore';

const MyComponent = () => {
  const { 
    requestPermission, 
    sendTestNotification,
    unreadNotifications 
  } = useNotificationStore();

  const handleEnableNotifications = async () => {
    const success = await requestPermission();
    if (success) {
      console.log('Notifications enabled!');
    }
  };

  return (
    <div>
      <button onClick={handleEnableNotifications}>
        Enable Notifications
      </button>
      <button onClick={sendTestNotification}>
        Send Test Notification
      </button>
      <p>Unread: {unreadNotifications.length}</p>
    </div>
  );
};
```

### Permission Handling

The notification system automatically:
1. Checks browser permission status on login
2. Registers FCM token when permission is granted
3. Handles permission denied gracefully
4. Provides UI to request permission when needed

## Troubleshooting

### Common Issues

1. **Permission Denied**: 
   - Check browser settings for notification permissions
   - Try incognito mode to reset permissions
   - Ensure HTTPS is used (required for service workers)

2. **Service Worker Not Registering**:
   - Check that `firebase-messaging-sw.js` is in the `public` folder
   - Verify the Firebase configuration in the service worker
   - Check browser console for errors

3. **Notifications Not Received**:
   - Verify FCM token is registered with backend
   - Check Firebase project has Cloud Messaging enabled
   - Ensure VAPID key is correctly configured

4. **Background Notifications Not Working**:
   - Service worker must be properly configured
   - Check that notifications work when tab is active first
   - Verify browser supports background notifications

### Development Tips

1. **Testing**: Use the "Send Test Notification" button in notification settings
2. **Debugging**: Check browser console and network tab for errors
3. **Service Worker**: Use browser dev tools → Application → Service Workers to debug
4. **Permissions**: Test permission flow in different browsers

## Browser Support

- Chrome: Full support
- Firefox: Full support
- Safari: Limited support (no background notifications)
- Edge: Full support

## Security Notes

- Never expose Firebase private keys in frontend code
- Use environment variables for all sensitive configuration
- VAPID keys can be public (they're meant to be)
- Service account keys should only be in the backend

## Integration with Backend

The frontend automatically:
1. Registers FCM tokens with the backend on login
2. Removes tokens on logout
3. Handles token refresh
4. Receives real-time notifications via Socket.IO
5. Falls back to push notifications for offline users
