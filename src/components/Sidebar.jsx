import React, { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, UserPlus, UserCheck, Search, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { 
    onlineUsers, 
    getFriends, 
    friends, 
    sendFriendRequest, 
    searchUsers,
    incomingRequests,
    outgoingRequests,
    getIncomingRequests
  } = useAuthStore();
  
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  useEffect(() => {
    getUsers();
    getFriends();
    getIncomingRequests();
  }, [getUsers, getFriends, getIncomingRequests]);

  // Search functionality
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

  const closeAddFriendModal = () => {
    setShowAddFriend(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  // Safely handle undefined arrays
  const safeOnlineUsers = onlineUsers || [];
  const safeFriends = friends || [];

  const filteredFriends = showOnlineOnly
    ? safeFriends.filter((friend) => safeOnlineUsers.includes(friend._id))
    : safeFriends;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-6" />
            <span className="font-medium hidden lg:block">Friends</span>
          </div>
          
          {/* Add Friend Button - Hidden on devices ≤650px, shown on larger screens */}
          <button
            onClick={() => setShowAddFriend(true)}
            className="btn btn-sm btn-ghost hidden min-[651px]:flex"
            title="Add Friend"
          >
            <UserPlus className="size-4" />
          </button>
        </div>

        {/* Online filter toggle */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({Math.max(0, safeOnlineUsers.length - 1)} online)
          </span>
        </div>

        {/* Friend Request Notification */}
        {incomingRequests.length > 0 && (
          <div className="mt-2 hidden lg:block">
            <div className="text-xs text-primary font-medium">
              {incomingRequests.length} pending request{incomingRequests.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredFriends.map((friend) => (
          <button
            key={friend._id}
            onClick={() => setSelectedUser(friend)}
            className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors
              ${
                selectedUser?._id === friend._id
                  ? "bg-base-300 ring-1 ring-base-300"
                  : ""
              }
            `}
          >
            <div className="relative mx-auto lg:mx-0">
              <img
                src={friend.profilePic || "/avatar.png"}
                alt={friend.username || friend.fullname || "User"}
                className="size-12 object-cover rounded-full"
              />
              {safeOnlineUsers.includes(friend._id) && (
                <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
              )}
            </div>

            <div className="hidden lg:block text-left min-w-0">
              <div className="font-medium truncate">{friend.fullname || friend.username || "Unknown User"}</div>
              <div className="text-sm text-zinc-400">
                {safeOnlineUsers.includes(friend._id) ? "Online" : "Offline"}
              </div>
            </div>
          </button>
        ))}

        {filteredFriends.length === 0 && (
          <div className="text-center text-zinc-500 py-4">
            <div className="mb-2">
              {showOnlineOnly ? "No online friends" : "No friends yet"}
            </div>
            {/* Add Friends button - only show on screens wider than 650px */}
            <div className="hidden min-[651px]:block">
              <button
                onClick={() => setShowAddFriend(true)}
                className="btn btn-sm btn-primary flex mx-auto"
              >
                <UserPlus className="size-4" />
                Add Friends
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-base-100 rounded-lg w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-base-300">
              <h3 className="text-lg font-semibold">Add Friends</h3>
              <button
                onClick={closeAddFriendModal}
                className="btn btn-sm btn-ghost"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Search Input */}
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

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto p-6">
              {isSearching && (
                <div className="flex justify-center py-4">
                  <div className="loading loading-spinner loading-sm"></div>
                </div>
              )}

              {!isSearching && searchResults.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-3 hover:bg-base-200 rounded mb-2 last:mb-0">
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
    </aside>
  );
};

export default Sidebar;