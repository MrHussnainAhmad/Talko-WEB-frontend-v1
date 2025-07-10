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
  const { authUser, checkBlockStatus } = useAuthStore();
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
        <MessageInput isBlocked={blockStatus.isBlockedBy} />
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
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && selectedUser && typingUsers.includes(selectedUser._id) && (
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
      
      <MessageInput isBlocked={blockStatus.isBlockedBy} />
    </div>
  );
};

export default ChatContainer