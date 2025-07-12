import React from 'react';
import { formatDistanceToNow } from 'date-fns';

/**
 * Message bubble component
 * @param {Object} props - Component props
 * @param {Object} props.message - The message object to display
 */
function MessageBubble({ message }) {
  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className={`message ${message.isSent ? 'sent' : 'received'}`}>
      <div className="message-content">
        <span>
          {message.message}
        </span>
      </div>
      <div className="message-meta">
        <span className="timestamp">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  );
}

export default MessageBubble;
