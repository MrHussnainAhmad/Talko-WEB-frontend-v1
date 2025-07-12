import React, { useState } from 'react';
import { toast } from 'react-toastify';

/**
 * Message input component
 * @param {Object} props - Component props
 * @param {Object} props.selectedUser - The user to send the message to
 * @param {Function} props.onMessageSent - Callback when message is sent
 */
function MessageInput({ selectedUser, onMessageSent }) {
  const [message, setMessage] = useState('');
  
  const handleSend = async () => {
    if (!message.trim()) return;
    
    try {
      const messageData = {
        message: message.trim(),
        receiverId: selectedUser._id,
        conversationId: selectedUser.conversationId || selectedUser._id
      };

      // Send the message through the API
      await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });
      
      // Clear the input and notify parent
      setMessage('');
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="message-input">
      <input 
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type a message..."
        className="message-input-field"
      />
      <button 
        onClick={handleSend} 
        disabled={!message.trim()}
        className="send-button"
      >
        📤 Send
      </button>
    </div>
  );
}

export default MessageInput;
