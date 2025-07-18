import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";
import {
  getUserDisplayName,
  getUserProfilePic,
  playNotificationSound,
  playConfirmSound,
  isUserOnTalkoTab,
  initializeTabVisibility,
  cleanupTabVisibility,
} from "../lib/utils.js";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  typingUsers: [],
  messageCounts: {},

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error("Failed to load friends");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error("You can only message friends");
      } else {
        toast.error("Failed to load messages");
      }
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  getMessageCount: async (userId) => {
    try {
      const res = await axiosInstance.get(`/messages/count/${userId}`);
      set((state) => ({
        messageCounts: {
          ...state.messageCounts,
          [userId]: res.data.messageCount,
        },
      }));
    } catch (error) {
      console.error("Failed to get message count:", error);
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      // Check if user is blocked before sending
      const blockStatus = await useAuthStore.getState().checkBlockStatus(selectedUser._id);
      if (blockStatus.isBlocked || blockStatus.isBlockedBy) {
        toast.error("Cannot send message to blocked user");
        return;
      }
      
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      set((state) => ({
        messages: [...messages, res.data],
        messageCounts: {
          ...state.messageCounts,
          [selectedUser._id]: (state.messageCounts[selectedUser._id] || 0) + 1,
        },
      }));
      
      // Play confirm sound for sender when message is sent successfully
      playConfirmSound();
      
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error("You can only message friends");
      } else if (error.response?.status === 423) {
        toast.error("User is blocked");
      } else {
        toast.error("Failed to send message");
      }
    }
  },

  deleteChatHistory: async (userId) => {
    try {
      await axiosInstance.delete(`/messages/privacy/${userId}`);

      set((state) => ({
        messages: [],
        messageCounts: {
          ...state.messageCounts,
          [userId]: 0,
        },
      }));

      toast.success("Chat history deleted for both users");
    } catch (error) {
      toast.error("Failed to delete chat history");
      console.error("Error deleting chat history:", error);
    }
  },

// Enhanced global notification listener with proper sound handling
setupGlobalNotifications: () => {
  const socket = useAuthStore.getState().socket;
  
  if (!socket) {
    console.error("Socket is not available for global notifications");
    return;
  }

  console.log("🔧 Setting up global notification listener...");

  // Initialize tab visibility tracking
  initializeTabVisibility();

  // Listen for messageReceived event globally (not tied to selected user)
  socket.on("messageReceived", (messageData) => {
    const authUser = useAuthStore.getState().authUser;
    const { selectedUser } = get();
    
    console.log("📨 Message received event:", {
      messageReceiverId: messageData.receiverId,
      authUserId: authUser?._id,
      selectedUserId: selectedUser?._id,
      messageSenderId: messageData.senderId,
      isUserOnTalko: isUserOnTalkoTab()
    });

    // Only proceed if the current user is the receiver
    if (messageData.receiverId === authUser?._id) {
      
      // Check if user is currently chatting with the sender
      const isChattingWithSender = selectedUser && selectedUser._id === messageData.senderId;
      const isOnTalkoTab = isUserOnTalkoTab();
      
      if (isChattingWithSender && isOnTalkoTab) {
        // Same chat + on Talkora tab = Confirm.wav
        console.log("💬 User is in same chat and on Talkora tab - playing confirm sound");
        playConfirmSound();
      } else {
        // Different chat OR on other tab = notification.mp3
        console.log("🔔 Different chat or on other tab - playing notification sound");
        playNotificationSound();
      }
    } else {
      console.log("❌ Not playing any sound - not the receiver");
    }
  });
},

  // Clean up global notifications
  cleanupGlobalNotifications: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      console.log("🧹 Cleaning up global notification listener...");
      socket.off("messageReceived");
    }
    
    // Clean up tab visibility tracking
    cleanupTabVisibility();
  },

  listenToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) {
      console.error("No user selected to listen for messages");
      return;
    }
    const socket = useAuthStore.getState().socket;

    if (!socket) {
      console.error("Socket is not available");
      return;
    }

    socket.on("newMessage", (newMessage) => {
      const { selectedUser } = get();
      if (
        newMessage.senderId === selectedUser._id ||
        newMessage.receiverId === selectedUser._id
      ) {
        set((state) => ({
          messages: [...state.messages, newMessage],
          messageCounts: {
            ...state.messageCounts,
            [selectedUser._id]:
              (state.messageCounts[selectedUser._id] || 0) + 1,
          },
        }));
      }
    });

    socket.on("userTyping", (data) => {
      const { selectedUser, typingUsers } = get();
      if (data.senderId === selectedUser?._id) {
        if (!typingUsers.includes(data.senderId)) {
          set({ typingUsers: [...typingUsers, data.senderId] });
        }
      }
    });

    socket.on("userStoppedTyping", (data) => {
      const { typingUsers } = get();
      set({
        typingUsers: typingUsers.filter((userId) => userId !== data.senderId),
      });
    });

    socket.on("chatDeleted", (data) => {
      const { selectedUser } = get();
      if (selectedUser && selectedUser._id === data.deletedUserId) {
        set({ messages: [], typingUsers: [] });
        set((state) => ({
          messageCounts: {
            ...state.messageCounts,
            [selectedUser._id]: 0,
          },
        }));
      }
    });

    socket.on("userAccountDeleted", (data) => {
      const { deletedUserId } = data;
      const { selectedUser } = get();

      // Update the selected user if they were deleted
      if (selectedUser && selectedUser._id === deletedUserId) {
        set({
          selectedUser: {
            ...selectedUser,
            fullname: "Talkora User",
            username: "",
            profilePic: "",
            isDeleted: true,
          },
        });
      }

      // Update messages to reflect account deletion
      set((state) => ({
        messages: state.messages.map((msg) => {
          if (msg.senderId === deletedUserId) {
            return {
              ...msg,
              senderName: "Talkora User",
              senderProfilePic: "",
              isDeleted: true,
            };
          }
          return msg;
        }),
      }));
    });
    
    // Listen for refresh contacts list event (triggered by blocking/unblocking)
    socket.on("refreshContactsList", (data) => {
      console.log("🔄 Refreshing contacts list due to:", data.type);
      // Refresh the users list
      get().getUsers();
      
      // If the current selected user is involved in the blocking action, refresh their status
      const { selectedUser } = get();
      if (selectedUser && 
          (selectedUser._id === data.blockedUserId || 
           selectedUser._id === data.unblockedUserId)) {
        // Force refresh messages and user data
        get().getMessages(selectedUser._id);
      }
    });
  },

  dontListenToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      // Don't remove messageReceived here - it's global
      socket.off("userTyping");
      socket.off("userStoppedTyping");
      socket.off("chatDeleted");
      socket.off("userAccountDeleted");
      socket.off("refreshContactsList");
    }
  },

  emitTyping: (receiverId) => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    if (socket && authUser) {
      socket.emit("typing", {
        receiverId,
        senderId: authUser._id,
        senderName: authUser.fullname,
      });
    }
  },

  emitStopTyping: (receiverId) => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    if (socket && authUser) {
      socket.emit("stopTyping", {
        receiverId,
        senderId: authUser._id,
      });
    }
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser, messages: [], typingUsers: [] });
    if (selectedUser) {
      get().getMessages(selectedUser._id);
      get().getMessageCount(selectedUser._id);
    }
  },

  clearMessages: () => {
    set({ messages: [], typingUsers: [] });
  },

  clearMessagesWithUser: (userId) => {
    set((state) => ({
      messages: state.messages.filter(
        (msg) => msg.receiverId !== userId && msg.senderId !== userId
      ),
      messageCounts: {
        ...state.messageCounts,
        [userId]: 0,
      },
    }));
  },
}));