import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ChatMessage from './ChatMessage';
import { $convertToMarkdownString } from '@lexical/markdown';
import { TRANSFORMERS } from '@lexical/markdown';
import DiffView from '../Diff/DiffView';

// Get the API URL from environment variables or use relative path for local development
const API_URL = import.meta.env.VITE_API_URL || '';

function ChatWindow({ documentId }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [mode, setMode] = useState('ask'); // 'ask' or 'edit'
  const [editPlan, setEditPlan] = useState(null);
  const [showDiffView, setShowDiffView] = useState(false);
  const [diffChanges, setDiffChanges] = useState([]);
  const [originalContent, setOriginalContent] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Function to apply changes to the editor
  const applyChangesToEditor = (changes) => {
    if (!window.lexicalEditor) return;
    
    // Sort changes by position to apply them correctly
    const sortedChanges = [...changes].sort((a, b) => {
      // Apply deletions and replacements first, then insertions
      // Within each type, apply from end to beginning to maintain positions
      if (a.type === b.type) {
        return b.start_pos - a.start_pos;
      }
      return (a.type === 'delete' || a.type === 'replace') ? -1 : 1;
    });

    // Build the new text
    let newText = originalContent;
    let offset = 0;

    sortedChanges.forEach(change => {
      if (change.type === 'delete') {
        const startPos = change.start_pos + offset;
        const endPos = change.end_pos + offset;
        newText = newText.substring(0, startPos) + newText.substring(endPos);
        offset -= (endPos - startPos);
      } else if (change.type === 'insert') {
        const pos = change.start_pos + offset;
        newText = newText.substring(0, pos) + change.new_text + newText.substring(pos);
        offset += change.new_text.length;
      } else if (change.type === 'replace') {
        const startPos = change.start_pos + offset;
        const endPos = change.end_pos + offset;
        newText = newText.substring(0, startPos) + change.new_text + newText.substring(endPos);
        offset += change.new_text.length - (endPos - startPos);
      }
    });

    // Update the Lexical editor with the new content
    window.lexicalEditor.update(() => {
      const root = window.$getRoot();
      root.clear();
      
      // Convert the new text back to Lexical nodes
      // This is a simplified version - you might need to use proper markdown parsing
      const paragraphs = newText.split('\n\n');
      paragraphs.forEach((paragraph, index) => {
        if (paragraph.trim()) {
          const paragraphNode = window.$createParagraphNode();
          const textNode = window.$createTextNode(paragraph);
          paragraphNode.append(textNode);
          root.append(paragraphNode);
        }
      });
    });
  };

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
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;
    
    // Get document content from Lexical editor
    let documentContent = '';
    if (window.lexicalEditor) {
      const editorState = window.lexicalEditor.getEditorState();
      editorState.read(() => {
        documentContent = $convertToMarkdownString(TRANSFORMERS);
      });
    }
    
    if (mode === 'ask') {
      // Keep existing "ask" mode functionality
      handleAskMode(trimmedInput, documentContent);
    } else {
      // New "edit" mode functionality
      handleEditMode(trimmedInput, documentContent);
    }
  };

  const handleAskMode = async (trimmedInput, documentContent) => {
    // Create user message with clean content
    const userMessage = {
      content: trimmedInput,
      role: 'user',
      timestamp: new Date().toISOString(),
      webSearchEnabled: webSearchEnabled,
    };
    
    // Prepare message for API (add web search instruction only for backend)
    const apiMessage = webSearchEnabled ? trimmedInput + " and do a web search" : trimmedInput;

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Reset textarea height to original size
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = '40px'; // Reset to minHeight
    }

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
      // Use streaming endpoint with the correct base URL
      const response = await fetch(`${API_URL}/api/chat/message/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: apiMessage,
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

  const handleEditMode = async (trimmedInput, documentContent) => {
    // Store original content for diff
    setOriginalContent(documentContent);
    
    // Add user message
    const userMessage = {
      content: trimmedInput,
      role: 'user',
      timestamp: new Date().toISOString(),
      mode: 'edit'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = '40px';
    }

    try {
      // Step 1: Get the plan using streaming endpoint
      const planMessageId = Date.now();
      const planMessage = {
        id: planMessageId,
        content: '',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        isStreaming: true,
        model: 'planning...',
        isPlan: true
      };
      
      setMessages(prev => [...prev, planMessage]);

      // Stream the plan
      const planResponse = await fetch(`${API_URL}/api/chat/message/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Create a short concise plan (3-5 sentences) for the following edit request: ${trimmedInput}. DO EXACTLY what is asked by the user, nothing else. DO NOT INCLUDE THE REWRITTEN DOCUMENT.`,
          conversation_history: messages,
          document_id: documentId,
          document_content: documentContent
        }),
      });

      if (!planResponse.ok) {
        throw new Error(`HTTP error! status: ${planResponse.status}`);
      }

      let planContent = '';
      const reader = planResponse.body.getReader();
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
              
              if (data.type === 'content') {
                planContent += data.content;
                setMessages(prev => prev.map(msg => 
                  msg.id === planMessageId 
                    ? { ...msg, content: msg.content + data.content }
                    : msg
                ));
              } else if (data.type === 'model') {
                setMessages(prev => prev.map(msg => 
                  msg.id === planMessageId 
                    ? { ...msg, model: data.model }
                    : msg
                ));
              } else if (data.type === 'done') {
                setMessages(prev => prev.map(msg => 
                  msg.id === planMessageId 
                    ? { ...msg, isStreaming: false }
                    : msg
                ));
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }

      setEditPlan(planContent);

      // Step 2: Generate new document version
      const editResponse = await axios.post(`${API_URL}/api/chat/message`, {
        message: `Based on this plan: "${planContent}", apply the following edit to the document: ${trimmedInput}. DO EXACTLY WHAT IS ASKED, DO NOT ADD MODIFY ANYTHING ELSE. Return ONLY the edited document content, nothing else.`,
        conversation_history: [],
        document_content: documentContent,
        edit_mode: true
      });

      const newContent = editResponse.data.response;

      // Step 3: Compute diff
      const diffResponse = await axios.post(`${API_URL}/api/diff/compute`, {
        old_content: documentContent,
        new_content: newContent,
        granularity: 'word'
      });

            const computedChanges = diffResponse.data.changes;
      setDiffChanges(computedChanges);
      setShowDiffView(true);

      // Log the changes to verify they're not empty
      console.log('Computed changes:', JSON.stringify(computedChanges));

      // Step 5: Stream summary of changes (while user reviews diff)
      const summaryMessageId = Date.now() + 1;
      const summaryMessage = {
        id: summaryMessageId,
        content: '',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        isStreaming: true,
        model: 'summarizing...',
        isSummary: true
      };
      
      setMessages(prev => [...prev, summaryMessage]);

      const summaryResponse = await fetch(`${API_URL}/api/chat/message/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Summarize the changes you made to the document based on this json of changes: "${JSON.stringify(computedChanges)}". Be concise and explain your choice.`,
        }),
      });

      const summaryReader = summaryResponse.body.getReader();
      const summaryDecoder = new TextDecoder();
      let summaryBuffer = '';

      while (true) {
        const { done, value } = await summaryReader.read();
        if (done) break;

        summaryBuffer += summaryDecoder.decode(value, { stream: true });
        const lines = summaryBuffer.split('\n');
        summaryBuffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'content') {
                setMessages(prev => prev.map(msg => 
                  msg.id === summaryMessageId 
                    ? { ...msg, content: msg.content + data.content }
                    : msg
                ));
              } else if (data.type === 'model') {
                setMessages(prev => prev.map(msg => 
                  msg.id === summaryMessageId 
                    ? { ...msg, model: data.model }
                    : msg
                ));
              } else if (data.type === 'done') {
                setMessages(prev => prev.map(msg => 
                  msg.id === summaryMessageId 
                    ? { ...msg, isStreaming: false }
                    : msg
                ));
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error in edit mode:', error);
      setMessages(prev => [...prev, {
        content: 'Sorry, I encountered an error while processing your edit request. Please try again.',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        hasError: true
      }]);
    } finally {
      setIsLoading(false);
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
        <div className="mode-toggle">
          <button
            className={`mode-button ${mode === 'ask' ? 'active' : ''}`}
            onClick={() => setMode('ask')}
            disabled={isLoading}
          >
            Ask
          </button>
          <button
            className={`mode-button ${mode === 'edit' ? 'active' : ''}`}
            onClick={() => setMode('edit')}
            disabled={isLoading}
          >
            Edit
          </button>
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '40px 20px' }}>
            <p>👋 Hello! I'm your AI writing assistant.</p>
            <p style={{ marginTop: '10px', fontSize: '14px' }}>
              {mode === 'ask' 
                ? 'Ask me for help with brainstorming, grammar, or feedback on your writing.'
                : 'Tell me how you want to edit your document.'}
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {showDiffView && (
        <div className="diff-overlay" onClick={(e) => {
          if (e.target.className === 'diff-overlay') {
            setShowDiffView(false);
            setDiffChanges([]);
          }
        }}>
          <div className="diff-overlay-content">
            <div className="diff-overlay-header">
              <h3>Proposed Changes</h3>
              <button onClick={() => {
                setShowDiffView(false);
                setDiffChanges([]);
              }}>Close</button>
            </div>
            <DiffView 
              originalText={originalContent} 
              changes={diffChanges}
              onAccept={(changeId) => {
                console.log('Accepted change:', changeId);
              }}
              onReject={(changeId) => {
                console.log('Rejected change:', changeId);
              }}
              onAcceptAll={() => {
                // Apply all changes to the editor
                applyChangesToEditor(diffChanges);
                setShowDiffView(false);
                setDiffChanges([]);
              }}
              onRejectAll={() => {
                // Close without applying any changes
                setShowDiffView(false);
                setDiffChanges([]);
              }}
            />
          </div>
        </div>
      )}

      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <div className="chat-input-wrapper">
            {mode === 'ask' && (
              <button
                type="button"
                className={`web-search-toggle ${webSearchEnabled ? 'active' : ''}`}
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                title={webSearchEnabled ? "Web search enabled" : "Enable web search"}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
                </svg>
              </button>
            )}
            <textarea
              ref={inputRef}
              className={`chat-input ${webSearchEnabled && mode === 'ask' ? 'web-search-enabled' : ''}`}
              placeholder={mode === 'ask' 
                ? (webSearchEnabled ? "Ask for help with web search..." : "Ask for writing help...")
                : "Describe how you want to edit the document..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
              style={{
                resize: 'none',
                minHeight: '40px',
                maxHeight: '120px',
                height: 'auto',
                paddingLeft: mode === 'ask' ? '48px' : '16px'
              }}
              onInput={(e) => {
                // Auto-resize textarea
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          <button
            type="submit"
            className="chat-send-button"
            disabled={!inputValue.trim() || isLoading}
          >
            {mode === 'edit' ? 'Edit' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatWindow; 