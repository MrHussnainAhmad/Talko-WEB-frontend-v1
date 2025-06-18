import React from 'react'
import { useChatStore } from '../store/useChatStore'
import { useAuthStore } from '../store/useAuthStore'
import { X, Circle, UserCheck } from 'lucide-react'

const ChatHeader = () => {
    const { selectedUser, setSelectedUser } = useChatStore();
    const { onlineUsers } = useAuthStore();

    const isOnline = onlineUsers.includes(selectedUser?._id);

    return (
        <div className='p-2.5 border-b border-base-300 bg-base-100'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                    {/* AVATAR / PROFILE-PIC with Online Indicator */}
                    <div className='avatar'>
                        <div className='size-10 rounded-full relative'>
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
                                    isOnline ? 'text-green-500' : 'text-gray-400'
                                }`} />
                                <p className={`text-sm font-medium ${
                                    isOnline ? 'text-green-600' : 'text-base-content/70'
                                }`}>
                                    {isOnline ? 'Online' : 'Offline'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

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
    )
}

export default ChatHeader