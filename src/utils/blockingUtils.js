import { useAuthStore } from '../store/useAuthStore';

// Socket instance - import your socket instance here
// import { socket } from '../socket'; // Adjust path based on your socket setup

/**
 * Check if a user is blocked by the current user or has blocked the current user
 * @param {string} userId - The ID of the user to check
 * @returns {Promise<{isBlocked: boolean, isBlockedBy: boolean}>}
 */
export const checkUserBlockStatus = async (userId) => {
  try {
    const authStore = useAuthStore.getState();
    return await authStore.checkBlockStatus(userId);
  } catch (error) {
    console.error('Error checking block status:', error);
    return { isBlocked: false, isBlockedBy: false };
  }
};

/**
 * Block a user with real-time notification
 * @param {string} targetUserId - The ID of the user to block
 * @param {Function} socket - Socket instance
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 */
export const blockUserRealtime = async (targetUserId, socket, onSuccess, onError) => {
  try {
    const authStore = useAuthStore.getState();
    const currentUser = authStore.user;
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    console.log(`🚫 Attempting to block user ${targetUserId}`);
    
    // Call your API to block the user
    const response = await authStore.blockUser(targetUserId);
    
    if (response.success) {
      // Emit real-time socket event
      if (socket && socket.connected) {
        socket.emit('userBlocked', {
          blockerId: currentUser._id,
          blockedUserId: targetUserId,
          blockerName: currentUser.fullname || 'Someone'
        });
        console.log(`📤 Emitted userBlocked event for ${targetUserId}`);
      }
      
      // Call success callback
      if (onSuccess) {
        onSuccess(response);
      }
      
      console.log(`✅ Successfully blocked user ${targetUserId}`);
      return response;
    } else {
      throw new Error(response.message || 'Failed to block user');
    }
  } catch (error) {
    console.error('Error blocking user:', error);
    if (onError) {
      onError(error);
    }
    throw error;
  }
};

/**
 * Unblock a user with real-time notification
 * @param {string} targetUserId - The ID of the user to unblock
 * @param {Function} socket - Socket instance
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 */
export const unblockUserRealtime = async (targetUserId, socket, onSuccess, onError) => {
  try {
    const authStore = useAuthStore.getState();
    const currentUser = authStore.user;
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    console.log(`✅ Attempting to unblock user ${targetUserId}`);
    
    // Call your API to unblock the user
    const response = await authStore.unblockUser(targetUserId);
    
    if (response.success) {
      // Emit real-time socket event
      if (socket && socket.connected) {
        socket.emit('userUnblocked', {
          unblockerId: currentUser._id,
          unblockedUserId: targetUserId,
          unblockerName: currentUser.fullname || 'Someone'
        });
        console.log(`📤 Emitted userUnblocked event for ${targetUserId}`);
      }
      
      // Call success callback
      if (onSuccess) {
        onSuccess(response);
      }
      
      console.log(`✅ Successfully unblocked user ${targetUserId}`);
      return response;
    } else {
      throw new Error(response.message || 'Failed to unblock user');
    }
  } catch (error) {
    console.error('Error unblocking user:', error);
    if (onError) {
      onError(error);
    }
    throw error;
  }
};

/**
 * Setup real-time blocking event listeners
 * @param {Function} socket - Socket instance
 * @param {Function} onUserBlocked - Callback when someone blocks you
 * @param {Function} onUserUnblocked - Callback when someone unblocks you
 * @param {Function} onBlockActionConfirmed - Callback when your block/unblock action is confirmed
 * @param {Function} onRefreshContacts - Callback when contacts need to be refreshed
 */
export const setupBlockingEventListeners = (socket, callbacks = {}) => {
  if (!socket) {
    console.warn('⚠️ Socket not provided for blocking event listeners');
    return;
  }
  
  const {
    onUserBlocked,
    onUserUnblocked,
    onBlockActionConfirmed,
    onRefreshContacts,
    onBlockStatusChecked
  } = callbacks;
  
  // Listen for when you get blocked by someone
  socket.on('youWereBlocked', (data) => {
    console.log(`🚫 You were blocked by ${data.blockerName} (${data.blockerId})`);
    
    if (onUserBlocked) {
      onUserBlocked(data);
    }
    
    // You can also show a notification here
    // showNotification(`You were blocked by ${data.blockerName}`);
  });
  
  // Listen for when you get unblocked by someone
  socket.on('youWereUnblocked', (data) => {
    console.log(`✅ You were unblocked by ${data.unblockerName} (${data.unblockerId})`);
    
    if (onUserUnblocked) {
      onUserUnblocked(data);
    }
    
    // You can also show a notification here
    // showNotification(`You were unblocked by ${data.unblockerName}`);
  });
  
  // Listen for confirmation of your block/unblock actions
  socket.on('blockActionConfirmed', (data) => {
    console.log(`✅ Block action confirmed: ${data.action} user ${data.targetUserId}`);
    
    if (onBlockActionConfirmed) {
      onBlockActionConfirmed(data);
    }
  });
  
  // Listen for contacts list refresh requests
  socket.on('refreshContactsList', (data) => {
    console.log(`🔄 Refreshing contacts list due to ${data.reason}`);
    
    if (onRefreshContacts) {
      onRefreshContacts(data);
    }
  });
  
  // Listen for block status check responses
  socket.on('blockStatusChecked', (data) => {
    console.log(`📋 Block status checked for user ${data.targetUserId}`);
    
    if (onBlockStatusChecked) {
      onBlockStatusChecked(data);
    }
  });
};

/**
 * Remove blocking event listeners
 * @param {Function} socket - Socket instance
 */
export const removeBlockingEventListeners = (socket) => {
  if (!socket) return;
  
  socket.off('youWereBlocked');
  socket.off('youWereUnblocked');
  socket.off('blockActionConfirmed');
  socket.off('refreshContactsList');
  socket.off('blockStatusChecked');
  
  console.log('🧹 Removed blocking event listeners');
};

/**
 * Get user display information considering blocking status
 * @param {Object} user - The user object
 * @param {boolean} isBlocked - Whether the user is blocked
 * @param {boolean} isBlockedBy - Whether the user has blocked the current user
 * @returns {Object} - Modified user object with hidden info if blocked
 */
export const getUserDisplayInfo = (user, isBlocked, isBlockedBy) => {
  if (isBlockedBy) {
    // User B's perspective when blocked by User A
    return {
      ...user,
      profilePic: user.profilePic || '/Profile.png', // Keep profile picture
      about: '', // Hide about section
      lastSeen: 'Last seen', // Always show "Last seen"
      isOnline: false, // Hide online status
      displayName: user.fullname || 'Unknown User',
    };
  }
  
  if (isBlocked) {
    // User A's perspective when they blocked User B
    return {
      ...user,
      profilePic: user.profilePic || '/Profile.png', // Keep profile picture
      about: '', // Hide about section
      lastSeen: '', // Hide last seen completely
      isOnline: false, // Hide online status
      displayName: user.fullname || 'Unknown User',
    };
  }
  
  return user;
};

/**
 * Check if online status should be shown for a user
 * @param {string} userId - The ID of the user
 * @param {boolean} isBlocked - Whether the user is blocked
 * @param {boolean} isBlockedBy - Whether the user has blocked the current user
 * @returns {boolean} - Whether to show online status
 */
export const shouldShowOnlineStatus = (userId, isBlocked, isBlockedBy) => {
  // Hide online status if either user blocks the other
  return !isBlocked && !isBlockedBy;
};

/**
 * Check if typing indicator should be shown for a user
 * @param {string} userId - The ID of the user
 * @param {boolean} isBlocked - Whether the user is blocked
 * @param {boolean} isBlockedBy - Whether the user has blocked the current user
 * @returns {boolean} - Whether to show typing indicator
 */
export const shouldShowTypingIndicator = (userId, isBlocked, isBlockedBy) => {
  return !isBlocked && !isBlockedBy;
};

/**
 * Check if last seen should be shown for a user
 * @param {string} userId - The ID of the user
 * @param {boolean} isBlocked - Whether the user is blocked
 * @param {boolean} isBlockedBy - Whether the user has blocked the current user
 * @returns {boolean} - Whether to show last seen
 */
export const shouldShowLastSeen = (userId, isBlocked, isBlockedBy) => {
  return !isBlocked && !isBlockedBy;
};

/**
 * Get filtered user list excluding blocked users
 * @param {Array} users - Array of user objects
 * @param {Array} blockedUsers - Array of blocked user IDs
 * @returns {Array} - Filtered user list
 */
export const getFilteredUsers = (users, blockedUsers) => {
  const blockedUserIds = blockedUsers.map(blockedUser => 
    typeof blockedUser === 'string' ? blockedUser : blockedUser._id
  );
  
  return users.filter(user => !blockedUserIds.includes(user._id));
};

/**
 * Check if a message should be blocked from being sent
 * @param {string} receiverId - The ID of the message receiver
 * @returns {Promise<boolean>} - Whether the message should be blocked
 */
export const shouldBlockMessage = async (receiverId) => {
  try {
    const blockStatus = await checkUserBlockStatus(receiverId);
    return blockStatus.isBlocked || blockStatus.isBlockedBy;
  } catch (error) {
    console.error('Error checking message block status:', error);
    return false;
  }
};

/**
 * Get the display text for a blocked user scenario
 * @param {boolean} isBlocked - Whether the user is blocked by current user
 * @param {boolean} isBlockedBy - Whether the current user is blocked by the user
 * @returns {string} - Display text for the blocking scenario
 */
export const getBlockingDisplayText = (isBlocked, isBlockedBy) => {
  if (isBlocked) {
    return 'You have blocked this user';
  } else if (isBlockedBy) {
    return 'This user has blocked you';
  }
  return '';
};

/**
 * Request block status check via socket
 * @param {string} targetUserId - The ID of the user to check
 * @param {Function} socket - Socket instance
 */
export const requestBlockStatusCheck = (targetUserId, socket) => {
  if (!socket || !socket.connected) {
    console.warn('⚠️ Socket not connected for block status check');
    return;
  }
  
  const authStore = useAuthStore.getState();
  const currentUser = authStore.user;
  
  if (!currentUser) {
    console.warn('⚠️ User not authenticated for block status check');
    return;
  }
  
  socket.emit('checkBlockStatus', {
    requesterId: currentUser._id,
    targetUserId: targetUserId
  });
  
  console.log(`📤 Requested block status check for user ${targetUserId}`);
};