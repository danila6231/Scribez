import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github.css';

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
          {isUser ? (
            // For user messages, display as plain text to preserve the original formatting
            <span>{message.content}</span>
          ) : (
            // For assistant messages, render as markdown
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeRaw]}
              components={{
                // Custom components for better styling
                code: ({ node, inline, className, children, ...props }) => {
                  if (inline) {
                    return <code className="inline-code" {...props}>{children}</code>;
                  }
                  return (
                    <pre className="code-block">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                },
                blockquote: ({ children }) => (
                  <blockquote className="markdown-blockquote">{children}</blockquote>
                ),
                table: ({ children }) => (
                  <div className="table-container">
                    <table className="markdown-table">{children}</table>
                  </div>
                ),
                // Ensure links open in new tab for safety
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="markdown-link">
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
          {message.isStreaming && (
            <span className="streaming-cursor">▋</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage; 