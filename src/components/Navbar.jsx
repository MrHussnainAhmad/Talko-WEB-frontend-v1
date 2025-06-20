import React, { useState, useEffect } from "react";
import { LogOut, MessageCircle, Settings, User, Bell, UserPlus, UserCheck, X, Search } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const Navbar = () => {
  const { 
    logout, 
    authUser, 
    incomingRequests, 
    acceptFriendRequest, 
    rejectFriendRequest, 
    getIncomingRequests,
    sendFriendRequest,
    searchUsers
  } = useAuthStore();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (authUser) {
      getIncomingRequests();
      // Poll for new requests every 30 seconds
      const interval = setInterval(getIncomingRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [authUser, getIncomingRequests]);

  // Friend request functions
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

  // Add friend functions (for mobile)
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (userId) => {
    const result = await sendFriendRequest(userId);
    if (result.success) {
      // Update search results to reflect the new status
      const updatedResults = searchResults.map(user => 
        user._id === userId 
          ? { ...user, relationshipStatus: 'sent' }
          : user
      );
      setSearchResults(updatedResults);
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
            {/* Add Friend Button - Only shown on devices ≤650px */}
            {authUser && (
              <button
                onClick={() => setShowAddFriend(true)}
                className="btn btn-sm btn-ghost flex max-[650px]:flex min-[651px]:hidden"
                title="Add Friend"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            )}

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

      {/* Add Friend Modal (for mobile) */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-base-100 text-base-content rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Friends</h3>
              <button
                onClick={() => {
                  setShowAddFriend(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="btn btn-sm btn-ghost"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search by name, username, or email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="input input-bordered w-full pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-zinc-400" />
            </div>

            {/* Search Results */}
            <div className="max-h-60 overflow-y-auto">
              {isSearching && (
                <div className="flex justify-center py-4">
                  <div className="loading loading-spinner loading-sm"></div>
                </div>
              )}

              {!isSearching && searchResults.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-3 hover:bg-base-200 rounded">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullname}
                      className="size-10 rounded-full"
                    />
                    <div>
                      <div className="font-medium">{user.fullname}</div>
                      <div className="text-sm text-zinc-400">@{user.username}</div>
                    </div>
                  </div>

                  <div>
                    {user.relationshipStatus === 'friends' && (
                      <div className="flex items-center gap-1 text-green-600">
                        <UserCheck className="size-4" />
                        <span className="text-sm">Friends</span>
                      </div>
                    )}
                    {user.relationshipStatus === 'sent' && (
                      <span className="text-sm text-zinc-500">Request Sent</span>
                    )}
                    {user.relationshipStatus === 'received' && (
                      <span className="text-sm text-blue-600">Pending</span>
                    )}
                    {user.relationshipStatus === 'none' && (
                      <button
                        onClick={() => handleSendRequest(user._id)}
                        className="btn btn-sm btn-primary"
                      >
                        <UserPlus className="size-4" />
                        Add
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="text-center text-zinc-500 py-4">
                  No users found
                </div>
              )}

              {searchQuery.length < 2 && (
                <div className="text-center text-zinc-400 py-4">
                  Enter at least 2 characters to search
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;