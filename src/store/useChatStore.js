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
  },

  dontListenToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));