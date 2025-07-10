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

  // Blocking functionality
  blockUser: async (userId) => {
    set({ isBlockingUser: true });
    try {
      await axiosInstance.post(`/auth/block/${userId}`);
      get().getBlockedUsers();
      get().getFriends(); // Refresh friends list to update blocking status
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to block user";
      console.error("Block user error:", errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      set({ isBlockingUser: false });
    }
  },

  unblockUser: async (userId) => {
    set({ isBlockingUser: true });
    try {
      await axiosInstance.post(`/auth/unblock/${userId}`);
      get().getBlockedUsers();
      get().getFriends(); // Refresh friends list to update blocking status
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to unblock user";
      console.error("Unblock user error:", errorMessage);
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
    
    const socket = io("https://talkora-private-chat.up.railway.app", {
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
    });

    socket.on("friendRequestAccepted", (data) => {
      toast.success(data.message);
      get().getOutgoingRequests();
      get().getFriends();
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
  },
  
  disconnectSocket: () => {
    if (get().socket?.connected) {
      get().socket.disconnect();
    }
    set({ socket: null, onlineUsers: [] });
  },
}));