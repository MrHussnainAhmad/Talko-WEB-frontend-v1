import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useNotificationStore } from "./useNotificationStore.jsx";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSignup: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  incomingRequests: [],
  outgoingRequests: [],
  friends: [],
  isLoadingRequests: false,
  isResendingVerification: false,
  verificationEmail: null,
  isDeletingAccount: false,
  blockedUsers: [],
  isBlockingUser: false,

  checkAuth: async () => {
    try {
      const response = await axiosInstance.get("/auth/check");
      set({ authUser: response.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSignup: true });
    try {
      const response = await axiosInstance.post("/auth/signup", data);
      
      set({ verificationEmail: data.email });
      
      toast.success("Account created successfully! Please check your email to verify your account.");
      
      return { 
        success: true, 
        requiresVerification: true,
        message: "Account created successfully! Please check your email to verify your account."
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Signup failed";
      toast.error(errorMessage);
      console.error("Error in signup:", error);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      set({ isSignup: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const response = await axiosInstance.post("/auth/login", data);
      set({ authUser: response.data, verificationEmail: null });
      toast.success("Logged in successfully!");
      get().connectSocket();
      
      // Initialize notifications after successful login
      setTimeout(() => {
        useNotificationStore.getState().initializeNotifications();
      }, 1000);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed";
      const requiresVerification = error.response?.data?.requiresVerification || false;
      
      if (requiresVerification) {
        set({ verificationEmail: data.email });
      }
      
      toast.error(errorMessage);
      console.error("Error in login:", error);
      return {
        success: false,
        message: errorMessage,
        requiresVerification,
      };
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      // Remove FCM token before logout
      await useNotificationStore.getState().removeFCMToken();
      
      await axiosInstance.post("/auth/logout");
      set({ 
        authUser: null,
        incomingRequests: [],
        outgoingRequests: [],
        friends: [],
        verificationEmail: null
      });
      toast.success("Logged out successfully!");
      get().disconnectSocket();
    } catch (error) {
      toast.error("Logout failed");
      console.error("Error logging out:", error);
    }
  },

  resendVerificationEmail: async (email) => {
    set({ isResendingVerification: true });
    try {
      const emailToUse = email || get().verificationEmail;
      
      if (!emailToUse) {
        toast.error("Email address not found");
        return { success: false, message: "Email address not found" };
      }

      await axiosInstance.post("/auth/resend-verification", { 
        email: emailToUse 
      });
      
      toast.success("Verification email sent! Please check your inbox.");
      return { 
        success: true, 
        message: "Verification email sent successfully" 
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to resend verification email";
      toast.error(errorMessage);
      console.error("Error resending verification:", error);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      set({ isResendingVerification: false });
    }
  },

  verifyEmail: async (token) => {
    try {
      const response = await axiosInstance.get(`/auth/verify-email/${token}`);
      toast.success("Email verified successfully! You can now log in.");
      set({ verificationEmail: null });
      return { 
        success: true, 
        message: "Email verified successfully! You can now log in." 
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Email verification failed";
      toast.error(errorMessage);
      console.error("Error verifying email:", error);
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  clearVerificationEmail: () => {
    set({ verificationEmail: null });
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data.updatedUser });
      
      // Emit socket event for real-time profile update
      const socket = get().socket;
      if (socket) {
        socket.emit('profileUpdated', res.data.updatedUser);
      }
      
      toast.success("Profile updated successfully!");
      return { success: true };
    } catch (error) {
      console.error("Error in updateProfile:", error);
      const errorMessage =
        error.response?.data?.message || "Profile update failed";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  deleteAccount: async (password) => {
    set({ isDeletingAccount: true });
    try {
      await axiosInstance.delete("/auth/delete-account", {
        data: { password }
      });
      
      set({ 
        authUser: null,
        incomingRequests: [],
        outgoingRequests: [],
        friends: [],
        verificationEmail: null
      });
      
      get().disconnectSocket();
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Account deletion failed";
      throw new Error(errorMessage);
    } finally {
      set({ isDeletingAccount: false });
    }
  },

  sendFriendRequest: async (receiverId, message = "") => {
    try {
      const res = await axiosInstance.post("/friends/send-request", {
        receiverId,
        message,
      });
      
      const socket = get().socket;
      if (socket) {
        socket.emit("friendRequestSent", {
          receiverId,
          request: res.data.request
        });
      }
      
      toast.success("Friend request sent!");
      get().getOutgoingRequests();
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to send request";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  acceptFriendRequest: async (requestId) => {
    try {
      await axiosInstance.post(`/friends/accept/${requestId}`);
      
      const request = get().incomingRequests.find(req => req._id === requestId);
      const socket = get().socket;
      if (socket && request) {
        socket.emit("friendRequestAccepted", {
          senderId: request.senderId._id,
          friendId: get().authUser._id,
          accepterName: get().authUser.fullname
        });
      }
      
      toast.success("Friend request accepted!");
      get().getIncomingRequests();
      get().getFriends();
      
      // Also update chat store users list for real-time chat list updates
      const chatStore = window.chatStore;
      if (chatStore && chatStore.getUsers) {
        chatStore.getUsers();
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to accept request";
      toast.error(errorMessage);
      return { success: false };
    }
  },

  rejectFriendRequest: async (requestId) => {
    try {
      await axiosInstance.post(`/friends/reject/${requestId}`);
      
      const request = get().incomingRequests.find(req => req._id === requestId);
      const socket = get().socket;
      if (socket && request) {
        socket.emit("friendRequestRejected", {
          senderId: request.senderId._id,
          friendId: get().authUser._id
        });
      }
      
      toast.success("Friend request rejected");
      get().getIncomingRequests();
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to reject request";
      toast.error(errorMessage);
      return { success: false };
    }
  },

  cancelFriendRequest: async (requestId) => {
    try {
      await axiosInstance.delete(`/friends/cancel/${requestId}`);
      
      const socket = get().socket;
      if (socket) {
        socket.emit("friendRequestCancelled", { requestId });
      }
      
      toast.success("Friend request cancelled");
      get().getOutgoingRequests();
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to cancel request";
      toast.error(errorMessage);
      return { success: false };
    }
  },

  getIncomingRequests: async () => {
    set({ isLoadingRequests: true });
    try {
      const res = await axiosInstance.get("/friends/requests/incoming");
      set({ incomingRequests: res.data });
    } catch (error) {
      console.error("Error fetching incoming requests:", error);
    } finally {
      set({ isLoadingRequests: false });
    }
  },

  getOutgoingRequests: async () => {
    try {
      const res = await axiosInstance.get("/friends/requests/outgoing");
      set({ outgoingRequests: res.data });
    } catch (error) {
      console.error("Error fetching outgoing requests:", error);
    }
  },

  getFriends: async () => {
    try {
      const res = await axiosInstance.get("/friends");
      set({ friends: res.data });
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  },

  removeFriend: async (friendId) => {
    try {
      await axiosInstance.delete(`/friends/remove/${friendId}`);
      
      const socket = get().socket;
      if (socket) {
        socket.emit("friendshipEnded", {
          friendId,
          userId: get().authUser._id
        });
      }
      
      toast.success("Friend removed");
      get().getFriends();
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to remove friend";
      toast.error(errorMessage);
      return { success: false };
    }
  },

  searchUsers: async (query) => {
    try {
      const res = await axiosInstance.get(`/friends/search?query=${encodeURIComponent(query)}`);
      return res.data;
    } catch (error) {
      console.error("Error searching users:", error);
      return [];
    }
  },

  // Blocking functionality with instant UI updates
  blockUser: async (userId) => {
    set({ isBlockingUser: true });
    
    // Find the user to block from friends list
    const userToBlock = get().friends.find(f => f._id === userId);
    
    // INSTANT UPDATE: Add to blocked users list but keep in friends list
    set(state => ({
      blockedUsers: userToBlock ? [...state.blockedUsers, userToBlock] : state.blockedUsers
    }));
    
    try {
      await axiosInstance.post(`/auth/block/${userId}`);
      
      // Emit socket event for real-time blocking
      const socket = get().socket;
      const authUser = get().authUser;
      if (socket && authUser) {
        socket.emit('userBlocked', {
          blockerId: authUser._id,
          blockedUserId: userId,
          blockerName: authUser.fullname || authUser.username
        });
      }
      
      toast.success('User blocked successfully');
      return { success: true };
    } catch (error) {
      // ROLLBACK: If API fails, remove from blocked users
      set(state => ({
        blockedUsers: state.blockedUsers.filter(u => u._id !== userId)
      }));
      
      const errorMessage = error.response?.data?.message || "Failed to block user";
      console.error("Block user error:", errorMessage);
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      set({ isBlockingUser: false });
    }
  },

  unblockUser: async (userId) => {
    set({ isBlockingUser: true });
    
    // Find the user to unblock from blocked users list
    const userToUnblock = get().blockedUsers.find(u => u._id === userId);
    
    // INSTANT UPDATE: Remove from blocked users list immediately
    set(state => ({
      blockedUsers: state.blockedUsers.filter(u => u._id !== userId)
    }));
    
    try {
      await axiosInstance.post(`/auth/unblock/${userId}`);
      
      // Emit socket event for real-time unblocking
      const socket = get().socket;
      const authUser = get().authUser;
      if (socket && authUser) {
        socket.emit('userUnblocked', {
          unblockerId: authUser._id,
          unblockedUserId: userId,
          unblockerName: authUser.fullname || authUser.username
        });
      }
      
      toast.success('User unblocked successfully');
      return { success: true };
    } catch (error) {
      // ROLLBACK: If API fails, restore the previous state
      set(state => ({
        blockedUsers: userToUnblock ? [...state.blockedUsers, userToUnblock] : state.blockedUsers
      }));
      
      const errorMessage = error.response?.data?.message || "Failed to unblock user";
      console.error("Unblock user error:", errorMessage);
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      set({ isBlockingUser: false });
    }
  },

  getBlockedUsers: async () => {
    try {
      const res = await axiosInstance.get("/auth/blocked-users");
      set({ blockedUsers: res.data.blockedUsers });
    } catch (error) {
      console.error("Error fetching blocked users:", error);
    }
  },
  
  // Realtime Blocked Users Update Listener with instant UI updates
  handleUserBlock: (blockData) => {
    const { blockerId, blockedId, blockedUser } = blockData;
    
    // If current user is the one being blocked
    if (get().authUser._id === blockedId) {
      // INSTANT UPDATE: Remove the blocker from friends list
      set(state => ({
        friends: state.friends.filter(f => f._id !== blockerId)
      }));
      toast.error('You have been blocked by someone.');
    }
    
    // If current user is the one who blocked (for sync across devices)
    if (get().authUser._id === blockerId && blockedUser) {
      // INSTANT UPDATE: Ensure consistent state across devices
      set(state => ({
        friends: state.friends.filter(f => f._id !== blockedId),
        blockedUsers: state.blockedUsers.some(u => u._id === blockedId) 
          ? state.blockedUsers 
          : [...state.blockedUsers, blockedUser]
      }));
    }
    
    // Also update chat store to reflect blocking in real-time
    const chatStore = window.chatStore;
    if (chatStore && chatStore.getUsers) {
      chatStore.getUsers();
    }
  },

  handleUserUnblock: (unblockData) => {
    const { unblockerId, unblockedId, unblockedUser } = unblockData;
    
    // If current user is the one being unblocked
    if (get().authUser._id === unblockedId) {
      toast.info('You have been unblocked.');
    }
    
    // If current user is the one who unblocked (for sync across devices)
    if (get().authUser._id === unblockerId && unblockedUser) {
      // INSTANT UPDATE: Ensure consistent state across devices
      set(state => ({
        blockedUsers: state.blockedUsers.filter(u => u._id !== unblockedId),
        friends: state.friends.some(f => f._id === unblockedId) 
          ? state.friends 
          : [...state.friends, unblockedUser]
      }));
    }
    
    // Also update chat store to reflect unblocking in real-time
    const chatStore = window.chatStore;
    if (chatStore && chatStore.getUsers) {
      chatStore.getUsers();
    }
  },
  
  // Realtime Profile Update Listener
  handleProfileUpdate: (updatedUser) => {
    set(state => ({
      friends: state.friends.map(friend => friend._id === updatedUser._id ? updatedUser : friend),
      authUser: state.authUser._id === updatedUser._id ? updatedUser : state.authUser
    }));
    toast.success(`${updatedUser.fullname}'s profile updated!`);
  },

  checkBlockStatus: async (userId) => {
    try {
      const res = await axiosInstance.get(`/auth/block-status/${userId}`);
      return res.data;
    } catch (error) {
      console.error("Error checking block status:", error);
      return { isBlocked: false, isBlockedBy: false };
    }
  },

  getLastSeen: async (userId) => {
    try {
      const res = await axiosInstance.get(`/auth/last-seen/${userId}`);
      return res.data;
    } catch (error) {
      console.error("Error fetching last seen:", error);
      return null;
    }
  },

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) {
      return;
    }
    
    console.log("Connecting socket for user:", authUser._id);
    
    // Dynamic socket URL based on environment
    const getSocketURL = () => {
      if (import.meta.env.PROD) {
        return import.meta.env.VITE_BACKEND_URL || "https://talkora-private-chat.up.railway.app";
      }
      return import.meta.env.VITE_BACKEND_LOCAL || "http://localhost:3000";
    };
    
    const socket = io(getSocketURL(), {
      withCredentials: true,
      query: {
        userId: authUser._id,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    socket.on('connect', () => {
      console.log('Socket connected successfully:', socket.id);
      set({ socket });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on("getOnlineUsers", (userIds) => {
      console.log('Online users updated:', userIds);
      set({ onlineUsers: userIds });
    });

    socket.on("newFriendRequest", (data) => {
      toast.success(data.message);
      get().getIncomingRequests();
      
      // Also update chat store users list for real-time chat list updates
      const chatStore = window.chatStore;
      if (chatStore && chatStore.getUsers) {
        chatStore.getUsers();
      }
    });

    socket.on("friendRequestAccepted", (data) => {
      toast.success(data.message);
      get().getOutgoingRequests();
      get().getFriends();
      
      // Also update chat store users list for real-time chat list updates
      const chatStore = window.chatStore;
      if (chatStore && chatStore.getUsers) {
        chatStore.getUsers();
      }
    });

    socket.on("friendRequestRejected", (data) => {
      toast.error(data.message);
      get().getOutgoingRequests();
    });

    socket.on("friendRequestCancelled", (data) => {
      toast.info("Friend request cancelled");
      get().getIncomingRequests();
      get().getOutgoingRequests();
    });

    socket.on("friendshipEnded", (data) => {
      toast.info(data.message || "Friendship ended");
      get().getFriends();
    });

    socket.on("userStatusUpdate", (data) => {
      console.log('User status update:', data);
    });

    socket.on('chatDeleted', (data) => {
      toast.info(data.message);
      get().getFriends();
    });

    // Real-time blocking event listeners
    socket.on('youWereBlocked', (data) => {
      console.log(`🚫 You were blocked by ${data.blockerName} (${data.blockerId})`);
      
      // Remove the blocker from friends list immediately
      set(state => ({
        friends: state.friends.filter(f => f._id !== data.blockerId)
      }));
      
      // Update chat store to reflect changes
      const chatStore = window.chatStore;
      if (chatStore && chatStore.getUsers) {
        chatStore.getUsers();
      }
      
      // If currently chatting with the blocker, clear the chat
      if (chatStore && chatStore.selectedUser && chatStore.selectedUser._id === data.blockerId) {
        chatStore.setSelectedUser(null);
        toast.error(`You were blocked by ${data.blockerName}`);
      }
    });

    socket.on('youWereUnblocked', (data) => {
      console.log(`✅ You were unblocked by ${data.unblockerName} (${data.unblockerId})`);
      
      // Refresh friends list to reflect potential changes
      get().getFriends();
      
      // Update chat store
      const chatStore = window.chatStore;
      if (chatStore && chatStore.getUsers) {
        chatStore.getUsers();
      }
      
      toast.info(`You were unblocked by ${data.unblockerName}`);
    });

    socket.on('blockActionConfirmed', (data) => {
      console.log(`✅ Block action confirmed: ${data.action} user ${data.targetUserId}`);
      
      // Refresh friends and blocked users lists
      get().getFriends();
      get().getBlockedUsers();
      
      // Update chat store
      const chatStore = window.chatStore;
      if (chatStore && chatStore.getUsers) {
        chatStore.getUsers();
      }
    });

    socket.on('refreshContactsList', (data) => {
      console.log(`🔄 Refreshing contacts list due to ${data.reason}`, data);
      
      // Refresh all relevant lists
      get().getFriends();
      get().getBlockedUsers();
      
      // IMPORTANT: Update chat store (this refreshes the chat list)
      const chatStore = window.chatStore;
      if (chatStore && chatStore.getUsers) {
        console.log('🔄 Triggering chat list refresh from auth store');
        chatStore.getUsers();
      } else {
        console.warn('⚠️ Chat store not available for refresh');
      }
    });

    socket.on("userAccountDeleted", (data) => {
      const { deletedUserId } = data;
      
      set(state => ({
        friends: state.friends.filter(friend => friend._id !== deletedUserId),
        incomingRequests: state.incomingRequests.filter(
          req => req.senderId._id !== deletedUserId
        ),
        outgoingRequests: state.outgoingRequests.filter(
          req => req.receiverId._id !== deletedUserId
        )
      }));
      
      toast.info(`A user has deleted their account`);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Enhanced notification listener
    socket.on('notification', (notificationData) => {
      console.log('📬 Notification received:', notificationData);
      useNotificationStore.getState().handleForegroundNotification({
        notification: {
          title: notificationData.title,
          body: notificationData.body
        },
        data: notificationData.data || {}
      });
    });
    
    // Real-time profile update listener
    socket.on('profileUpdated', (updatedUser) => {
      console.log('👤 Profile updated:', updatedUser);
      get().handleProfileUpdate(updatedUser);
    });
    
    // Real-time blocking listeners
    socket.on('userBlocked', (blockData) => {
      console.log('🚫 User blocked:', blockData);
      get().handleUserBlock(blockData);
    });
    
    socket.on('userUnblocked', (unblockData) => {
      console.log('✅ User unblocked:', unblockData);
      get().handleUserUnblock(unblockData);
    });
  },
  
  disconnectSocket: () => {
    if (get().socket?.connected) {
      get().socket.disconnect();
    }
    set({ socket: null, onlineUsers: [] });
  },
}));