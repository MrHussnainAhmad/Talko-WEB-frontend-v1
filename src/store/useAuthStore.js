import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const Base_URL = "https://talko-backend-v1-1.vercel.app";
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
      set({ authUser: response.data.user || response.data });
      toast.success("Account created successfully!");
      get().connectSocket();
      return { success: true };
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
      set({ authUser: response.data });
      toast.success("Logged in successfully!");
      get().connectSocket();
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed";
      toast.error(errorMessage);
      console.error("Error in login:", error);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ 
        authUser: null,
        incomingRequests: [],
        outgoingRequests: [],
        friends: []
      });
      toast.success("Logged out successfully!");
      get().disconnectSocket();
    } catch (error) {
      toast.error("Logout failed");
      console.error("Error logging out:", error);
    }
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

  sendFriendRequest: async (receiverId, message = "") => {
    try {
      const res = await axiosInstance.post("/friends/send-request", {
        receiverId,
        message,
      });
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
      toast.success("Friend request rejected");
      get().getIncomingRequests();
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to reject request";
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

  setOnlineUsers: (users) => set({ onlineUsers: users }),

connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) {
      return;
    }
    
    console.log("Connecting socket for user:", authUser._id); // Debug log
    
    const socket = io(Base_URL, {
      withCredentials: true, // This is crucial for cross-origin requests
      query: {
        userId: authUser._id,
      },
      transports: ['websocket', 'polling'], // Allow both transports
      timeout: 20000, // 20 second timeout
      forceNew: true, // Force a new connection
    });

    // Handle connection events
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

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  },
  
  disconnectSocket: () => {
    if (get().socket?.connected) {
      get().socket.disconnect();
    }
    set({ socket: null, onlineUsers: [] });
  },
}));