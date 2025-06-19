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
    return "Talko User";
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

export const playNotificationSound = () => {
  try {
    console.log("🔊 playNotificationSound called");
    console.log("🔊 Audio enabled:", audioEnabled);
    
    // Check if audio is enabled
    if (!audioEnabled) {
      console.log("⚠️ Audio not yet enabled - waiting for user interaction");
      return;
    }

    console.log("🔊 Attempting to play notification sound...");
    
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.7;
    
    // Add event listeners for debugging
    audio.addEventListener('loadstart', () => console.log("📁 Audio loading started"));
    audio.addEventListener('canplay', () => console.log("✅ Audio can play"));
    audio.addEventListener('play', () => console.log("▶️ Audio started playing"));
    audio.addEventListener('ended', () => console.log("⏹️ Audio finished playing"));
    audio.addEventListener('error', (e) => console.error("❌ Audio error:", e));
    
    audio.play().catch(error => {
      console.error("❌ Audio play failed:", error);
      
      // Try alternative notification methods
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Message', {
          body: 'You have received a new message',
          icon: '/favicon.ico'
        });
      }
    });
  } catch (error) {
    console.error("❌ Error creating audio:", error);
  }
};