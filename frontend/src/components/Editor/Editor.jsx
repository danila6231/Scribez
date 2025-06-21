import React from 'react';
import { $getRoot, $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND } from 'lexical';
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
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = React.useState(false);
  const [isItalic, setIsItalic] = React.useState(false);
  const [isUnderline, setIsUnderline] = React.useState(false);

  const updateToolbar = React.useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
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
        B
      </button>
      <button
        className={`toolbar-button ${isItalic ? 'active' : ''}`}
        onClick={() => formatText('italic')}
        aria-label="Italic"
      >
        <i>I</i>
      </button>
      <button
        className={`toolbar-button ${isUnderline ? 'active' : ''}`}
        onClick={() => formatText('underline')}
        aria-label="Underline"
      >
        <u>U</u>
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