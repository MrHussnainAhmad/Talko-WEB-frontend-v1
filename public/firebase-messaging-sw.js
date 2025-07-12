// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
// Replace with your actual config values
const firebaseConfig = {
  apiKey: "AIzaSyBwAblajJCQUJBXZVXT81Uo4mBzWRx5ji0",
  authDomain: "talkora-14e7e.firebaseapp.com", 
  projectId: "talkora-14e7e",
  storageBucket: "talkora-14e7e.firebasestorage.app",
  messagingSenderId: "65446466613",
  appId: "1:65446466613:web:12aa71976175fb1d474d7c"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/Logo.png',
    badge: '/Logo.png',
    data: payload.data,
    requireInteraction: false,
    silent: false, // Enable sound
    tag: 'talkora-notification',
    actions: [
      {
        action: 'open',
        title: 'Open Talkora'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ]
  };

  // Play notification sound using Audio API in service worker
  // Note: Audio API is limited in service workers, so we'll rely on the notification sound
  // The actual sound management will be handled by the main thread
  
  self.registration.showNotification(notificationTitle, notificationOptions);
  
  // Send a message to the main thread to play sound if the app is in background
  // This helps maintain our sound management logic
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_NOTIFICATION_SOUND',
        payload: payload
      });
    });
  });
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('Notification click received.');

  event.notification.close();

  if (event.action === 'open') {
    // Open the app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(function(clientList) {
        // Check if there is already a window/tab open with the target URL
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, then open the target URL in a new window/tab
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});
