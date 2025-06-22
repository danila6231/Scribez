import { $isImageNode, ImageNode } from './ImageNode';

/**
 * Enhanced Markdown Transformer for ImageNode
 * Handles both import (markdown -> ImageNode) and export (ImageNode -> markdown)
 */
export const IMAGE_TRANSFORMER = {
  dependencies: [ImageNode],
  
  /**
   * Export ImageNode to Markdown syntax
   * @param {LexicalNode} node - The node to export
   * @returns {string|null} - Markdown string or null if not an ImageNode
   */
  export: (node) => {
    // Only process ImageNode instances
    if (!$isImageNode(node)) {
      return null;
    }
    
    // Extract properties directly from the node
    const src = node.__src;
    const altText = node.__altText || '';
    
    // Skip if no source URL
    if (!src) {
      console.warn('ImageNode missing src property, skipping export');
      return null;
    }
    
    // Convert to standard Markdown image syntax: ![alt text](url)
    return `![${altText}](${src})`;
  },
  
  /**
   * Import Markdown image syntax to ImageNode
   * Regular expression to match: ![alt text](url)
   */
  importRegExp: /^!\[([^\]]*)\]\(([^)]+)\)$/,
  regExp: /!\[([^\]]*)\]\(([^)]+)\)/g,
  
  /**
   * Replace matched text with ImageNode
   * @param {TextNode} textNode - The text node containing the match
   * @param {Array} match - Regex match array [fullMatch, altText, src]
   */
  replace: (textNode, match) => {
    const [, altText, src] = match;
    
    // Validate the extracted data
    if (!src || !src.trim()) {
      console.warn('Invalid image URL in markdown, skipping');
      return;
    }
    
    // Create new ImageNode with extracted data
    const imageNode = new ImageNode(
      src.trim(),           // src
      altText || '',        // altText
      'auto',              // width
      'auto',              // height
      ''                   // prompt (empty for markdown imports)
    );
    
    // Replace the text node with the image node
    textNode.replace(imageNode);
  },
  
  trigger: ')',
  type: 'element',
};

/**
 * Alternative transformer for more complex scenarios
 * Includes additional validation and error handling
 */
export const ENHANCED_IMAGE_TRANSFORMER = {
  dependencies: [ImageNode],
  
  export: (node) => {
    if (!$isImageNode(node)) {
      return null;
    }
    
    const src = node.__src;
    const altText = node.__altText || '';
    const width = node.__width;
    const height = node.__height;
    
    if (!src) {
      return null;
    }
    
    // Basic markdown format
    let markdown = `![${altText}](${src})`;
    
    // Add HTML attributes for width/height if specified and not 'auto'
    if ((width && width !== 'auto') || (height && height !== 'auto')) {
      const attributes = [];
      if (width && width !== 'auto') attributes.push(`width="${width}"`);
      if (height && height !== 'auto') attributes.push(`height="${height}"`);
      
      // Use HTML img tag for images with specific dimensions
      markdown = `<img src="${src}" alt="${altText}" ${attributes.join(' ')} />`;
    }
    
    return markdown;
  },
  
  importRegExp: /^!\[([^\]]*)\]\(([^)]+)\)$|^<img\s+[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>$/,
  regExp: /!\[([^\]]*)\]\(([^)]+)\)|<img\s+[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/g,
  
  replace: (textNode, match) => {
    let src, altText;
    
    // Handle standard markdown format ![alt](src)
    if (match[1] !== undefined && match[2] !== undefined) {
      altText = match[1];
      src = match[2];
    }
    // Handle HTML img tag format <img src="..." alt="..." />
    else if (match[3] !== undefined && match[4] !== undefined) {
      src = match[3];
      altText = match[4];
    }
    
    if (!src) return;
    
    const imageNode = new ImageNode(src.trim(), altText || '', 'auto', 'auto', '');
    textNode.replace(imageNode);
  },
  
  trigger: ')',
  type: 'element',
}; 