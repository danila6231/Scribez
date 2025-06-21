import React from 'react';
import { $getRoot, $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND, FORMAT_ELEMENT_COMMAND } from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
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
function Editor() {
  const onChange = (editorState, editor) => {
    // Handle editor changes here if needed
    // For now, we'll just log to console in development
    if (process.env.NODE_ENV === 'development') {
      editorState.read(() => {
        const root = $getRoot();
        console.log('Editor state:', root.getTextContent());
      });
    }
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h2>Document Editor</h2>
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