import React, { useState, useRef, useEffect } from 'react';
import Editor from './Editor/Editor';
import ChatWindow from './Chat/ChatWindow';

function Layout() {
  const [chatWidth, setChatWidth] = useState(400);
  const [isDragging, setIsDragging] = useState(false);
  const layoutRef = useRef(null);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !layoutRef.current) return;

    const layoutRect = layoutRef.current.getBoundingClientRect();
    const newChatWidth = layoutRect.width - e.clientX + layoutRect.left;
    
    // Set minimum and maximum widths
    const minChatWidth = 300;
    const maxChatWidth = layoutRect.width - 400; // Leave at least 400px for editor
    
    if (newChatWidth >= minChatWidth && newChatWidth <= maxChatWidth) {
      setChatWidth(newChatWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className="layout-container" ref={layoutRef}>
      <div className="editor-section" style={{ flex: 1 }}>
        <Editor />
      </div>
      <div 
        className={`resize-handle ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
      />
      <div className="chat-section" style={{ width: `${chatWidth}px` }}>
        <ChatWindow />
      </div>
    </div>
  );
}

export default Layout; 