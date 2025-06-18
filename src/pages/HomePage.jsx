import React, { useState, useEffect } from 'react'
import { useChatStore } from '../store/useChatStore.js'
import { useAuthStore } from '../store/useAuthStore.js'
import Sidebar from '../components/Sidebar.jsx'
import NoChatSeleted from '../components/NoChatSeleted.jsx'
import ChatContainer from '../components/ChatContainer.jsx'
import { 
  Users, 
  UserPlus, 
  Bell, 
  Check, 
  X, 
  Search,
  ArrowLeft,
  Clock,
  UserCheck
} from 'lucide-react'

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const {
    incomingRequests,
    outgoingRequests,
    friends,
    getIncomingRequests,
    getOutgoingRequests,
    getFriends,
    acceptFriendRequest,
    rejectFriendRequest,
    sendFriendRequest,
    searchUsers,
    isLoadingRequests
  } = useAuthStore();

  const [showFriendPanel, setShowFriendPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'incoming', 'outgoing', 'search'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    getIncomingRequests();
    getOutgoingRequests();
    getFriends();
  }, []);

  const handleSearch = async (query) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleAcceptRequest = async (requestId) => {
    await acceptFriendRequest(requestId);
  };

  const handleRejectRequest = async (requestId) => {
    await rejectFriendRequest(requestId);
  };

  const handleSendRequest = async (userId, message = '') => {
    const result = await sendFriendRequest(userId, message);
    if (result.success) {
      // Update search results to reflect the sent request
      setSearchResults(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, relationshipStatus: 'sent' }
            : user
        )
      );
    }
  };

  const FriendPanel = () => (
    <div className="w-80 bg-base-100 border-l border-base-300 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="size-5" />
            Friends
          </h2>
          <button
            onClick={() => setShowFriendPanel(false)}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <ArrowLeft className="size-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-base-200 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
              activeTab === 'friends' 
                ? 'bg-base-100 shadow-sm font-medium' 
                : 'hover:bg-base-300'
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors relative ${
              activeTab === 'incoming' 
                ? 'bg-base-100 shadow-sm font-medium' 
                : 'hover:bg-base-300'
            }`}
          >
            Requests ({incomingRequests.length})
            {incomingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-error text-white text-xs rounded-full size-5 flex items-center justify-center">
                {incomingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
              activeTab === 'search' 
                ? 'bg-base-100 shadow-sm font-medium' 
                : 'hover:bg-base-300'
            }`}
          >
            Add
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'friends' && (
          <div className="p-4 space-y-3">
            {friends.length === 0 ? (
              <div className="text-center py-8 text-base-content/60">
                <Users className="size-12 mx-auto mb-2 opacity-50" />
                <p>No friends yet</p>
                <p className="text-sm">Add some friends to start chatting!</p>
              </div>
            ) : (
              friends.map((friend) => (
                <div key={friend._id} className="flex items-center gap-3 p-3 rounded-lg bg-base-200">
                  <div className="avatar">
                    <div className="size-10 rounded-full">
                      <img src={friend.profilePic || '/Profile.png'} alt={friend.fullname} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{friend.fullname}</h4>
                    <p className="text-sm text-base-content/70">@{friend.username}</p>
                  </div>
                  <UserCheck className="size-4 text-green-600" />
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'incoming' && (
          <div className="p-4 space-y-3">
            {incomingRequests.length === 0 ? (
              <div className="text-center py-8 text-base-content/60">
                <Bell className="size-12 mx-auto mb-2 opacity-50" />
                <p>No pending requests</p>
              </div>
            ) : (
              incomingRequests.map((request) => (
                <div key={request._id} className="p-3 rounded-lg bg-base-200 border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="avatar">
                      <div className="size-10 rounded-full">
                        <img 
                          src={request.senderId.profilePic || '/Profile.png'} 
                          alt={request.senderId.fullname} 
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{request.senderId.fullname}</h4>
                      <p className="text-sm text-base-content/70">@{request.senderId.username}</p>
                    </div>
                  </div>
                  
                  {request.message && (
                    <p className="text-sm mb-3 p-2 bg-base-100 rounded italic">
                      "{request.message}"
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(request._id)}
                      className="btn btn-success btn-sm flex-1"
                      disabled={isLoadingRequests}
                    >
                      <Check className="size-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request._id)}
                      className="btn btn-error btn-sm flex-1"
                      disabled={isLoadingRequests}
                    >
                      <X className="size-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'outgoing' && (
          <div className="p-4 space-y-3">
            {outgoingRequests.length === 0 ? (
              <div className="text-center py-8 text-base-content/60">
                <Clock className="size-12 mx-auto mb-2 opacity-50" />
                <p>No outgoing requests</p>
              </div>
            ) : (
              outgoingRequests.map((request) => (
                <div key={request._id} className="flex items-center gap-3 p-3 rounded-lg bg-base-200">
                  <div className="avatar">
                    <div className="size-10 rounded-full">
                      <img 
                        src={request.receiverId.profilePic || '/Profile.png'} 
                        alt={request.receiverId.fullname} 
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{request.receiverId.fullname}</h4>
                    <p className="text-sm text-base-content/70">@{request.receiverId.username}</p>
                  </div>
                  <div className="text-xs text-warning font-medium">Pending</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="p-4">
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-base-content/50" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                className="input input-bordered w-full pl-10"
              />
            </div>

            {/* Search Results */}
            <div className="space-y-3">
              {isSearching ? (
                <div className="flex justify-center py-4">
                  <div className="loading loading-spinner loading-md"></div>
                </div>
              ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                <div className="text-center py-8 text-base-content/60">
                  <Search className="size-12 mx-auto mb-2 opacity-50" />
                  <p>No users found</p>
                </div>
              ) : (
                searchResults.map((user) => (
                  <div key={user._id} className="flex items-center gap-3 p-3 rounded-lg bg-base-200">
                    <div className="avatar">
                      <div className="size-10 rounded-full">
                        <img src={user.profilePic || '/Profile.png'} alt={user.fullname} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{user.fullname}</h4>
                      <p className="text-sm text-base-content/70">@{user.username}</p>
                    </div>
                    <div>
                      {user.relationshipStatus === 'friends' && (
                        <span className="text-xs bg-success text-success-content px-2 py-1 rounded-full">
                          Friends
                        </span>
                      )}
                      {user.relationshipStatus === 'sent' && (
                        <span className="text-xs bg-warning text-warning-content px-2 py-1 rounded-full">
                          Sent
                        </span>
                      )}
                      {user.relationshipStatus === 'received' && (
                        <span className="text-xs bg-info text-info-content px-2 py-1 rounded-full">
                          Received
                        </span>
                      )}
                      {user.relationshipStatus === 'none' && (
                        <button
                          onClick={() => handleSendRequest(user._id)}
                          className="btn btn-primary btn-sm"
                        >
                          <UserPlus className="size-4" />
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className='h-screen bg-base-200'>
      <div className='flex items-center justify-center pt-20 px-4'>
        <div className='bg-base-100 rounded-lg shadow-xl w-full max-w-6xl h-[calc(100vh-8rem)]'>
          <div className='flex h-full rounded-lg overflow-hidden'>
            <Sidebar />

            {!selectedUser ? <NoChatSeleted /> : <ChatContainer />}

            {/* Friend Management Panel */}
            {showFriendPanel && <FriendPanel />}

            {/* Float Action Button for Friend Management */}
            {!showFriendPanel && (
              <button
                onClick={() => setShowFriendPanel(true)}
                className="fixed bottom-6 right-6 btn btn-primary btn-circle btn-lg shadow-lg z-10"
                title="Manage Friends"
              >
                <div className="relative">
                  <Users className="size-6" />
                  {incomingRequests.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-error text-white text-xs rounded-full size-5 flex items-center justify-center">
                      {incomingRequests.length}
                    </span>
                  )}
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage