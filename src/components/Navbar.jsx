import React, { useState, useEffect } from "react";
import { LogOut, MessageCircle, Settings, User, Bell, UserPlus, UserCheck, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const Navbar = () => {
  const { 
    logout, 
    authUser, 
    incomingRequests, 
    acceptFriendRequest, 
    rejectFriendRequest, 
    getIncomingRequests 
  } = useAuthStore();
  
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (authUser) {
      getIncomingRequests();
      // Poll for new requests every 30 seconds
      const interval = setInterval(getIncomingRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [authUser, getIncomingRequests]);

  const handleAcceptRequest = async (requestId) => {
    const result = await acceptFriendRequest(requestId);
    if (result.success) {
      // Refresh incoming requests
      getIncomingRequests();
    }
  };

  const handleRejectRequest = async (requestId) => {
    const result = await rejectFriendRequest(requestId);
    if (result.success) {
      // Refresh incoming requests
      getIncomingRequests();
    }
  };

  return (
    <header className="bg-gray-900 border-b border-gray-700 fixed w-full top-0 z-40 backdrop-blur-lg text-white">
      <div className="container mx-auto px-12 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <a
              href="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Talko</h1>
            </a>
          </div>

          <div className="flex items-center gap-6">
            {/* Friend Request Notifications */}
            {authUser && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="btn btn-sm btn-ghost relative"
                  title="Friend Requests"
                >
                  <Bell className="w-4 h-4" />
                  {incomingRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {incomingRequests.length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-base-100 text-base-content rounded-lg shadow-xl border border-base-300 z-50">
                    <div className="p-4 border-b border-base-300">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">Friend Requests</h3>
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="btn btn-xs btn-ghost"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {incomingRequests.length === 0 ? (
                        <div className="p-4 text-center text-base-content/60">
                          No pending requests
                        </div>
                      ) : (
                        incomingRequests.map((request) => (
                          <div key={request._id} className="p-4 border-b border-base-300 last:border-b-0">
                            <div className="flex items-center gap-3 mb-3">
                              <img
                                src={request.senderId.profilePic || "/avatar.png"}
                                alt={request.senderId.fullname}
                                className="size-10 rounded-full"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                  {request.senderId.fullname}
                                </div>
                                <div className="text-xs text-base-content/60">
                                  @{request.senderId.username}
                                </div>
                                {request.message && (
                                  <div className="text-xs text-base-content/80 mt-1">
                                    "{request.message}"
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptRequest(request._id)}
                                className="btn btn-xs btn-primary flex-1"
                              >
                                <UserCheck className="size-3" />
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request._id)}
                                className="btn btn-xs btn-ghost flex-1"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <a
              href="/settings"
              className="btn btn-sm gap-2 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </a>
            
            {authUser && (
              <>
                <a
                  href="/profile"
                  className="btn btn-sm gap-2 transition-colors"
                >
                  <User className="size-5" />
                  <span className="hidden sm:inline">{authUser.fullname}</span>
                </a>

                <button className="flex gap-2 items-center" onClick={logout}>
                  <span className="hidden sm:inline">Logout</span>
                  <LogOut className="size-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </header>
  );
};

export default Navbar;