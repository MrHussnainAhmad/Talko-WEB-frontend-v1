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
      const interval = setInterval(getIncomingRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [authUser, getIncomingRequests]);

  const handleAcceptRequest = async (requestId) => {
    const result = await acceptFriendRequest(requestId);
    if (result.success) getIncomingRequests();
  };

  const handleRejectRequest = async (requestId) => {
    const result = await rejectFriendRequest(requestId);
    if (result.success) getIncomingRequests();
  };

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
      const updatedResults = searchResults.map(user => 
        user._id === userId 
          ? { ...user, relationshipStatus: 'sent' }
          : user
      );
      setSearchResults(updatedResults);
    }
  };

  const closeAddFriendModal = () => {
    setShowAddFriend(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <header className="bg-gray-900 border-b border-gray-700 fixed w-full top-0 z-40 backdrop-blur-lg text-white">
      <div className="container mx-auto px-4 sm:px-12 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <a
              href="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold hidden sm:block">Talko</h1>
            </a>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            {authUser && (
              <button
                onClick={() => setShowAddFriend(true)}
                className="btn btn-sm btn-ghost flex md:hidden"
                title="Add Friend"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            )}

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

      {showNotifications && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowNotifications(false)}
        />
      )}

      {showAddFriend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-base-100 text-base-content rounded-lg w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-base-300">
              <h3 className="text-lg font-semibold">Add Friends</h3>
              <button
                onClick={closeAddFriendModal}
                className="btn btn-sm btn-ghost"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6 border-b border-base-300">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, username, or email..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="input input-bordered w-full pl-10 pr-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-zinc-400" />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 btn btn-xs btn-ghost"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isSearching ? (
                <div className="flex justify-center py-4">
                  <div className="loading loading-spinner loading-sm"></div>
                </div>
              ) : (
                <>
                  {searchResults.map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-3 hover:bg-base-200">
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
                </>
              )}
            </div>
            
            {/* Close Button */}
            <div className="p-4 border-t border-base-300">
              <button
                onClick={closeAddFriendModal}
                className="btn btn-block btn-ghost"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;