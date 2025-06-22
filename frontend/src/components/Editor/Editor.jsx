import React from 'react';
import { $getRoot } from 'lexical';
import { $convertToMarkdownString, $convertFromMarkdownString } from '@lexical/markdown';
import { TRANSFORMERS } from '@lexical/markdown';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { editorConfig } from './editorConfig';
import Toolbar from './Toolbar';


// Main Editor Component
function Editor({ documentId }) {
  const [documentTitle, setDocumentTitle] = React.useState('Untitled Document');
  const [isLoading, setIsLoading] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState(null);

  // Load document when documentId changes
  React.useEffect(() => {
    if (documentId) {
      loadDocument(documentId);
    }
  }, [documentId]);

  const loadDocument = async (id) => {
    setIsLoading(true);
    try {
      // Mock document loading - replace with actual API call
      const mockDocument = {
        id: id,
        title: id === '1' ? 'My First Document' : 
               id === '2' ? 'Meeting Notes - Jan 2024' :
               id === '3' ? 'Project Proposal' : 'Untitled Document',
        // Mock markdown content
        content: id === '1' ? '# My First Document\n\nThis is the beginning of my first document. It contains some **sample text** to demonstrate the editor functionality.\n\n- Feature 1\n- Feature 2\n- Feature 3' :
                 id === '2' ? '# Meeting Notes - Jan 2024\n\n## Agenda\n\nTeam meeting notes from our planning session. We discussed:\n\n1. Project timelines\n2. Resource allocation\n3. Next steps' :
                 id === '3' ? '# Project Proposal\n\n## Executive Summary\n\nExecutive summary for the new project initiative. This proposal outlines the key objectives and expected outcomes.\n\n> This is an important quote about the project.' : '',
        lastModified: new Date()
      };
      
      setDocumentTitle(mockDocument.title);
      
      // Load markdown content into editor
      if (mockDocument.content && window.lexicalEditor) {
        window.lexicalEditor.update(() => {
          const root = $getRoot();
          root.clear();
          $convertFromMarkdownString(mockDocument.content, TRANSFORMERS);
        });
      }
      
    } catch (error) {
      console.error('Failed to load document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDocument = async (editorState) => {
    try {
      // Convert editor state to markdown
      let markdownContent = '';
      if (editorState) {
        editorState.read(() => {
          markdownContent = $convertToMarkdownString(TRANSFORMERS);
        });
      }
      
      // Mock document saving - replace with actual API call
      console.log('Saving document as Markdown:', { 
        documentId, 
        title: documentTitle, 
        content: markdownContent,
        format: 'markdown'
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  };

  const onChange = (editorState, editor) => {
    // Store editor reference globally for loading content
    window.lexicalEditor = editor;
    
    // Handle editor changes here if needed
    if (process.env.NODE_ENV === 'development') {
      editorState.read(() => {
        const root = $getRoot();
        const content = root.getTextContent();
        
        // Convert to markdown and log it
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        console.log('🔄 Live Markdown Preview:', markdown);
        console.log('📝 Plain Text:', content);
        
        // Auto-save document after changes (debounced)
        if (documentId && content.trim()) {
          clearTimeout(window.autoSaveTimeout);
          window.autoSaveTimeout = setTimeout(() => {
            saveDocument(editorState);
          }, 2000); // Save after 2 seconds of inactivity
        }
      });
    }
    
    // Dynamically adjust editor height to snap to page-like increments
    editor.update(() => {
      const rootElement = editor.getRootElement();
      if (rootElement) {
        const pageHeight = 1056; // From CSS --page-height
        const pageSpacing = 24;  // From CSS --page-spacing
        const pageWithSpacing = pageHeight + pageSpacing;

        const scrollHeight = rootElement.scrollHeight;
        
        // Calculate the number of pages needed to contain the content
        const numPages = Math.max(1, Math.ceil(scrollHeight / pageWithSpacing));

        // Calculate the total pixel height required for these pages
        const newHeight = (numPages * pageWithSpacing) - pageSpacing;

        // Apply the new height to the editor container
        if (rootElement.style.height !== `${newHeight}px`) {
          rootElement.style.height = `${newHeight}px`;
        }
      }
    });
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="editor-title-section">
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            className="document-title-input"
            placeholder="Untitled Document"
          />
          {lastSaved && (
            <span className="last-saved">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {isLoading && (
            <span className="loading-indicator">Loading...</span>
          )}
        </div>
      </div>
      <LexicalComposer initialConfig={editorConfig}>
        <Toolbar />
        <div className="editor-content">
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                className="ContentEditable__root"
                placeholder={
                  <div className="editor-placeholder">
                    Start writing your document...
                  </div>
                }
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin onChange={onChange} />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <TabIndentationPlugin />
        </div>
      </LexicalComposer>
    </div>
  );
}

export default Editor; 