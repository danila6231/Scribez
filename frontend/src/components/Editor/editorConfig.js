import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { TextNode, DecoratorNode } from 'lexical';
import mermaid from 'mermaid';
import React from 'react';

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

// Custom Mermaid Node
export class MermaidNode extends DecoratorNode {
  __code;

  static getType() {
    return 'mermaid';
  }

  static clone(node) {
    return new MermaidNode(node.__code, node.__key);
  }

  constructor(code, key) {
    super(key);
    this.__code = code;
  }

  createDOM() {
    const div = document.createElement('div');
    div.className = 'mermaid-wrapper';
    return div;
  }

  updateDOM() {
    return false;
  }

  setCode(code) {
    const writable = this.getWritable();
    writable.__code = code;
  }

  getCode() {
    return this.__code;
  }

  decorate() {
    return React.createElement(MermaidComponent, {
      code: this.__code,
      nodeKey: this.getKey(),
    });
  }

  static importJSON(serializedNode) {
    const { code } = serializedNode;
    const node = new MermaidNode(code);
    return node;
  }

  exportJSON() {
    return {
      code: this.getCode(),
      type: 'mermaid',
      version: 1,
    };
  }
}

// React component for rendering Mermaid diagrams
function MermaidComponent({ code, nodeKey }) {
  const [svg, setSvg] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const renderDiagram = async () => {
      try {
        const id = `mermaid-${nodeKey}`;
        const { svg } = await mermaid.render(id, code);
        setSvg(svg);
        setError('');
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('Failed to render diagram');
        setSvg('');
      }
    };

    if (code) {
      renderDiagram();
    }
  }, [code, nodeKey]);

  if (error) {
    return React.createElement('div', {
      className: 'mermaid-error',
      style: {
        padding: '10px',
        backgroundColor: '#ffebee',
        border: '1px solid #f44336',
        borderRadius: '4px',
        color: '#d32f2f',
      }
    }, `Error: ${error}`);
  }

  if (!svg) {
    return React.createElement('div', {
      className: 'mermaid-loading',
      style: {
        padding: '10px',
        textAlign: 'center',
        color: '#666',
      }
    }, 'Rendering diagram...');
  }

  return React.createElement('div', {
    className: 'mermaid-diagram',
    style: {
      padding: '10px',
      textAlign: 'center',
      backgroundColor: '#f9f9f9',
      border: '1px solid #ddd',
      borderRadius: '4px',
      margin: '10px 0',
    },
    dangerouslySetInnerHTML: { __html: svg }
  });
}

// Helper function to create mermaid node
export function $createMermaidNode(code) {
  return new MermaidNode(code);
}

export function $isMermaidNode(node) {
  return node instanceof MermaidNode;
}

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
    MermaidNode,
  ],
};

// Initial editor state
export const initialEditorState = () => {
  return null; // Let Lexical create the default empty state
}; 