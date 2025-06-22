import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { TextNode } from 'lexical';
import { ImageNode } from './ImageNode';

// Custom Highlight Node
export class HighlightNode extends TextNode {
  static getType() {
    return 'highlight';
  }

  static clone(node) {
    return new HighlightNode(node.__text, node.__key);
  }

  static importJSON(serializedNode) {
    const { text } = serializedNode;
    const node = new HighlightNode(text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: 'highlight',
      version: 1,
    };
  }

  createDOM(config) {
    const element = super.createDOM(config);
    element.classList.add('editor-text-highlight');
    return element;
  }

  updateDOM(prevNode, dom) {
    return false;
  }

  static importDOM() {
    return {
      mark: (node) => ({
        conversion: convertHighlightElement,
        priority: 1,
      }),
      span: (node) => {
        if (node.classList && node.classList.contains('editor-text-highlight')) {
          return {
            conversion: convertHighlightElement,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  exportDOM() {
    const element = document.createElement('mark');
    element.textContent = this.getTextContent();
    return { element };
  }
}

function convertHighlightElement(domNode) {
  const textContent = domNode.textContent || '';
  if (textContent !== '') {
    const node = new HighlightNode(textContent);
    return {
      node,
    };
  }
  return null;
}

// Helper function to create highlight node
export function $createHighlightNode(text) {
  return new HighlightNode(text);
}

export function $isHighlightNode(node) {
  return node instanceof HighlightNode;
}

// Theme configuration for Lexical
export const theme = {
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem',
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem',
  },
  image: 'editor-image',
  link: 'editor-link',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    overflowed: 'editor-text-overflowed',
    hashtag: 'editor-text-hashtag',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
    underlineStrikethrough: 'editor-text-underlineStrikethrough',
    highlight: 'editor-text-highlight',
    code: 'editor-text-code',
  },
  // Text alignment formatting
  ltr: 'ltr',
  rtl: 'rtl',
  center: 'center',
  justify: 'justify',
  code: 'editor-code',
  codeHighlight: {
    atrule: 'editor-tokenAtRule',
    attr: 'editor-tokenAttr',
    boolean: 'editor-tokenBoolean',
    builtin: 'editor-tokenBuiltin',
    cdata: 'editor-tokenCdata',
    char: 'editor-tokenChar',
    class: 'editor-tokenClass',
    'class-name': 'editor-tokenClassName',
    comment: 'editor-tokenComment',
    constant: 'editor-tokenConstant',
    deleted: 'editor-tokenDeleted',
    doctype: 'editor-tokenDoctype',
    entity: 'editor-tokenEntity',
    function: 'editor-tokenFunction',
    important: 'editor-tokenImportant',
    inserted: 'editor-tokenInserted',
    keyword: 'editor-tokenKeyword',
    namespace: 'editor-tokenNamespace',
    number: 'editor-tokenNumber',
    operator: 'editor-tokenOperator',
    prolog: 'editor-tokenProlog',
    property: 'editor-tokenProperty',
    punctuation: 'editor-tokenPunctuation',
    regex: 'editor-tokenRegex',
    selector: 'editor-tokenSelector',
    string: 'editor-tokenString',
    symbol: 'editor-tokenSymbol',
    tag: 'editor-tokenTag',
    url: 'editor-tokenUrl',
    variable: 'editor-tokenVariable',
  },
};

// Editor configuration
export const editorConfig = {
  namespace: 'WritingTool',
  theme,
  onError(error) {
    throw error;
  },
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    AutoLinkNode,
    LinkNode,
    HighlightNode,
    ImageNode,
  ],
};

// Initial editor state
export const initialEditorState = () => {
  return null; // Let Lexical create the default empty state
}; 