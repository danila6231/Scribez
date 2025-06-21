import React from 'react';

function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : '';

  return (
    <div className={`chat-message ${message.role}`}>
      <div className="message-content">
        {!isUser && (
          <div className="message-role">
            AI Assistant
          </div>
        )}
        <div className="message-text">
          {message.content}
        </div>
        {timestamp && (
          <div className="message-timestamp">
            {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatMessage; 