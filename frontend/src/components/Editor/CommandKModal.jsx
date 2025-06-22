import React, { useState, useRef, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

function CommandKWidget({ isOpen, onClose, documentId, selectedText = '', position = { top: 100, left: 100 } }) {
    if (selectedText === "") {
        return;
    }

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [model, setModel] = useState('thinking...');
  const inputRef = useRef(null);
  const widgetRef = useRef(null);

  // Focus input when widget opens but don't pre-fill with selected text
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Clear state when widget closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setInputValue('');
        setResponse('');
        setIsLoading(false);
        setIsStreaming(false);
        setModel('thinking...');
      }, 200);
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;

    const currentInput = inputValue;
    setIsLoading(true);
    setIsStreaming(true);
    setResponse('');
    setModel('thinking...');

    try {
      const response = await fetch(`${API_URL}/api/chat/message/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          conversation_history: [],
          document_id: documentId,
          selected_text: selectedText || undefined, // Send selected text as separate field
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'metadata') {
                // Update with analysis info if needed
                console.log('Analysis metadata:', data.analysis);
              } else if (data.type === 'model') {
                setModel(data.model);
              } else if (data.type === 'content') {
                setResponse(prev => prev + data.content);
              } else if (data.type === 'done') {
                setIsStreaming(false);
              } else if (data.type === 'error') {
                setResponse(`Error: ${data.error}`);
                setIsStreaming(false);
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setResponse('Sorry, I encountered an error. Please try again.');
      setIsStreaming(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="command-k-widget" 
      ref={widgetRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 9999,
      }}
    >
      <div className="command-k-content">
        <div className="command-k-header-small">
          <span className="command-k-icon-small">⌘</span>
          <span>Ask AI</span>
          {selectedText && (
            <span className="selected-text-indicator">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {selectedText.length} chars selected
            </span>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="command-k-form">
          <input
            ref={inputRef}
            type="text"
            className="command-k-input-small"
            placeholder="Ask me anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="command-k-submit-small"
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? (
              <div className="spinner-small"></div>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            )}
          </button>
        </form>

        {response && (
          <div className="command-k-response">
            {model !== 'thinking...' && (
              <div className="response-model-badge">
                <span className="model-icon">
                  {isStreaming ? '⏳' : '🤖'}
                </span>
                <span className="model-name">{model}</span>
                {isStreaming && <span className="streaming-indicator">typing...</span>}
              </div>
            )}
            <div className="response-text">
              {response}
              {isStreaming && <span className="streaming-cursor-small">▋</span>}
            </div>
          </div>
        )}

        <div className="command-k-hint-small">
          Press <kbd>Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}

export default CommandKWidget; 