export function formatMessageTime(date) {
    return new Date(date).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

export function formatDate(date) {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
        return "Today";
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    } else {
        return messageDate.toLocaleDateString();
    }
}

export function formatRelativeTime(date) {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInSeconds = Math.floor((now - messageDate) / 1000);
    
    if (diffInSeconds < 60) {
        return "Just now";
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d ago`;
    }
}

export function truncateText(text, maxLength = 50) {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
}

export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validatePassword(password) {
    return password.length >= 6;
}

export function getInitials(name) {
    if (!name) return "";
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function isOnline(userId, onlineUsers) {
    return onlineUsers.includes(userId);
}

export function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Handle deleted users in UI
export function getUserDisplayName(user, onlineUsers = []) {
  if (!user) return "Unknown User";
  
  if (user.isDeleted) {
    return "Talkora User";
  }
  
  return user.fullname || "Unknown User";
}

export function getUserProfilePic(user) {
  if (!user) return "";
  
  if (user.isDeleted) {
    return "";
  }
  
  return user.profilePic || "";
}

export function isAccountDeleted(user) {
  return user && user.isDeleted === true;
}

export function formatUserForDisplay(user) {
  if (!user) return null;
  
  return {
    ...user,
    fullname: getUserDisplayName(user),
    profilePic: getUserProfilePic(user)
  };
}

// Audio context management
let audioContext = null;
let audioEnabled = false;

// Tab visibility tracking
let isTabVisible = true;
let visibilityChangeListener = null;

export const initializeAudio = () => {
  const enableAudio = () => {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      audioEnabled = true;
      console.log("✅ Audio context initialized");
      
      // Remove the event listener after first interaction
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
    }
  };

  // Listen for first user interaction
  document.addEventListener('click', enableAudio, { once: true });
  document.addEventListener('touchstart', enableAudio, { once: true });
};

// Initialize tab visibility tracking
export const initializeTabVisibility = () => {
  // Remove existing listener if any
  if (visibilityChangeListener) {
    document.removeEventListener('visibilitychange', visibilityChangeListener);
  }

  visibilityChangeListener = () => {
    isTabVisible = !document.hidden;
    console.log(`🖥️ Tab visibility changed: ${isTabVisible ? 'visible' : 'hidden'}`);
  };

  document.addEventListener('visibilitychange', visibilityChangeListener);
  
  // Set initial state
  isTabVisible = !document.hidden;
  console.log(`🖥️ Initial tab visibility: ${isTabVisible ? 'visible' : 'hidden'}`);
};

// Clean up tab visibility listener
export const cleanupTabVisibility = () => {
  if (visibilityChangeListener) {
    document.removeEventListener('visibilitychange', visibilityChangeListener);
    visibilityChangeListener = null;
  }
};

// Check if user is currently on Talkora tab
export const isUserOnTalkoTab = () => {
  return isTabVisible;
};

// Play notification sound for messages when user is on other tabs OR different chat
export const playNotificationSound = () => {
  try {
    console.log("🔊 playNotificationSound called");
    console.log("🔊 Audio enabled:", audioEnabled);
    console.log("🔊 Tab visible:", isTabVisible);
    
    // Check if audio is enabled
    if (!audioEnabled) {
      console.log("⚠️ Audio not yet enabled - waiting for user interaction");
      return;
    }

    console.log("🔊 Playing notification.mp3...");
    
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.7;
    
    // Add event listeners for debugging
    audio.addEventListener('loadstart', () => console.log("📁 Notification audio loading started"));
    audio.addEventListener('canplay', () => console.log("✅ Notification audio can play"));
    audio.addEventListener('play', () => console.log("▶️ Notification audio started playing"));
    audio.addEventListener('ended', () => console.log("⏹️ Notification audio finished playing"));
    audio.addEventListener('error', (e) => console.error("❌ Notification audio error:", e));
    
    audio.play().catch(error => {
      console.error("❌ Notification audio play failed:", error);
      
      // Try alternative notification methods
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Message', {
          body: 'You have received a new message',
          icon: '/favicon.ico'
        });
      }
    });
  } catch (error) {
    console.error("❌ Error creating notification audio:", error);
  }
};

// Play confirm sound for messages when user is in the same chat AND on Talkora tab
export const playConfirmSound = () => {
  try {
    console.log("🔊 playConfirmSound called");
    console.log("🔊 Audio enabled:", audioEnabled);
    console.log("🔊 Tab visible:", isTabVisible);
    
    // Check if audio is enabled
    if (!audioEnabled) {
      console.log("⚠️ Audio not yet enabled - waiting for user interaction");
      return;
    }

    console.log("🔊 User is in active chat - playing Confirm.wav...");
    
    const audio = new Audio('/Confirm.wav');
    audio.volume = 0.5; // Slightly lower volume for in-chat notifications
    
    // Add event listeners for debugging
    audio.addEventListener('loadstart', () => console.log("📁 Confirm audio loading started"));
    audio.addEventListener('canplay', () => console.log("✅ Confirm audio can play"));
    audio.addEventListener('play', () => console.log("▶️ Confirm audio started playing"));
    audio.addEventListener('ended', () => console.log("⏹️ Confirm audio finished playing"));
    audio.addEventListener('error', (e) => console.error("❌ Confirm audio error:", e));
    
    audio.play().catch(error => {
      console.error("❌ Confirm audio play failed:", error);
    });
  } catch (error) {
    console.error("❌ Error creating confirm audio:", error);
  }
};