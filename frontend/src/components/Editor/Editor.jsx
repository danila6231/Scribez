import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { $getRoot, $createParagraphNode, $createTextNode, $getSelection } from 'lexical';
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
import CommandKWidget from './CommandKModal';
import { documentAPI } from '../../services/api';
import { debugDocumentAPI, testContentLoading, verifyDocument } from '../../utils/debugAPI';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

// Main Editor Component
function Editor() {
  const { documentId } = useParams();
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [documentTitle, setDocumentTitle] = React.useState('Untitled Document');
  const [isLoading, setIsLoading] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [lastContent, setLastContent] = React.useState('');
  const [lastTitle, setLastTitle] = React.useState(''); // Track original title
  const [pendingContent, setPendingContent] = React.useState(null);
  const [debugMode, setDebugMode] = React.useState(process.env.NODE_ENV === 'development');
  const [isCommandKOpen, setIsCommandKOpen] = React.useState(false);
  const [selectedText, setSelectedText] = React.useState('');
  const [commandKPosition, setCommandKPosition] = React.useState({ top: 100, left: 100 });
  const editorRef = React.useRef(null);

  // Handle Cmd+K keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        
        // Get selected text from the editor if available
        if (window.lexicalEditor) {
          window.lexicalEditor.getEditorState().read(() => {
            const selection = $getSelection();
            if (selection && !selection.isCollapsed()) {
              const text = selection.getTextContent();
              setSelectedText(text);
            } else {
              setSelectedText('');
            }
          });
        }
        
        // Position the widget near the center of the editor
        const editorElement = document.querySelector('.ContentEditable__root');
        if (editorElement) {
          const rect = editorElement.getBoundingClientRect();
          setCommandKPosition({
            top: rect.top + 100,
            left: rect.left + rect.width / 2 - 160, // Center horizontally (-160 = half widget width)
          });
        }
        
        setIsCommandKOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);



  // Load document when documentId changes
  React.useEffect(() => {
    if (documentId) {
      loadDocument(documentId);
    }
  }, [documentId]);

  // Load content when both editor and content are ready
  React.useEffect(() => {
    if (pendingContent !== null && (editorRef.current || window.lexicalEditor)) {
      console.log('🔄 Loading pending content - editor and content both ready!');
      loadContentIntoEditor(pendingContent);
      setPendingContent(null);
    }
  }, [pendingContent]);

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
      console.log('Number of newlines in content:', (content?.match(/\n/g) || []).length);
      
      // Debug: Test content loading
      if (debugMode) {
        testContentLoading(content);
      }
      
      setDocumentTitle(title);
      setLastContent(content || '');
      setLastTitle(title); // Track the original title
      setHasUnsavedChanges(false);
      
      // Store content as pending for the EditorRefPlugin to handle
      console.log('⏳ Storing content as pending for immediate loading...');
      setPendingContent(content || '');
      
    } catch (err) {
      console.error('❌ Failed to load document:', err);
      setError(`Failed to load document: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadContentIntoEditor = (content) => {
    const editor = window.lexicalEditor || editorRef.current;
    if (!editor) {
      console.error('❌ Editor not available for content loading');
      return;
    }

    try {
      console.log('🔄 Loading content into Lexical editor...');
      console.log('Content to load:', content);
      
      // Normalize content before loading to prevent newline accumulation
      const normalizedContent = normalizeContent(content);
      console.log('Normalized content:', normalizedContent);
      
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        
        if (!normalizedContent || normalizedContent.trim() === '') {
          console.log('📝 Loading empty content');
          // Create an empty paragraph for empty content
          const paragraph = $createParagraphNode();
          root.append(paragraph);
          return;
        }
        
        // Try to detect if content is markdown
        const isMarkdown = normalizedContent.includes('# ') || 
                          normalizedContent.includes('## ') || 
                          normalizedContent.includes('**') || 
                          normalizedContent.includes('- ') ||
                          normalizedContent.includes('1. ') ||
                          normalizedContent.includes('> ');
        
        if (isMarkdown) {
          console.log('📝 Loading content as Markdown');
          try {
            $convertFromMarkdownString(normalizedContent, TRANSFORMERS);
          } catch (markdownError) {
            console.warn('⚠️ Markdown conversion failed, loading as plain text:', markdownError);
            loadAsPlainText(normalizedContent, root);
          }
        } else {
          console.log('📝 Loading content as plain text');
          loadAsPlainText(normalizedContent, root);
        }
      });
      
      console.log('✅ Content loaded successfully into editor');
      
    } catch (err) {
      console.error('❌ Error loading content into editor:', err);
      setError('Failed to load content into editor');
    }
  };

  const normalizeContent = (content) => {
    if (!content) return '';
    
    // Split content into lines
    const lines = content.split('\n');
    const normalizedLines = [];
    let consecutiveEmptyLines = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        consecutiveEmptyLines++;
        // Only allow maximum 2 consecutive empty lines (for paragraph spacing)
        if (consecutiveEmptyLines <= 2) {
          normalizedLines.push('');
        }
      } else {
        consecutiveEmptyLines = 0;
        normalizedLines.push(line);
      }
    }
    
    // Remove excessive trailing newlines (keep max 1)
    while (normalizedLines.length > 1 && normalizedLines[normalizedLines.length - 1].trim() === '') {
      normalizedLines.pop();
    }
    
    return normalizedLines.join('\n');
  };

  const loadAsPlainText = (content, root) => {
    // Split content into lines and create paragraphs
    const lines = content.split('\n');
    
    // Filter out excessive empty lines and normalize content
    const processedLines = [];
    let consecutiveEmptyLines = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        consecutiveEmptyLines++;
        // Only allow one consecutive empty line to preserve paragraph breaks
        if (consecutiveEmptyLines === 1) {
          processedLines.push('');
        }
      } else {
        consecutiveEmptyLines = 0;
        processedLines.push(line);
      }
    }
    
    // Remove trailing empty lines
    while (processedLines.length > 0 && processedLines[processedLines.length - 1].trim() === '') {
      processedLines.pop();
    }
    
    // Create paragraphs for non-empty lines and single empty lines for spacing
    if (processedLines.length === 0) {
      // Create a single empty paragraph for completely empty content
      const paragraph = $createParagraphNode();
      root.append(paragraph);
    } else {
      processedLines.forEach((line, index) => {
        const paragraph = $createParagraphNode();
        if (line.trim()) {
          const textNode = $createTextNode(line);
          paragraph.append(textNode);
        }
        // Always append the paragraph, even if empty, to maintain structure
        root.append(paragraph);
      });
    }
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
      
      // Normalize content to prevent newline accumulation
      markdownContent = normalizeContent(markdownContent);
      
      // Only save if content has actually changed
      if (markdownContent === lastContent) {
        console.log('No changes detected, skipping save');
        setIsSaving(false);
        return true;
      }
      
      console.log('💾 Saving document content via PUT endpoint...');
      console.log('Document ID:', documentId);
      console.log('Content length:', markdownContent.length);
      console.log('Number of newlines before save:', (markdownContent.match(/\n/g) || []).length);
      console.log('Previous content length:', lastContent.length);
      console.log('Previous newlines count:', (lastContent.match(/\n/g) || []).length);
      
      // Save document content to backend using PUT endpoint
      const response = await documentAPI.updateDocumentContent(documentId, markdownContent);
      
      setLastSaved(new Date());
      setLastContent(markdownContent);
      
      // Check if title still has unsaved changes
      const titleChanged = documentTitle !== lastTitle;
      setHasUnsavedChanges(titleChanged);
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
    
    // Normalize content to prevent newline accumulation
    markdownContent = normalizeContent(markdownContent);

    if (markdownContent === lastContent) return;

    // Use sendBeacon for reliable save on page unload
    const data = JSON.stringify({ content: markdownContent });
    const blob = new Blob([data], { type: 'application/json' });
    navigator.sendBeacon(`https://aiberkeley-hack.onrender.com/api/documents/${documentId}`, blob);
  };

  const onChange = (editorState, editor) => {
    // Store editor reference globally for loading content  
    window.lexicalEditor = editor;
    editorRef.current = editor;
    
    // Check if content has changed
    let currentContent = '';
    editorState.read(() => {
      currentContent = $convertToMarkdownString(TRANSFORMERS);
    });
    
    const contentChanged = currentContent !== lastContent;
    const titleChanged = documentTitle !== lastTitle;
    const hasChanges = contentChanged || titleChanged;
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
    
    // Auto-save document after changes (debounced) - only save content changes here
    if (documentId && contentChanged) {
      clearTimeout(window.autoSaveTimeout);
      window.autoSaveTimeout = setTimeout(() => {
        console.log('⏰ Auto-save content triggered after 3 seconds of inactivity');
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
    
    // Check if title actually changed from the original
    const titleChanged = newTitle !== lastTitle;
    
    // Update unsaved changes status
    const contentChanged = window.lexicalEditor ? (() => {
      let currentContent = '';
      window.lexicalEditor.getEditorState().read(() => {
        currentContent = $convertToMarkdownString(TRANSFORMERS);
      });
      return currentContent !== lastContent;
    })() : false;
    
    setHasUnsavedChanges(titleChanged || contentChanged);
    
    // Auto-save title changes immediately after typing stops
    if (titleChanged && documentId) {
      clearTimeout(window.titleSaveTimeout);
      window.titleSaveTimeout = setTimeout(async () => {
        console.log('💾 Auto-saving title...');
        try {
          await documentAPI.updateDocumentTitle(documentId, newTitle);
          setLastTitle(newTitle); // Update the tracked title
          setLastSaved(new Date());
          console.log('✅ Title saved successfully');
          
          // Re-check unsaved changes after title save
          const stillContentChanged = window.lexicalEditor ? (() => {
            let currentContent = '';
            window.lexicalEditor.getEditorState().read(() => {
              currentContent = $convertToMarkdownString(TRANSFORMERS);
            });
            return currentContent !== lastContent;
          })() : false;
          
          setHasUnsavedChanges(stillContentChanged);
          
        } catch (error) {
          console.error('❌ Failed to save title:', error);
          setError(`Failed to save title: ${error.message}`);
        }
      }, 1000); // Save after 1 second of no typing
    }
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

  // Function to handle when editor becomes available
  const onEditorMount = (editor) => {
    console.log('🚀 Editor mounted and available!');
    window.lexicalEditor = editor;
    editorRef.current = editor;
    
    // If we have pending content, load it immediately
    if (pendingContent !== null) {
      console.log('🔄 Loading pending content on editor mount...');
      loadContentIntoEditor(pendingContent);
      setPendingContent(null);
    }
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="editor-title-section">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="home-button"
            title="Back to Dashboard"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </button>
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
            {lastSaved && !isSaving && (
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

          </div>
          <div className="editor-actions">
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
        <EditorRefPlugin onEditorReady={onEditorMount} />
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
        <CommandKWidget
          isOpen={isCommandKOpen}
          onClose={() => setIsCommandKOpen(false)}
          documentId={documentId}
          selectedText={selectedText}
          position={commandKPosition}
        />
      </div>
  );
}

// Custom plugin to capture editor reference immediately
function EditorRefPlugin({ onEditorReady }) {
  const [editor] = useLexicalComposerContext();
  
  React.useEffect(() => {
    if (editor && onEditorReady) {
      // Small delay to ensure editor is fully initialized
      setTimeout(() => {
        onEditorReady(editor);
      }, 0);
    }
  }, [editor, onEditorReady]);
  
  return null;
}

export default Editor; 