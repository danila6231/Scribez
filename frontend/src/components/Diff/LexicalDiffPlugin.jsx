import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import { $createHeadingNode } from '@lexical/rich-text';
import { useEffect } from 'react';
import DiffView from './DiffView';
import { mergeRegister } from '@lexical/utils';
import { API_URL } from '../../config/api';

// Custom Lexical node for diff display
export function DiffPlugin({ originalText, newText, changes }) {
  const [editor] = useLexicalComposerContext();

  const insertDiffIntoEditor = () => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();

      // Add heading
      const heading = $createHeadingNode('h2');
      heading.append($createTextNode('Document Diff View'));
      root.append(heading);

      // Add description
      const description = $createParagraphNode();
      description.append($createTextNode('The following shows changes between versions:'));
      root.append(description);

      // For each change, create appropriate nodes
      let lastPos = 0;
      
      changes.forEach((change) => {
        // Add any unchanged text before this change
        if (change.start_pos > lastPos) {
          const unchangedText = originalText.substring(lastPos, change.start_pos);
          const paragraph = $createParagraphNode();
          const textNode = $createTextNode(unchangedText);
          paragraph.append(textNode);
          root.append(paragraph);
        }

        if (change.type === 'delete') {
          // Create deleted text with formatting
          const paragraph = $createParagraphNode();
          const textNode = $createTextNode(change.old_text);
          textNode.setFormat('strikethrough');
          textNode.setStyle('color: #0066cc; text-decoration-color: #0066cc;');
          paragraph.append(textNode);
          root.append(paragraph);
          lastPos = change.end_pos;
        } else if (change.type === 'insert') {
          // Create inserted text with formatting
          const paragraph = $createParagraphNode();
          const textNode = $createTextNode(change.new_text);
          textNode.setStyle('color: #008000; border-top: 2px solid #008000; border-bottom: 2px solid #008000; padding: 2px 0;');
          paragraph.append(textNode);
          root.append(paragraph);
        }
      });

      // Add any remaining unchanged text
      if (lastPos < originalText.length) {
        const remainingText = originalText.substring(lastPos);
        const paragraph = $createParagraphNode();
        const textNode = $createTextNode(remainingText);
        paragraph.append(textNode);
        root.append(paragraph);
      }
    });
  };

  return null;
}

// Hook to compute and display diff in Lexical
export function useLexicalDiff(originalText, newText) {
  const [editor] = useLexicalComposerContext();

  const computeAndDisplayDiff = async () => {
    try {
      const response = await fetch(`${API_URL}/diff/compute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          old_content: originalText,
          new_content: newText,
          granularity: 'word'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.changes;
    } catch (err) {
      console.error('Failed to compute diff:', err);
      return [];
    }
  };

  return { computeAndDisplayDiff };
} 