import React from 'react';
import Editor from './Editor/Editor';
import ChatWindow from './Chat/ChatWindow';

function Layout() {
  return (
    <div className="layout-container">
      <div className="editor-section">
        <Editor />
      </div>
      <div className="chat-section">
        <ChatWindow />
      </div>
    </div>
  );
}

export default Layout; 