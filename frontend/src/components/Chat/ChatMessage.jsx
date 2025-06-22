import React from 'react';

function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : '';

  return (
    <div className={`chat-message ${message.role} ${message.hasError ? 'error' : ''}`}>
      <div className="message-content">
        {!isUser && message.model && (
          <div className={`model-badge ${message.model.toLowerCase()}`}>
            <span className="model-icon">
              {message.isStreaming ? '⏳' : '🤖'}
            </span>
            <span className="model-name">{message.model}</span>
            {message.isStreaming && <span className="streaming-indicator">typing...</span>}
          </div>
        )}
        <div className="message-text">
          {message.content}
          {message.isStreaming && (
            <span className="streaming-cursor">▋</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage; 