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

export const playNotificationSound = () => {
  try {
    const audio = new Audio('/notification.wav');
    audio.volume = 1; // 30% volume to avoid being too loud
    audio.play().catch(e => console.error("Audio play failed:", e));
  } catch (error) {
    console.error("Error loading audio:", error);
  }
};