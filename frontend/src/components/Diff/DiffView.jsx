import React from 'react';
import './diff.css';

const DiffView = ({ originalText, changes }) => {
  // Function to apply changes to the original text and create a rendered output
  const renderDiffText = () => {
    if (!changes || changes.length === 0) {
      return <span>{originalText}</span>;
    }

    // Create a map to track all positions and their changes
    const positionMap = new Map();
    
    // Track deletions by their position range
    changes.forEach(change => {
      if (change.type === 'delete') {
        for (let pos = change.start_pos; pos < change.end_pos; pos++) {
          positionMap.set(pos, { type: 'delete', change });
        }
      }
    });

    // Build the result with insertions and deletions
    const elements = [];
    let currentPos = 0;
    let elementKey = 0;
    
    // Process character by character
    while (currentPos <= originalText.length) {
      // Check for insertions at this position
      const insertions = changes.filter(
        c => c.type === 'insert' && c.start_pos === currentPos
      );
      
      insertions.forEach(insertion => {
        elements.push(
          <span key={`insert-${elementKey++}`} className="diff-inserted">
            {insertion.new_text}
          </span>
        );
      });
      
      // If we've reached the end, break
      if (currentPos >= originalText.length) break;
      
      // Check if current position is part of a deletion
      const deletion = positionMap.get(currentPos);
      
      if (deletion) {
        // Find the full deletion range
        let deleteEnd = currentPos;
        while (positionMap.get(deleteEnd) && positionMap.get(deleteEnd).change === deletion.change) {
          deleteEnd++;
        }
        
        // Add the deleted text
        elements.push(
          <span key={`delete-${elementKey++}`} className="diff-deleted">
            {originalText.substring(currentPos, deleteEnd)}
          </span>
        );
        
        currentPos = deleteEnd;
      } else {
        // Find the next change position
        let nextChangePos = originalText.length;
        
        // Find the nearest deletion start
        for (let pos = currentPos + 1; pos < originalText.length; pos++) {
          if (positionMap.has(pos)) {
            nextChangePos = pos;
            break;
          }
        }
        
        // Find the nearest insertion
        changes.forEach(change => {
          if (change.type === 'insert' && change.start_pos > currentPos && change.start_pos < nextChangePos) {
            nextChangePos = change.start_pos;
          }
        });
        
        // Add unchanged text
        if (nextChangePos > currentPos) {
          elements.push(
            <span key={`unchanged-${elementKey++}`}>
              {originalText.substring(currentPos, nextChangePos)}
            </span>
          );
        }
        
        currentPos = nextChangePos;
      }
    }

    return elements;
  };

  return (
    <div className="diff-view">
      {renderDiffText()}
    </div>
  );
};

export default DiffView; 