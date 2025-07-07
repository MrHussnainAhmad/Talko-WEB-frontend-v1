import React, { useState } from 'react'
import { useChatStore } from '../store/useChatStore'
import { useAuthStore } from '../store/useAuthStore'
import { X, Circle, UserCheck, Trash2, Shield } from 'lucide-react'
import UserProfile from './UserProfile'

const ChatHeader = () => {
    const { selectedUser, setSelectedUser, messageCounts, deleteChatHistory, typingUsers } = useChatStore();
    const { onlineUsers, removeFriend } = useAuthStore();
    const [showProfile, setShowProfile] = useState(false);

    const isOnline = onlineUsers.includes(selectedUser?._id);
    const messageCount = messageCounts[selectedUser?._id] || 0;
    const isTyping = typingUsers.includes(selectedUser?._id);

    const handleRemoveFriend = async () => {
        if (window.confirm(`Are you sure you want to remove ${selectedUser?.fullname} as a friend?`)) {
            await removeFriend(selectedUser?._id);
            setSelectedUser(null);
        }
    };

    const handleDeleteChatHistory = async () => {
        if (window.confirm(`Are you sure you want to delete your chat history with ${selectedUser?.fullname}? This will delete the history for both users.`)) {
            await deleteChatHistory(selectedUser?._id);
        }
    };

    return (
        <div className='p-2.5 border-b border-base-300 bg-base-100'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                    {/* AVATAR / PROFILE-PIC with Online Indicator */}
                    <div className='avatar'>
                        <div 
                            className='size-10 rounded-full relative cursor-pointer hover:opacity-80 transition-opacity' 
                            onClick={() => setShowProfile(true)}
                            title={`View ${selectedUser?.fullname}'s profile`}
                        >
                            <img 
                                src={selectedUser?.profilePic || '/Profile.png'} 
                                alt={selectedUser?.fullname || 'User'} 
                                className='rounded-full object-cover'
                            />
                            {/* Online Status Indicator */}
                            <div className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-base-100 ${
                                isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                        </div>
                    </div>

                    {/* USER INFO */}
                    <div className='flex-1'>
                        <div className='flex items-center gap-2'>
                            <h3 className='font-medium text-base-content'>
                                {selectedUser?.fullname}
                            </h3>
                            {/* Friend Indicator */}
                            <UserCheck className='size-4 text-green-600' title='Friend' />
                        </div>
                        
                        <div className='flex items-center gap-2'>
                            <p className='text-sm text-base-content/70'>
                                @{selectedUser?.username}
                            </p>
                            <span className='text-base-content/50'>•</span>
                            <div className='flex items-center gap-1'>
                                <Circle className={`size-2 fill-current ${
                                    isTyping ? 'text-blue-500' : isOnline ? 'text-green-500' : 'text-gray-400'
                                }`} />
                                <p className={`text-sm font-medium ${
                                    isTyping ? 'text-blue-600' : isOnline ? 'text-green-600' : 'text-base-content/70'
                                }`}>
                                    {isTyping ? 'typing...' : isOnline ? 'Online' : 'Offline'}
                                </p>
                            </div>
                            <span className='text-base-content/50'>•</span>
                            <p className='text-sm text-base-content/70'>
                                {messageCount} {messageCount === 1 ? 'message' : 'messages'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className='flex items-center gap-2'>
                    {/* Privacy+ Button */}
                    <button 
                        onClick={handleDeleteChatHistory}
                        className='btn btn-ghost btn-sm btn-circle hover:bg-base-200 group'
                        aria-label='Delete chat history'
                        title='Delete chat history for both users (Privacy+)'
                    >
                        <Shield className='size-5 text-info group-hover:text-info-focus' />
                    </button>
                    
                    {/* Remove Friend Button */}
                    <button 
                        onClick={handleRemoveFriend}
                        className='btn btn-ghost btn-sm btn-circle hover:bg-base-200 group'
                        aria-label='Remove friend'
                        title='Remove friend'
                    >
                        <Trash2 className='size-5 text-error group-hover:text-error-focus' />
                    </button>
                    
                    {/* Close Button */}
                    <button 
                        onClick={() => setSelectedUser(null)}
                        className='btn btn-ghost btn-sm btn-circle hover:bg-base-200'
                        aria-label='Close chat'
                    >
                        <X className='size-5' />
                    </button>
                </div>
            </div>

            {/* User Profile Modal */}
            {showProfile && selectedUser && (
                <UserProfile 
                    userId={selectedUser._id} 
                    onClose={() => setShowProfile(false)} 
                />
            )}
        </div>
    )
}

export default ChatHeader