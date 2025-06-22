import React from 'react';
import { $getRoot, $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND, FORMAT_ELEMENT_COMMAND } from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $convertToMarkdownString, $convertFromMarkdownString } from '@lexical/markdown';
import { TRANSFORMERS } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
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

// Toolbar Component
function Toolbar() {
  // This section initializes state variables for the text editor toolbar
  // useLexicalComposerContext() provides access to the Lexical editor instance
  const [editor] = useLexicalComposerContext();
  // React.useState() creates state variables with their setter functions:
  // - isBold: tracks if selected text is bold (initial: false)
  // - isItalic: tracks if selected text is italic (initial: false) 
  // - isUnderline: tracks if selected text is underlined (initial: false)
  // - alignment: tracks text alignment (initial: 'left')
  // Each useState returns [currentValue, setterFunction] for state management
  const [isBold, setIsBold] = React.useState(false);
  const [isItalic, setIsItalic] = React.useState(false);
  const [isUnderline, setIsUnderline] = React.useState(false);
  const [highlight, setHighlight] = React.useState(false);
  const [alignment, setAlignment] = React.useState('left');
  
  const updateToolbar = React.useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      // Get the current element to check alignment
      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();
      const elementFormat = element.getFormatType();
      setAlignment(elementFormat || 'left');
    }
  }, []);

  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatText = (format) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatAlignment = (alignType) => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignType);
  };

  const insertHeading = (headingLevel) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingLevel));
      }
    });
  };

  const insertList = (listType) => {
    if (listType === 'ul') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
    }
  };

  const insertQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  return (
    <div className="editor-toolbar">
      <button
        className="toolbar-button"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND)}
        aria-label="Undo"
      >
        ↶
      </button>
      <button
        className="toolbar-button"
        onClick={() => editor.dispatchCommand(REDO_COMMAND)}
        aria-label="Redo"
      >
        ↷
      </button>
      <div className="toolbar-divider" />
      <button
        className={`toolbar-button ${isBold ? 'active' : ''}`}
        onClick={() => formatText('bold')}
        aria-label="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        className={`toolbar-button ${isItalic ? 'active' : ''}`}
        onClick={() => formatText('italic')}
        aria-label="Italic"
      >
        <em>I</em>
      </button>
      <button
        className={`toolbar-button ${isUnderline ? 'active' : ''}`}
        onClick={() => formatText('underline')}
        aria-label="Underline"
      >
        <u>U</u>
      </button>
      <div className="toolbar-divider" />
      {/* Text Alignment Buttons */}
      <button
        className={`toolbar-button ${alignment === 'left' ? 'active' : ''}`}
        onClick={() => formatAlignment('left')}
        aria-label="Align Left"
        title="Align Left"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 3h12v1H2V3zm0 3h8v1H2V6zm0 3h12v1H2V9zm0 3h8v1H2v-1z"/>
        </svg>
      </button>
      <button
        className={`toolbar-button ${alignment === 'center' ? 'active' : ''}`}
        onClick={() => formatAlignment('center')}
        aria-label="Align Center"
        title="Align Center"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 3h12v1H2V3zm2 3h8v1H4V6zm-2 3h12v1H2V9zm2 3h8v1H4v-1z"/>
        </svg>
      </button>
      <button
        className={`toolbar-button ${alignment === 'right' ? 'active' : ''}`}
        onClick={() => formatAlignment('right')}
        aria-label="Align Right"
        title="Align Right"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 3h12v1H2V3zm4 3h8v1H6V6zm-4 3h12v1H2V9zm4 3h8v1H6v-1z"/>
        </svg>
      </button>
      <button
        className={`toolbar-button ${alignment === 'justify' ? 'active' : ''}`}
        onClick={() => formatAlignment('justify')}
        aria-label="Justify"
        title="Justify"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 3h12v1H2V3zm0 3h12v1H2V6zm0 3h12v1H2V9zm0 3h12v1H2v-1z"/>
        </svg>
      </button>
      <div className="toolbar-divider" />
      <button
        className="toolbar-button"
        onClick={() => insertHeading('h1')}
        aria-label="Heading 1"
      >
        H1
      </button>
      <button
        className="toolbar-button"
        onClick={() => insertHeading('h2')}
        aria-label="Heading 2"
      >
        H2
      </button>
      <button
        className="toolbar-button"
        onClick={() => insertHeading('h3')}
        aria-label="Heading 3"
      >
        H3
      </button>
      <div className="toolbar-divider" />
      <button
        className="toolbar-button"
        onClick={() => insertList('ul')}
        aria-label="Bullet List"
      >
        • List
      </button>
      <button
        className="toolbar-button"
        onClick={() => insertList('ol')}
        aria-label="Numbered List"
      >
        1. List
      </button>
              <button
          className="toolbar-button"
          onClick={() => insertQuote()}
          aria-label="Quote"
        >
          " Quote
        </button>
      </div>
    );
  }

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