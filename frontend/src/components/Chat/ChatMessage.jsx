import React from 'react';

function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : '';

  return (
    <div className="chat-message">
      <div className={`message-avatar ${message.role}`}>
        {isUser ? 'U' : 'AI'}
      </div>
      <div className="message-content">
        <div className="message-role">
          {isUser ? 'You' : 'AI Assistant'}
        </div>
        <div className="message-text">
          {message.content}
        </div>
        {timestamp && (
          <div className="message-timestamp">
            {timestamp}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatMessage; 