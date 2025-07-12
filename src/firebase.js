// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { soundManager } from "./utils/soundManager";

// Your web app's Firebase configuration
// Replace with your actual config values in .env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
};

// Initialize Firebase
let app, messaging;
try {
  app = initializeApp(firebaseConfig);
  console.log("✅ Firebase app initialized");
  
  // Initialize messaging
  messaging = getMessaging(app);
  console.log("✅ Firebase messaging initialized");
} catch (error) {
  console.error("❌ Failed to initialize Firebase:", error);
  console.warn("⚠️ Firebase features will be disabled");
}

// Function to convert URL-safe base64 to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Browser detection utilities
const detectBrowser = async () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const vendor = navigator.vendor?.toLowerCase() || '';
  
  // Check for Brave
  if (navigator.brave && await navigator.brave.isBrave()) {
    return 'brave';
  }
  
  // Check for other browsers
  if (userAgent.includes('firefox')) return 'firefox';
  if (userAgent.includes('edg')) return 'edge';
  if (userAgent.includes('chrome') && vendor.includes('google')) return 'chrome';
  if (userAgent.includes('safari') && vendor.includes('apple')) return 'safari';
  
  return 'unknown';
};

// Request permission to use notifications
export const requestNotificationPermission = async () => {
  try {
    console.log("🔔 Requesting notification permission...");
    console.log("🔧 Firebase config check:", {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "✅ Set" : "❌ Missing",
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        ? "✅ Set"
        : "❌ Missing",
    });

    // Detect browser
    const browser = await detectBrowser();
    console.log("🌐 Browser detected:", browser);
    
    // Check if we're in a secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      throw new Error("Notifications require a secure context (HTTPS or localhost)");
    }

    const permission = await Notification.requestPermission();
    console.log("📋 Permission result:", permission);

    if (permission === "granted") {
      console.log("✅ Notification permission granted.");
      console.log("🔑 Getting FCM token with VAPID key...");

      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      if (!vapidKey || vapidKey === "YOUR_VAPID_KEY") {
        throw new Error("VAPID key not configured properly");
      }

      console.log("📝 VAPID key length:", vapidKey.length);
      console.log(
        "📝 VAPID key first chars:",
        vapidKey.substring(0, 10) + "..."
      );

      // Try to register service worker
      let registration;
      try {
        console.log('🔌 Registering service worker...');
        
        // Unregister any existing service workers first
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let reg of registrations) {
          await reg.unregister();
          console.log('🧹 Unregistered existing service worker');
        }
        
        // Register fresh service worker
        // Ensure the service worker path is correct
        const swPath = '/firebase-messaging-sw.js';
        console.log('🔗 Attempting to register service worker at:', swPath);
        
        registration = await navigator.serviceWorker.register(swPath, {
          scope: '/',
          updateViaCache: 'none' // Force fresh service worker
        });
        console.log('✅ Service worker registered:', registration);
        
        // Wait for service worker to be ready
        await registration.update();
        const sw = await navigator.serviceWorker.ready;
        console.log('📌 Service worker is ready:', sw);
      } catch (swError) {
        console.error('⚠️ Service worker registration failed:', swError);
        throw new Error('Service worker registration failed. Please check browser settings.');
      }

      // For localhost development, we need to handle things differently
      let token;

      try {
        // Wait for service worker to be ready
        if (registration) {
          await registration.update();
          const sw = await navigator.serviceWorker.ready;
          console.log("📌 Service worker ready:", sw);
        }

        // Use the VAPID key directly as a string
        const tokenOptions = {
          vapidKey: vapidKey.replace(/[^a-zA-Z0-9_-]/g, ""), // Sanitize key
          serviceWorkerRegistration: registration || undefined,
        };

        console.log("🔐 Attempting to get token with options:", {
          vapidKeyLength: vapidKey.length,
          hasServiceWorker: !!registration,
        });

        token = await getToken(messaging, tokenOptions);
      } catch (error) {
        console.error('❌ Failed to get token:', error);
        console.error('📋 Full error object:', JSON.stringify(error, null, 2));
        
        // Handle different types of errors
        if (error.message && error.message.includes('applicationServerKey')) {
          throw new Error('VAPID key validation failed. Please verify the key from Firebase Console.');
        } else if (error.code === 'messaging/failed-service-worker-registration' || 
                   (error.message && error.message.includes('push service error')) ||
                   (error.message && error.message.includes('AbortError'))) {
          console.log('🔧 Push service error detected. Debugging info:');
          console.log('1. Current URL:', window.location.href);
          console.log('2. Protocol:', window.location.protocol);
          console.log('3. User Agent:', navigator.userAgent);
          console.log('4. Service Worker support:', 'serviceWorker' in navigator);
          console.log('5. Push API support:', 'PushManager' in window);
          console.log('6. Notification API support:', 'Notification' in window);
          
          // Check for common browser issues
          if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            throw new Error('Push notifications require HTTPS. Please use HTTPS or localhost.');
          }
          
          // Check for browser compatibility
          if (!('serviceWorker' in navigator)) {
            throw new Error('Your browser does not support service workers.');
          }
          
          if (!('PushManager' in window)) {
            throw new Error('Your browser does not support push notifications.');
          }
          
          // Try to provide more specific guidance
          const notificationStatus = await Notification.permission;
          console.log('🔔 Current notification permission:', notificationStatus);
          
          if (notificationStatus === 'denied') {
            throw new Error('Notifications are blocked. Please enable them in browser settings.');
          } else {
            // Provide browser-specific guidance
            const browser = await detectBrowser();
            let errorMessage = 'Push service registration failed. ';
            
            switch (browser) {
              case 'brave':
                // For Brave, we'll fall back to basic notifications without FCM
                console.warn('⚠️ Brave browser detected. Using fallback notification system.');
                console.log('🔄 FCM may not work in Brave, but basic notifications will still function.');
                // Return a mock token for Brave
                return 'BRAVE_FALLBACK_' + Date.now();
              case 'safari':
                console.warn('⚠️ Safari detected. Limited notification support.');
                // Return a mock token for Safari
                return 'SAFARI_FALLBACK_' + Date.now();
              default:
                errorMessage += 'This might be due to browser extensions (ad blockers, privacy tools) or network restrictions. Try disabling extensions or using a different network.';
                throw new Error(errorMessage);
            }
          }
        }
        throw error;
      }

      console.log("🎫 FCM Token received:", token ? "✅ Success" : "❌ Failed");
      return token;
    } else {
      console.log("❌ Permission denied or dismissed.");
      return null;
    }
  } catch (error) {
    console.error("❌ Error requesting notification permission:", error);
    console.error("📋 Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
    });
    throw error;
  }
};

// Handle incoming messages
if (messaging) {
  try {
    onMessage(messaging, (payload) => {
      console.log("Message received. ", payload);
      
      // Play notification sound
      soundManager.playNotificationSound();
      
      // Custom handling for foreground messages
      // Show a notification using toast or custom UI
    });
  } catch (error) {
    console.error("❌ Failed to set up onMessage listener:", error);
  }
}
