// Sound manager with anti-spam logic for notification sounds
import toast from 'react-hot-toast';

class SoundManager {
  constructor() {
    this.notificationAudio = null;
    this.notificationCount = 0;
    this.lastNotificationTime = 0;
    this.isSpamBlocked = false;
    this.spamBlockEndTime = 0;
    
    // Initialize audio
    this.initializeAudio();
  }

  initializeAudio() {
    try {
      // Preload notification sound
      this.notificationAudio = new Audio('/notification.mp3');
      this.notificationAudio.preload = 'auto';
      this.notificationAudio.volume = 0.7; // Set volume to 70%
      
      // Handle audio loading errors
      this.notificationAudio.onerror = (error) => {
        console.warn('Failed to load notification sound:', error);
        this.notificationAudio = null;
      };
    } catch (error) {
      console.warn('Failed to initialize notification sound:', error);
      this.notificationAudio = null;
    }
  }

  playNotificationSound() {
    // Check if we have audio available
    if (!this.notificationAudio) {
      console.warn('Notification sound not available');
      return;
    }

    const currentTime = Date.now();

    // Check if we're in spam block period
    if (this.isSpamBlocked && currentTime < this.spamBlockEndTime) {
      console.log('Notification sound blocked due to spam protection');
      return;
    }

    // If spam block period has ended, reset counters
    if (this.isSpamBlocked && currentTime >= this.spamBlockEndTime) {
      this.resetSpamProtection();
    }

    // Reset counter if more than 30 seconds have passed since last notification
    if (currentTime - this.lastNotificationTime > 30000) {
      this.notificationCount = 0;
    }

    // Increment notification count
    this.notificationCount++;
    this.lastNotificationTime = currentTime;

    // Play sound for first 4 notifications
    if (this.notificationCount <= 4) {
      this.playSound();
      console.log(`Notification sound played (${this.notificationCount}/4)`);
    } else {
      // After 4 notifications, block sound for 10 seconds
      this.activateSpamProtection();
      console.log('Notification sound blocked - too many notifications (spam protection activated)');
    }
  }

  playSound() {
    if (!this.notificationAudio) return;

    try {
      // Reset audio to beginning
      this.notificationAudio.currentTime = 0;
      
      // Play the sound
      const playPromise = this.notificationAudio.play();
      
      // Handle play promise (required for some browsers)
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Failed to play notification sound:', error);
        });
      }
    } catch (error) {
      console.warn('Error playing notification sound:', error);
    }
  }

  activateSpamProtection() {
    this.isSpamBlocked = true;
    this.spamBlockEndTime = Date.now() + 10000; // Block for 10 seconds
    
    // Log when spam protection will end
    console.log('Spam protection activated. Sound will be available again in 10 seconds.');
    
    // Optional: Show a toast notification about spam protection
    try {
      toast('🔇 Notification sounds temporarily muted (too many notifications)', {
        duration: 3000,
        position: 'bottom-right',
        style: {
          fontSize: '12px',
          padding: '8px 12px',
          marginTop: '20px'
        }
      });
    } catch (error) {
      console.warn('Could not show toast notification:', error);
    }
  }

  resetSpamProtection() {
    this.isSpamBlocked = false;
    this.spamBlockEndTime = 0;
    this.notificationCount = 0;
    console.log('Spam protection reset. Notification sounds are now available.');
    
    // Show toast notification when sounds are re-enabled
    try {
      toast('🔊 Notification sounds re-enabled!', {
        duration: 2000,
        position: 'bottom-right',
        style: {
          fontSize: '12px',
          padding: '8px 12px',
          marginTop: '20px'
        }
      });
    } catch (error) {
      console.warn('Could not show toast notification:', error);
    }
  }

  // Method to manually reset if needed
  forceReset() {
    this.resetSpamProtection();
    console.log('Notification sound manager manually reset');
  }

  // Method to check current status
  getStatus() {
    const currentTime = Date.now();
    const remainingBlockTime = this.isSpamBlocked ? 
      Math.max(0, this.spamBlockEndTime - currentTime) : 0;
    
    return {
      notificationCount: this.notificationCount,
      isSpamBlocked: this.isSpamBlocked,
      remainingBlockTime,
      timeSinceLastNotification: currentTime - this.lastNotificationTime
    };
  }

  // Method to set volume
  setVolume(volume) {
    if (this.notificationAudio) {
      this.notificationAudio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  // Method to test the sound
  testSound() {
    if (this.notificationAudio) {
      this.playSound();
      return true;
    }
    return false;
  }
}

// Create singleton instance
export const soundManager = new SoundManager();

// Export the class as well for testing
export { SoundManager };
