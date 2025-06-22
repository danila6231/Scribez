import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
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
import { documentAPI } from '../../services/api';
import { debugDocumentAPI, testContentLoading, verifyDocument } from '../../utils/debugAPI';

// Main Editor Component
function Editor() {
  const { documentId } = useParams();
  const { userId } = useAuth();
  const [documentTitle, setDocumentTitle] = React.useState('Untitled Document');
  const [isLoading, setIsLoading] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [lastContent, setLastContent] = React.useState('');
  const [pendingContent, setPendingContent] = React.useState(null);
  const [editorReady, setEditorReady] = React.useState(false);
  const [debugMode, setDebugMode] = React.useState(process.env.NODE_ENV === 'development');

  // Load document when documentId changes
  React.useEffect(() => {
    if (documentId) {
      loadDocument(documentId);
    }
  }, [documentId]);

  // Load pending content when editor becomes ready
  React.useEffect(() => {
    if (editorReady && pendingContent !== null && window.lexicalEditor) {
      console.log('🔄 Loading pending content into editor...');
      loadContentIntoEditor(pendingContent);
      setPendingContent(null);
    }
  }, [editorReady, pendingContent]);

  // Save before user leaves the page
  React.useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges && window.lexicalEditor) {
        // Force save before leaving
        const editorState = window.lexicalEditor.getEditorState();
        saveDocumentSync(editorState);
        
        // Show browser warning
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges && window.lexicalEditor) {
        // Save when tab becomes hidden
        const editorState = window.lexicalEditor.getEditorState();
        saveDocument(editorState);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasUnsavedChanges]);

  const loadDocument = async (id) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📖 Loading document:', id);
      
      // Debug: First verify the document exists
      if (debugMode) {
        const verified = await verifyDocument(id);
        if (!verified) {
          throw new Error('Document verification failed');
        }
      }
      
      // Load both document title and content from API
      const [title, content] = await Promise.all([
        documentAPI.getDocumentTitle(id),
        documentAPI.getDocumentContent(id)
      ]);
      
      console.log('✅ Document data loaded:');
      console.log('Title:', title);
      console.log('Content length:', content?.length || 0);
      console.log('Content preview:', content?.substring(0, 100) || 'No content');
      console.log('Raw content:', JSON.stringify(content));
      
      // Debug: Test content loading
      if (debugMode) {
        testContentLoading(content);
      }
      
      setDocumentTitle(title);
      setLastContent(content || '');
      setHasUnsavedChanges(false);
      
      // If editor is ready, load content immediately, otherwise store as pending
      if (editorReady && window.lexicalEditor) {
        loadContentIntoEditor(content || '');
      } else {
        console.log('⏳ Editor not ready, storing content as pending...');
        setPendingContent(content || '');
      }
      
    } catch (err) {
      console.error('❌ Failed to load document:', err);
      setError(`Failed to load document: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadContentIntoEditor = (content) => {
    if (!window.lexicalEditor) {
      console.error('❌ Editor not available for content loading');
      return;
    }

    try {
      console.log('🔄 Loading content into Lexical editor...');
      console.log('Content to load:', content);
      
      window.lexicalEditor.update(() => {
        const root = $getRoot();
        root.clear();
        
        if (!content || content.trim() === '') {
          console.log('📝 Loading empty content');
          // Create an empty paragraph for empty content
          const paragraph = $createParagraphNode();
          root.append(paragraph);
          return;
        }
        
        // Try to detect if content is markdown
        const isMarkdown = content.includes('# ') || 
                          content.includes('## ') || 
                          content.includes('**') || 
                          content.includes('- ') ||
                          content.includes('1. ') ||
                          content.includes('> ');
        
        if (isMarkdown) {
          console.log('📝 Loading content as Markdown');
          try {
            $convertFromMarkdownString(content, TRANSFORMERS);
          } catch (markdownError) {
            console.warn('⚠️ Markdown conversion failed, loading as plain text:', markdownError);
            loadAsPlainText(content, root);
          }
        } else {
          console.log('📝 Loading content as plain text');
          loadAsPlainText(content, root);
        }
      });
      
      console.log('✅ Content loaded successfully into editor');
      
    } catch (err) {
      console.error('❌ Error loading content into editor:', err);
      setError('Failed to load content into editor');
    }
  };

  const loadAsPlainText = (content, root) => {
    // Split content into lines and create paragraphs
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      const paragraph = $createParagraphNode();
      if (line.trim()) {
        const textNode = $createTextNode(line);
        paragraph.append(textNode);
      }
      root.append(paragraph);
    });
  };

  const saveDocument = async (editorState, title = documentTitle) => {
    if (!documentId) {
      console.error('No document ID provided for saving');
      return false;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      // Convert editor state to markdown
      let markdownContent = '';
      if (editorState) {
        editorState.read(() => {
          markdownContent = $convertToMarkdownString(TRANSFORMERS);
        });
      }
      
      // Only save if content has actually changed
      if (markdownContent === lastContent) {
        console.log('No changes detected, skipping save');
        setIsSaving(false);
        return true;
      }
      
      console.log('💾 Saving document content via PUT endpoint...');
      console.log('Document ID:', documentId);
      console.log('Content length:', markdownContent.length);
      
      // Save document content to backend using PUT endpoint
      const response = await documentAPI.updateDocumentContent(documentId, markdownContent);
      
      setLastSaved(new Date());
      setLastContent(markdownContent);
      setHasUnsavedChanges(false);
      console.log('✅ Document saved successfully via PUT /api/documents/', documentId);
      console.log('Response:', response);
      
      return true;
      
    } catch (err) {
      console.error('❌ Failed to save document:', err);
      setError(`Failed to save document: ${err.message}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Synchronous save for before unload
  const saveDocumentSync = (editorState) => {
    if (!documentId || !editorState) return;

    let markdownContent = '';
    editorState.read(() => {
      markdownContent = $convertToMarkdownString(TRANSFORMERS);
    });

    if (markdownContent === lastContent) return;

    // Use sendBeacon for reliable save on page unload
    const data = JSON.stringify({ content: markdownContent });
    const blob = new Blob([data], { type: 'application/json' });
    navigator.sendBeacon(`https://aiberkeley-hack.onrender.com/api/documents/${documentId}`, blob);
  };

  const onChange = (editorState, editor) => {
    // Store editor reference globally for loading content
    window.lexicalEditor = editor;
    
    // Mark editor as ready on first change
    if (!editorReady) {
      console.log('✅ Editor is now ready');
      setEditorReady(true);
    }
    
    // Check if content has changed
    let currentContent = '';
    editorState.read(() => {
      currentContent = $convertToMarkdownString(TRANSFORMERS);
    });
    
    const hasChanges = currentContent !== lastContent;
    setHasUnsavedChanges(hasChanges);
    
    // Handle editor changes here if needed
    if (process.env.NODE_ENV === 'development') {
      editorState.read(() => {
        const root = $getRoot();
        const textContent = root.getTextContent();
        
        // Convert to markdown and log it
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        console.log('🔄 Live Markdown Preview:', markdown);
        console.log('📝 Plain Text:', textContent);
        console.log('🔄 Content changed:', hasChanges);
      });
    }
    
    // Auto-save document after changes (debounced) - only if content actually changed
    if (documentId && hasChanges) {
      clearTimeout(window.autoSaveTimeout);
      window.autoSaveTimeout = setTimeout(() => {
        console.log('⏰ Auto-save triggered after 3 seconds of inactivity');
        saveDocument(editorState);
      }, 3000); // Save after 3 seconds of inactivity
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

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setDocumentTitle(newTitle);
    setHasUnsavedChanges(true);
    
    // Auto-save title changes (debounced)
    clearTimeout(window.titleSaveTimeout);
    window.titleSaveTimeout = setTimeout(() => {
      // For now, we only save content. Title updates could be added to the API
      console.log('Title updated:', newTitle);
      // Note: Backend doesn't currently have endpoint to update title separately
      // This could be enhanced by adding a title update endpoint
    }, 1000);
  };

  const manualSave = async () => {
    if (window.lexicalEditor && documentId) {
      console.log('🖱️ Manual save triggered');
      const editorState = window.lexicalEditor.getEditorState();
      const success = await saveDocument(editorState);
      
      if (success) {
        // Show brief success feedback
        console.log('✅ Manual save completed successfully');
      }
    }
  };

  // Save when editor loses focus
  const handleEditorBlur = () => {
    if (hasUnsavedChanges && window.lexicalEditor && documentId) {
      console.log('👁️ Editor lost focus, auto-saving...');
      const editorState = window.lexicalEditor.getEditorState();
      saveDocument(editorState);
    }
  };

  const retrySave = async () => {
    if (window.lexicalEditor && documentId) {
      console.log('🔄 Retrying save...');
      const editorState = window.lexicalEditor.getEditorState();
      await saveDocument(editorState);
    }
  };

  const retryLoad = async () => {
    if (documentId) {
      console.log('🔄 Retrying document load...');
      await loadDocument(documentId);
    }
  };

  const runDebugTest = async () => {
    if (documentId) {
      console.log('🐛 Running debug test...');
      const result = await debugDocumentAPI(documentId);
      console.log('Debug test result:', result);
    }
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="editor-title-section">
          <input
            type="text"
            value={documentTitle}
            onChange={handleTitleChange}
            className="document-title-input"
            placeholder="Untitled Document"
          />
          <div className="editor-status">
            {isSaving && (
              <span className="saving-indicator">Saving...</span>
            )}
            {hasUnsavedChanges && !isSaving && (
              <span className="unsaved-indicator">Unsaved changes</span>
            )}
            {lastSaved && !isSaving && !hasUnsavedChanges && (
              <span className="last-saved">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {isLoading && (
              <span className="loading-indicator">Loading...</span>
            )}
            {error && (
              <span className="error-indicator" title={error}>
                Error loading/saving
              </span>
            )}
            {debugMode && (
              <span className="debug-indicator">DEBUG MODE</span>
            )}
          </div>
          <div className="editor-actions">
            {debugMode && (
              <button 
                onClick={runDebugTest} 
                className="debug-btn"
                disabled={isLoading}
              >
                Debug
              </button>
            )}
            {error && (
              <>
                <button 
                  onClick={retryLoad} 
                  className="retry-save-btn"
                  disabled={isSaving || isLoading}
                >
                  Retry Load
                </button>
                <button 
                  onClick={retrySave} 
                  className="retry-save-btn"
                  disabled={isSaving || isLoading}
                >
                  Retry Save
                </button>
              </>
            )}
            <button 
              onClick={manualSave} 
              className="manual-save-btn"
              disabled={isSaving || isLoading}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <div>
            <button onClick={retryLoad} disabled={isLoading}>
              Retry Load
            </button>
            <button onClick={retrySave} disabled={isSaving}>
              Retry Save
            </button>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        </div>
      )}
      
      <LexicalComposer initialConfig={editorConfig}>
        <Toolbar />
        <div className="editor-content" onBlur={handleEditorBlur}>
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