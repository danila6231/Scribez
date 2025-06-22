import React from 'react';
import { DecoratorNode } from 'lexical';

export class ImageNode extends DecoratorNode {
  static getType() {
    return 'image';
  }

  static clone(node) {
    const cloned = new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__prompt,
      node.__key
    );
    return cloned;
  }

  constructor(src, altText, width, height, prompt, key) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width || 'auto';
    this.__height = height || 'auto';
    this.__prompt = prompt || '';
  }

  exportJSON() {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      prompt: this.__prompt,
    };
  }

  static importJSON(serializedNode) {
    const { src, altText, width, height, prompt } = serializedNode;
    const node = new ImageNode(src, altText, width, height, prompt);
    return node;
  }

  exportDOM() {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    element.setAttribute('data-prompt', this.__prompt);
    if (this.__width !== 'auto') {
      element.style.width = typeof this.__width === 'number' ? `${this.__width}px` : this.__width;
    }
    if (this.__height !== 'auto') {
      element.style.height = typeof this.__height === 'number' ? `${this.__height}px` : this.__height;
    }
    element.style.maxWidth = '100%';
    element.style.height = 'auto';
    return { element };
  }

  static importDOM() {
    return {
      img: (node) => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    };
  }

  createDOM(config) {
    const span = document.createElement('span');
    span.style.display = 'block';
    span.style.position = 'relative';
    span.className = 'editor-image-container';
    return span;
  }

  updateDOM() {
    return false;
  }

  getSrc() {
    return this.__src;
  }

  getAltText() {
    return this.__altText;
  }

  getWidth() {
    return this.__width;
  }

  getHeight() {
    return this.__height;
  }

  getPrompt() {
    return this.__prompt;
  }

  setSrc(src) {
    const writable = this.getWritable();
    writable.__src = src;
  }

  setAltText(altText) {
    const writable = this.getWritable();
    writable.__altText = altText;
  }

  setWidth(width) {
    const writable = this.getWritable();
    writable.__width = width;
  }

  setHeight(height) {
    const writable = this.getWritable();
    writable.__height = height;
  }

  setPrompt(prompt) {
    const writable = this.getWritable();
    writable.__prompt = prompt;
  }

  decorate() {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        prompt={this.__prompt}
        nodeKey={this.getKey()}
      />
    );
  }

  isInline() {
    return false; // Make it a block element
  }

  isKeyboardSelectable() {
    return true;
  }
}

// React component for rendering the image
function ImageComponent({ src, altText, width, height, prompt, nodeKey }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [showPrompt, setShowPrompt] = React.useState(false);
  const imageRef = React.useRef(null);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Check if image is already loaded (cached) when component mounts
  React.useEffect(() => {
    if (imageRef.current && imageRef.current.complete && imageRef.current.naturalWidth > 0) {
      setIsLoading(false);
    }
  }, [src]);

  // Reset states when src changes
  React.useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const imageStyle = {
    maxWidth: '100%',
    height: 'auto',
    display: 'block',
    margin: '15px auto',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  };

  const containerStyle = {
    position: 'relative',
    display: 'block',
    margin: '15px 0',
    textAlign: 'center',
  };

  const promptStyle = {
    position: 'absolute',
    bottom: '8px',
    left: '8px',
    right: '8px',
    background: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    opacity: showPrompt ? 1 : 0,
    transition: 'opacity 0.3s ease',
    pointerEvents: 'none',
    backdropFilter: 'blur(4px)',
  };

  const loadingStyle = {
    width: '400px',
    height: '300px',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    margin: '15px auto',
    border: '2px dashed #ddd',
    flexDirection: 'column',
    gap: '10px',
  };

  const errorStyle = {
    ...loadingStyle,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    color: '#dc2626',
  };

  if (hasError) {
    return (
      <div style={errorStyle}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <span>Failed to load image</span>
        {prompt && <small style={{ opacity: 0.7 }}>Prompt: {prompt}</small>}
      </div>
    );
  }

  return (
    <div 
      style={containerStyle}
      onMouseEnter={() => setShowPrompt(true)}
      onMouseLeave={() => setShowPrompt(false)}
    >
      {isLoading && (
        <div style={loadingStyle}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}></div>
          <span style={{ color: '#666' }}>Generating image...</span>
          {prompt && (
            <small style={{ 
              color: '#888', 
              maxWidth: '300px', 
              textAlign: 'center',
              wordWrap: 'break-word' 
            }}>
              "{prompt}"
            </small>
          )}
        </div>
      )}
      <img
        ref={imageRef}
        src={src}
        alt={altText}
        style={{
          ...imageStyle,
          display: isLoading ? 'none' : 'block',
          width: width !== 'auto' ? width : undefined,
          height: height !== 'auto' ? height : undefined,
        }}
        onLoad={handleLoad}
        onError={handleError}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.02)';
          e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }}
      />
      {prompt && !isLoading && !hasError && (
        <div style={promptStyle}>
          <strong>AI Prompt:</strong> {prompt}
        </div>
      )}
      
      {/* Add CSS animation for loading spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Helper function to create ImageNode
export function $createImageNode({
  src,
  altText = '',
  width = 'auto',
  height = 'auto',
  prompt = '',
}) {
  return new ImageNode(src, altText, width, height, prompt);
}

// Helper function to check if node is ImageNode
export function $isImageNode(node) {
  return node instanceof ImageNode;
}

// Conversion function for importing from DOM
function convertImageElement(domNode) {
  const src = domNode.getAttribute('src');
  const altText = domNode.getAttribute('alt') || '';
  const prompt = domNode.getAttribute('data-prompt') || '';
  
  if (src) {
    const node = $createImageNode({
      src,
      altText,
      prompt,
    });
    return { node };
  }
  
  return null;
}

// Custom Markdown Transformer for Images
export const IMAGE_TRANSFORMER = {
  dependencies: [ImageNode],
  export: (node) => {
    console.log('🖼️ IMAGE_TRANSFORMER export called with node type:', node.getType());
    
    if (!$isImageNode(node)) {
      console.log('🖼️ IMAGE_TRANSFORMER export - not an ImageNode, skipping');
      return null;
    }
    
    const altText = node.__altText || '';
    const src = node.__src;
    
    console.log('🖼️ IMAGE_TRANSFORMER export - src:', src, 'altText:', altText);
    
    if (!src) {
      console.log('🖼️ IMAGE_TRANSFORMER export - no src found, skipping');
      return null;
    }
    
    // Convert to markdown image syntax: ![alt text](url)
    const result = `![${altText}](${src})`;
    console.log('🖼️ IMAGE_TRANSFORMER export result:', result);
    return result;
  },
  importRegExp: /^!\[([^\]]*)\]\(([^)]+)\)$/,
  regExp: /!\[([^\]]*)\]\(([^)]+)\)/g,
  replace: (textNode, match) => {
    const [, altText, src] = match;
    console.log('🖼️ IMAGE_TRANSFORMER replace called with:', { altText, src });
    
    if (!src || !src.trim()) {
      console.log('🖼️ IMAGE_TRANSFORMER replace - invalid src, skipping');
      return;
    }
    
    const imageNode = new ImageNode(src.trim(), altText || '', 'auto', 'auto', '');
    console.log('🖼️ IMAGE_TRANSFORMER created node with src:', imageNode.__src);
    textNode.replace(imageNode);
  },
  trigger: ')',
  type: 'element',
}; 