import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { 
  $getSelection, 
  $isRangeSelection, 
  createCommand,
  COMMAND_PRIORITY_EDITOR 
} from 'lexical';
import { $createImageNode } from './ImageNode';

// Define commands
export const INSERT_IMAGE_COMMAND = createCommand('INSERT_IMAGE_COMMAND');

// Main ImagePlugin component
export function ImagePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Register INSERT_IMAGE_COMMAND
    const unregisterInsertImage = editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        console.log('🖼️ INSERT_IMAGE_COMMAND handler called with payload:', payload);
        const { src, altText, width, height } = payload;
        
        editor.update(() => {
          const selection = $getSelection();
          console.log('🖼️ Current selection:', selection);
          
          if ($isRangeSelection(selection)) {
            const imageNode = $createImageNode({
              src,
              altText: altText || 'Image',
              width,
              height,
              prompt: '', // No prompt for manually inserted images
            });
            
            console.log('🖼️ Created ImageNode:', imageNode);
            selection.insertNodes([imageNode]);
            console.log('🖼️ ImageNode inserted into selection');
          } else {
            console.log('🖼️ No valid range selection available');
          }
        });
        
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    // Cleanup function
    return () => {
      unregisterInsertImage();
    };
  }, [editor]);

  return null; // This plugin doesn't render anything
}

// Helper functions for external use
export const insertImage = (editor, imageData) => {
  console.log('🖼️ insertImage called with data:', imageData);
  editor.dispatchCommand(INSERT_IMAGE_COMMAND, imageData);
  console.log('🖼️ INSERT_IMAGE_COMMAND dispatched');
};

// Utility function to check if URL is a valid image URL
const isValidImageUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const extension = urlObj.pathname.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
    return imageExtensions.some(ext => extension.endsWith(ext));
  } catch {
    return false;
  }
};

// Utility function to validate image URL by attempting to load it
const validateImageUrl = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

// Toolbar button component for inserting images from URLs
export function ImageInsertButton({ editor, disabled = false }) {
  const handleClick = async () => {
    const url = window.prompt('Enter the image URL:');
    
    if (url && url.trim()) {
      const imageUrl = url.trim();
      
      // Basic URL validation
      try {
        new URL(imageUrl);
      } catch {
        alert('Please enter a valid URL');
        return;
      }
      
      // Check if it looks like an image URL
      if (!isValidImageUrl(imageUrl)) {
        const confirmed = window.confirm(
          'This URL doesn\'t appear to be an image file. Do you want to try inserting it anyway?'
        );
        if (!confirmed) return;
      }
      
      // Show loading state (optional - could add a loading indicator)
      const altText = window.prompt('Enter image description (optional):') || 'Image';
      
      // Validate that the image can actually be loaded
      const isValid = await validateImageUrl(imageUrl);
      if (!isValid) {
        alert('Unable to load image from this URL. Please check the URL and try again.');
        return;
      }
      
      // Insert the image
      console.log('🖼️ Inserting image with URL:', imageUrl);
      console.log('🖼️ Alt text:', altText);
      insertImage(editor, {
        src: imageUrl,
        altText: altText,
        width: 'auto',
        height: 'auto'
      });
      console.log('🖼️ Image insertion completed');
    }
  };

  return (
    <button
      type="button"
      className="toolbar-button"
      onClick={handleClick}
      disabled={disabled}
      title="Insert Image from URL"
      aria-label="Insert Image from URL"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor"/>
        <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <line x1="3" y1="17" x2="21" y2="17" stroke="currentColor" strokeWidth="3"/>
      </svg>
    </button>
  );
}

export default ImagePlugin; 