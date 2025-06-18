import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  typingUsers: [],

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

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error("You can only message friends");
      } else {
        toast.error("Failed to send message");
      }
    }
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
      if (newMessage.senderId === selectedUser._id) {
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      }
    });

    socket.on("userTyping", (data) => {
      const { selectedUser, typingUsers } = get();
      if (data.senderId === selectedUser._id) {
        if (!typingUsers.includes(data.senderId)) {
          set({ typingUsers: [...typingUsers, data.senderId] });
        }
      }
    });

    socket.on("userStoppedTyping", (data) => {
      const { typingUsers } = get();
      set({ 
        typingUsers: typingUsers.filter(userId => userId !== data.senderId) 
      });
    });
  },

  dontListenToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
    }
  },

  emitTyping: (receiverId) => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    if (socket && authUser) {
      socket.emit("typing", {
        receiverId,
        senderId: authUser._id,
        senderName: authUser.fullname
      });
    }
  },

  emitStopTyping: (receiverId) => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    if (socket && authUser) {
      socket.emit("stopTyping", {
        receiverId,
        senderId: authUser._id
      });
    }
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser, messages: [], typingUsers: [] });
  },

  clearMessages: () => {
    set({ messages: [], typingUsers: [] });
  },
}));