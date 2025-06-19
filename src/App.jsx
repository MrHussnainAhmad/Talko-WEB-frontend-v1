import React, { useEffect } from "react";
import Navbar from "./components/Navbar.jsx";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import { useAuthStore } from "./store/useAuthStore.js";
import { useChatStore } from "./store/useChatStore.js";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { useThemeStore } from "./store/useThemeStore.js";
import { initializeAudio } from "./lib/utils.js"; // Add this import

const App = () => {
  const {
    authUser,
    checkAuth,
    isCheckingAuth,
    getIncomingRequests,
    getOutgoingRequests,
    getFriends,
    socket,
    incomingRequests,
  } = useAuthStore();
  
  const { setupGlobalNotifications, cleanupGlobalNotifications } = useChatStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Load friend-related data when user is authenticated
  useEffect(() => {
    if (authUser) {
      getIncomingRequests();
      getOutgoingRequests();
      getFriends();
    }
  }, [authUser, getIncomingRequests, getOutgoingRequests, getFriends]);

  // Set up socket listeners for real-time friend request notifications
  useEffect(() => {
    if (socket && authUser) {
      // Listen for new friend requests
      socket.on("newFriendRequest", (request) => {
        // Refresh incoming requests when a new one arrives
        getIncomingRequests();

        // Show notification toast
        if (window.Notification && Notification.permission === "granted") {
          new Notification("New Friend Request", {
            body: `${request.senderId.fullname} sent you a friend request`,
            icon: request.senderId.profilePic || "/Profile.png",
          });
        }
      });

      // Listen for friend request acceptance
      socket.on("friendRequestAccepted", (data) => {
        getOutgoingRequests();
        getFriends();

        if (window.Notification && Notification.permission === "granted") {
          new Notification("Friend Request Accepted", {
            body: `${data.acceptedBy.fullname} accepted your friend request`,
            icon: data.acceptedBy.profilePic || "/Profile.png",
          });
        }
      });

      // Listen for friend request rejection
      socket.on("friendRequestRejected", (data) => {
        getOutgoingRequests();

        if (window.Notification && Notification.permission === "granted") {
          new Notification("Friend Request Rejected", {
            body: `${data.rejectedBy.fullname} rejected your friend request`,
            icon: data.rejectedBy.profilePic || "/Profile.png",
          });
        }
      });

      // Cleanup listeners
      return () => {
        socket.off("newFriendRequest");
        socket.off("friendRequestAccepted");
        socket.off("friendRequestRejected");
      };
    }
  }, [socket, authUser, getIncomingRequests, getOutgoingRequests, getFriends]);

  // Initialize audio and setup global chat notifications when user is authenticated
  useEffect(() => {
    if (authUser && socket) {
      // Initialize audio system
      initializeAudio();
      
      // Wait a bit for socket to connect, then setup global notifications
      const timer = setTimeout(() => {
        setupGlobalNotifications();
      }, 1000);

      return () => {
        clearTimeout(timer);
        cleanupGlobalNotifications();
      };
    } else {
      // Cleanup when user logs out
      cleanupGlobalNotifications();
    }
  }, [authUser, socket, setupGlobalNotifications, cleanupGlobalNotifications]);

  // Request notification permission when user logs in
  useEffect(() => {
    if (
      authUser &&
      window.Notification &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, [authUser]);

  // Update document title with pending friend requests count
  useEffect(() => {
    const baseTitle = "Talko - Chat App";
    if (incomingRequests.length > 0) {
      document.title = `(${incomingRequests.length}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [incomingRequests.length]);

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader className="size-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-base-content/70">Loading Talko...</p>
        </div>
      </div>
    );

  return (
    <div data-theme={theme}>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/signup"
          element={!authUser ? <SignupPage /> : <Navigate to="/" />}
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" />}
        />
        <Route
          path="/settings"
          element={authUser ? <SettingsPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
        />

        {/* Fallback route */}
        <Route
          path="*"
          element={<Navigate to={authUser ? "/" : "/login"} replace />}
        />
      </Routes>

      {/* Toast notifications with custom styling */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "var(--fallback-b1,oklch(var(--b1)))",
            color: "var(--fallback-bc,oklch(var(--bc)))",
            border: "1px solid var(--fallback-b3,oklch(var(--b3)))",
          },
          success: {
            iconTheme: {
              primary: "var(--fallback-su,oklch(var(--su)))",
              secondary: "var(--fallback-suc,oklch(var(--suc)))",
            },
          },
          error: {
            iconTheme: {
              primary: "var(--fallback-er,oklch(var(--er)))",
              secondary: "var(--fallback-erc,oklch(var(--erc)))",
            },
          },
        }}
      />
    </div>
  );
};

export default App;