import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    listenToMessages,
    dontListenToMessages,
    typingUsers,
  } = useChatStore();
  const { authUser, checkBlockStatus, socket } = useAuthStore();
  const messageEndRef = useRef(null);
  const [blockStatus, setBlockStatus] = useState({ isBlocked: false, isBlockedBy: false });

  useEffect(() => {
    if (messageEndRef.current && (messages.length > 0 || typingUsers.length > 0)) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      listenToMessages();
      fetchBlockStatus();

      return () => dontListenToMessages();
    }
  }, [selectedUser?._id, getMessages, listenToMessages, dontListenToMessages]);

  // Listen for real-time blocking status changes
  useEffect(() => {
    if (!socket || !selectedUser?._id) return;

    const handleBlockingUpdate = (data) => {
      // If the selected user blocked us or we blocked them
      if (data.blockerId === selectedUser._id || data.blockedUserId === selectedUser._id) {
        fetchBlockStatus();
      }
    };

    const handleUnblockingUpdate = (data) => {
      // If the selected user unblocked us or we unblocked them
      if (data.unblockerId === selectedUser._id || data.unblockedUserId === selectedUser._id) {
        fetchBlockStatus();
      }
    };

    socket.on('youWereBlocked', handleBlockingUpdate);
    socket.on('youWereUnblocked', handleUnblockingUpdate);
    socket.on('blockActionConfirmed', fetchBlockStatus);
    socket.on('refreshContactsList', (data) => {
      console.log('🔄 ChatContainer: Refreshing block status due to:', data.type);
      fetchBlockStatus();
    });

    return () => {
      socket.off('youWereBlocked', handleBlockingUpdate);
      socket.off('youWereUnblocked', handleUnblockingUpdate);
      socket.off('blockActionConfirmed', fetchBlockStatus);
      socket.off('refreshContactsList', fetchBlockStatus);
    };
  }, [selectedUser?._id, authUser, socket]);

  const fetchBlockStatus = async () => {
    if (selectedUser?._id) {
      const status = await checkBlockStatus(selectedUser._id);
      setBlockStatus(status);
    }
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput isBlockedBy={blockStatus.isBlockedBy} isBlocked={blockStatus.isBlocked} selectedUser={selectedUser} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Show normal messages */}
        {messages.map((message, index) => (
          <div
            key={message._id}
            className={`chat ${
              message.senderId === authUser._id ? "chat-end" : "chat-start"
            }`}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/Profile.png"
                      : selectedUser.profilePic || "/Profile.png"
                  }
                  alt={message.sender?.name || "User"}
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col ">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
        
        {/* Typing Indicator - hide if blocked */}
        {typingUsers.length > 0 && selectedUser && typingUsers.includes(selectedUser._id) && !blockStatus.isBlocked && !blockStatus.isBlockedBy && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={selectedUser.profilePic || "/Profile.png"}
                  alt={selectedUser.fullname || "User"}
                />
              </div>
            </div>
            <div className="chat-bubble flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <span className="text-sm text-gray-500">typing...</span>
            </div>
          </div>
        )}
        
        {/* Invisible div to scroll to */}
        <div ref={messageEndRef} />
      </div>
      
      {/* Show blocking message if current user blocked the selected user */}
      {blockStatus.isBlocked && (
        <div className="px-4 py-2">
          <div className="text-center bg-base-200 rounded-lg p-4 border border-base-300">
            <p className="text-base font-semibold text-base-content">
              🔒 Blocked. Silence is permanent.
            </p>
          </div>
        </div>
      )}
      
      <MessageInput isBlockedBy={blockStatus.isBlockedBy} isBlocked={blockStatus.isBlocked} selectedUser={selectedUser} />
    </div>
  );
};

export default ChatContainer