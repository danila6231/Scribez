import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ChatMessage from './ChatMessage';

import { $convertToMarkdownString } from '@lexical/markdown';
import { TRANSFORMERS } from '@lexical/markdown';

// Get the API URL from environment variables or use relative path for local development
const API_URL = import.meta.env.VITE_API_URL || '';



function ChatWindow({ documentId }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load chat history when document changes
  useEffect(() => {
    if (documentId) {
      // TODO: Load chat history from database for this document
      // loadChatHistory(documentId);
      setMessages([]); // Temporary: clear until we implement database loading
    }
  }, [documentId]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      content: inputValue,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    // Create placeholder for streaming AI response
    const streamingMessageId = Date.now();
    const streamingMessage = {
      id: streamingMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date().toISOString(),
      isStreaming: true,
      model: 'thinking...'
    };
    
    setMessages(prev => [...prev, streamingMessage]);

    

    try {
      // Use streaming endpoint
      // Get document content from Lexical editorAdd commentMore actions
      let documentContent = '';
      if (window.lexicalEditor) {
        const editorState = window.lexicalEditor.getEditorState();
        editorState.read(() => {
          documentContent = $convertToMarkdownString(TRANSFORMERS);
        });
      }

      // Use streaming endpoint with the correct base URL
      const response = await fetch(`${API_URL}/api/chat/message/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          conversation_history: messages,
          document_id: documentId,
          document_content: documentContent
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
        
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'metadata') {
                // Update with analysis info
                setMessages(prev => prev.map(msg => 
                  msg.id === streamingMessageId 
                    ? { ...msg, analysis: data.analysis }
                    : msg
                ));
              } else if (data.type === 'model') {
                // Update with model info
                setMessages(prev => prev.map(msg => 
                  msg.id === streamingMessageId 
                    ? { ...msg, model: data.model }
                    : msg
                ));
              } else if (data.type === 'content') {
                // Update the streaming message with new content
                setMessages(prev => prev.map(msg => 
                  msg.id === streamingMessageId 
                    ? { ...msg, content: msg.content + data.content }
                    : msg
                ));
              } else if (data.type === 'done') {
                // Mark streaming as complete
                setMessages(prev => prev.map(msg => 
                  msg.id === streamingMessageId 
                    ? { ...msg, isStreaming: false, timestamp: new Date().toISOString() }
                    : msg
                ));
              } else if (data.type === 'error') {
                // Handle streaming error
                setMessages(prev => prev.map(msg => 
                  msg.id === streamingMessageId 
                    ? { 
                        ...msg, 
                        content: `Error: ${data.error}`,
                        isStreaming: false,
                        hasError: true 
                      }
                    : msg
                ));
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError, 'Raw line:', line);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update streaming message with error
      setMessages(prev => prev.map(msg => 
        msg.id === streamingMessageId 
          ? { 
              ...msg, 
              content: 'Sorry, I encountered an error. Please try again.',
              isStreaming: false,
              hasError: true 
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
      // Focus back on input
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Enter, but allow Shift+Enter for new lines
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>AI Writing Assistant</h2>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '40px 20px' }}>
            <p>👋 Hello! I'm your AI writing assistant.</p>
            <p style={{ marginTop: '10px', fontSize: '14px' }}>
              Ask me for help with brainstorming, grammar, or feedback on your writing.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))
        )}
        

        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Ask for writing help..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
            style={{
              resize: 'none',
              minHeight: '40px',
              maxHeight: '120px',
              height: 'auto'
            }}
            onInput={(e) => {
              // Auto-resize textarea
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            type="submit"
            className="chat-send-button"
            disabled={!inputValue.trim() || isLoading}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatWindow; 