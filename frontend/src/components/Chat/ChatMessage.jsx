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
              {message.isStreaming ? '⌛' : '🤖'}
            </span>
            <span className="model-name">{message.model}</span>
            {message.isStreaming && <span className="streaming-indicator">typing...</span>}
          </div>
        )}
        <div className="message-text">
          {isUser ? (
            // For user messages, display as plain text to preserve the original formatting
            <>
              <span>{message.content}</span>
              {message.webSearchEnabled && (
                <span className="web-search-indicator" title="Web search enabled">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
                  </svg>
                </span>
              )}
            </>
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