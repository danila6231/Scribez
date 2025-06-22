import React from 'react';
import { useParams } from 'react-router-dom';
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND, FORMAT_ELEMENT_COMMAND, $createParagraphNode, $createTextNode } from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, $isListNode, $isListItemNode } from '@lexical/list';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $createCodeNode } from '@lexical/code';
import { $createLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import linkIcon from '../../assets/icons/icons8-link-50.png';
import quoteIcon from '../../assets/icons/quote.png';
import italicIcon from '../../assets/icons/italic.png';

function Toolbar() {
  // This section initializes state variables for the text editor toolbar
  // useLexicalComposerContext() provides access to the Lexical editor instance
  const [editor] = useLexicalComposerContext();
  const { documentId } = useParams(); // Get current document ID for printing
  // React.useState() creates state variables with their setter functions:
  // - isBold: tracks if selected text is bold (initial: false)
  // - isItalic: tracks if selected text is italic (initial: false) 
  // - isUnderline: tracks if selected text is underlined (initial: false)
  // - alignment: tracks text alignment (initial: 'left')
  // Each useState returns [currentValue, setterFunction] for state management
  const [isBold, setIsBold] = React.useState(false);
  const [isItalic, setIsItalic] = React.useState(false);
  const [isUnderline, setIsUnderline] = React.useState(false);
  const [isStrikethrough, setIsStrikethrough] = React.useState(false);
  const [isCode, setIsCode] = React.useState(false);
  const [highlight, setHighlight] = React.useState(false);
  const [alignment, setAlignment] = React.useState('left');
  const [blockType, setBlockType] = React.useState('paragraph');
  const [listType, setListType] = React.useState(null); // 'ul', 'ol', or null
  
  const updateToolbar = React.useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));
      
      // Get the current element to check alignment and block type
      const anchorNode = selection.anchor.getNode();
      let element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();
      const elementFormat = element.getFormatType();
      setAlignment(elementFormat || 'left');
      
      // Initialize with defaults
      let newBlockType = 'paragraph';
      let newListType = null;
      
      // Check if we're inside a list by looking at ancestors
      let node = anchorNode;
      let listItemNode = null;
      let listNode = null;
      
      // Traverse up to find list item and list nodes
      while (node && !listNode) {
        if ($isListItemNode(node)) {
          listItemNode = node;
        } else if ($isListNode(node)) {
          listNode = node;
        }
        node = node.getParent();
      }
      
      // If we found a list item, look for its parent list
      if (listItemNode && !listNode) {
        let parent = listItemNode.getParent();
        while (parent && !listNode) {
          if ($isListNode(parent)) {
            listNode = parent;
          }
          parent = parent.getParent();
        }
      }
      
      // Determine block type
      const elementType = element.getType();
      
      if (listNode) {
        newBlockType = 'list';
        newListType = listNode.getListType();
      } else if (elementType === 'heading') {
        const headingTag = element.getTag();
        newBlockType = headingTag;
      } else if (elementType === 'quote') {
        newBlockType = 'quote';
      } else if (elementType === 'code') {
        newBlockType = 'code';
      }
      
      // Update states
      setBlockType(newBlockType);
      setListType(newListType);
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

  const insertCodeBlock = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createCodeNode());
      }
    });
  };

  const insertParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const insertLink = () => {
    const url = prompt('Enter the URL:');
    if (url) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    }
  };

  const insertHorizontalRule = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Insert a horizontal rule by creating a paragraph with "---" 
        // which will be converted to <hr> in markdown
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode('---'));
        selection.insertNodes([paragraph]);
      }
    });
  };

  const openPrintView = () => {
    if (documentId) {
      // Open print view in new tab
      const printUrl = `/print/${documentId}`;
      window.open(printUrl, '_blank');
    } else {
      alert('No document selected for printing');
    }
  };

  return (
    <div className="editor-toolbar">
      <button
        className="toolbar-button"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND)}
        aria-label="Undo"
        title="Undo"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>
          <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>
        </svg>
      </button>
      <button
        className="toolbar-button"
        onClick={() => editor.dispatchCommand(REDO_COMMAND)}
        aria-label="Redo"
        title="Redo"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966a.25.25 0 0 1 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
        </svg>
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
        <img src={italicIcon} alt="Italic" width="16" height="16" />
      </button>
      <button
        className={`toolbar-button ${isUnderline ? 'active' : ''}`}
        onClick={() => formatText('underline')}
        aria-label="Underline"
      >
        <u>U</u>
      </button>
      <button
        className={`toolbar-button ${isStrikethrough ? 'active' : ''}`}
        onClick={() => formatText('strikethrough')}
        aria-label="Strikethrough"
        title="Strikethrough (~~text~~)"
      >
        <s>S</s>
      </button>
      <button
        className={`toolbar-button ${isCode ? 'active' : ''}`}
        onClick={() => formatText('code')}
        aria-label="Inline Code"
        title="Inline Code (`code`)"
      >
        &lt;&gt;
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
        className={`toolbar-button ${blockType === 'h1' ? 'active' : ''}`}
        onClick={() => insertHeading('h1')}
        aria-label="Heading 1"
        title="Heading 1 (# text)"
      >
        H1
      </button>
      <button
        className={`toolbar-button ${blockType === 'h2' ? 'active' : ''}`}
        onClick={() => insertHeading('h2')}
        aria-label="Heading 2"
        title="Heading 2 (## text)"
      >
        H2
      </button>
      <button
        className={`toolbar-button ${blockType === 'h3' ? 'active' : ''}`}
        onClick={() => insertHeading('h3')}
        aria-label="Heading 3"
        title="Heading 3 (### text)"
      >
        H3
      </button>
      <button
        className={`toolbar-button ${blockType === 'paragraph' ? 'active' : ''}`}
        onClick={() => insertParagraph()}
        aria-label="Normal Text"
        title="Paragraph"
      >
        P
      </button>
      <div className="toolbar-divider" />
      <button
        className={`toolbar-button ${blockType === 'list' && listType === 'bullet' ? 'active' : ''}`}
        onClick={() => insertList('ul')}
        aria-label="Bullet List"
        title="Bullet List (- item)"
      >
        • List
      </button>
      <button
        className={`toolbar-button ${blockType === 'list' && listType === 'number' ? 'active' : ''}`}
        onClick={() => insertList('ol')}
        aria-label="Numbered List"
        title="Numbered List (1. item)"
      >
        1. List
      </button>
      <button
        className={`toolbar-button ${blockType === 'quote' ? 'active' : ''}`}
        onClick={() => insertQuote()}
        aria-label="Quote"
        title="Blockquote (> text)"
      >
        <img src={quoteIcon} alt="Quote" width="16" height="16" />
      </button>
      <button
        className={`toolbar-button ${blockType === 'code' ? 'active' : ''}`}
        onClick={() => insertCodeBlock()}
        aria-label="Code Block"
        title="Code Block (```)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M10.478 1.647a.5.5 0 1 0-.956-.294l-4 13a.5.5 0 0 0 .956.294l4-13zM4.854 4.146a.5.5 0 0 1 0 .708L1.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0zm6.292 0a.5.5 0 0 0 0 .708L14.293 8l-3.147 3.146a.5.5 0 0 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0z"/>
        </svg>
      </button>
      <div className="toolbar-divider" />
      <button
        className="toolbar-button"
        onClick={() => insertLink()}
        aria-label="Insert Link"
        title="Insert Link ([text](url))"
      >
        <img src={linkIcon} alt="Link" width="16" height="16" />
      </button>
      <button
        className="toolbar-button"
        onClick={() => insertHorizontalRule()}
        aria-label="Horizontal Rule"
        title="Horizontal Rule (---)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M12 8a.5.5 0 0 1-.5.5H4.5a.5.5 0 0 1 0-1h7a.5.5 0 0 1 .5.5z"/>
        </svg>
      </button>
      <button
        className="toolbar-button"
        onClick={() => openPrintView()}
        aria-label="Print Document"
        title="Print Document"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
          <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"/>
        </svg>
      </button>

      <div className="toolbar-divider" />

      <button 
        className="toolbar-button command-k-button"
        title="AI Assistant (⌘K)"
        onClick={() => {
          // Dispatch custom event to open Command+K modal
          const event = new KeyboardEvent('keydown', {
            key: 'k',
            metaKey: true,
            ctrlKey: true,
            bubbles: true
          });
          document.dispatchEvent(event);
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>⌘K</span>
      </button>
    </div>
  );
}

export default Toolbar; 