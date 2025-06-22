import React, { useState, useEffect } from 'react';
import './diff.css';

const DiffView = ({ originalText, changes, onAccept, onReject, onAcceptAll, onRejectAll }) => {
  const [processedChanges, setProcessedChanges] = useState([]);
  const [acceptedChanges, setAcceptedChanges] = useState(new Set());
  const [rejectedChanges, setRejectedChanges] = useState(new Set());

  useEffect(() => {
    // Process and sort changes
    const processed = changes.map((change, index) => ({
      ...change,
      id: `change-${index}`
    }));
    setProcessedChanges(processed);
  }, [changes]);

  const handleAcceptChange = (changeId) => {
    setAcceptedChanges(new Set([...acceptedChanges, changeId]));
    setRejectedChanges(prev => {
      const newSet = new Set(prev);
      newSet.delete(changeId);
      return newSet;
    });
    if (onAccept) onAccept(changeId);
  };

  const handleRejectChange = (changeId) => {
    setRejectedChanges(new Set([...rejectedChanges, changeId]));
    setAcceptedChanges(prev => {
      const newSet = new Set(prev);
      newSet.delete(changeId);
      return newSet;
    });
    if (onReject) onReject(changeId);
  };

  const handleAcceptAll = () => {
    const allIds = processedChanges.map(c => c.id);
    setAcceptedChanges(new Set(allIds));
    setRejectedChanges(new Set());
    if (onAcceptAll) onAcceptAll();
  };

  const handleRejectAll = () => {
    const allIds = processedChanges.map(c => c.id);
    setRejectedChanges(new Set(allIds));
    setAcceptedChanges(new Set());
    if (onRejectAll) onRejectAll();
  };

  // Function to apply changes to the original text and create a rendered output
  const renderDiffText = () => {
    if (!processedChanges || processedChanges.length === 0) {
      return <span>{originalText}</span>;
    }

    // Create a map to track all positions and their changes
    const positionMap = new Map();
    
    // Track deletions by their position range
    processedChanges.forEach(change => {
      if (change.type === 'delete' && !rejectedChanges.has(change.id)) {
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
      const insertions = processedChanges.filter(
        c => c.type === 'insert' && c.start_pos === currentPos && !rejectedChanges.has(c.id)
      );
      
      insertions.forEach(insertion => {
        const isAccepted = acceptedChanges.has(insertion.id);
        const isPending = !isAccepted && !rejectedChanges.has(insertion.id);
        
        elements.push(
          <span key={`insert-${elementKey++}`} className="diff-change-wrapper">
            <span className={`diff-inserted ${isAccepted ? 'accepted' : ''} ${isPending ? 'pending' : ''}`}>
              {insertion.new_text}
            </span>
            {isPending && (
              <span className="diff-controls">
                <button 
                  className="diff-accept-btn" 
                  onClick={() => handleAcceptChange(insertion.id)}
                  title="Accept change"
                >
                  ✓
                </button>
                <button 
                  className="diff-reject-btn" 
                  onClick={() => handleRejectChange(insertion.id)}
                  title="Reject change"
                >
                  ✗
                </button>
              </span>
            )}
          </span>
        );
      });
      
      // If we've reached the end, break
      if (currentPos >= originalText.length) break;
      
      // Check if current position is part of a deletion
      const deletion = positionMap.get(currentPos);
      
      if (deletion) {
        const isAccepted = acceptedChanges.has(deletion.change.id);
        const isPending = !isAccepted && !rejectedChanges.has(deletion.change.id);
        
        // Find the full deletion range
        let deleteEnd = currentPos;
        while (positionMap.get(deleteEnd) && positionMap.get(deleteEnd).change === deletion.change) {
          deleteEnd++;
        }
        
        // Add the deleted text
        elements.push(
          <span key={`delete-${elementKey++}`} className="diff-change-wrapper">
            <span className={`diff-deleted ${isAccepted ? 'accepted' : ''} ${isPending ? 'pending' : ''}`}>
              {originalText.substring(currentPos, deleteEnd)}
            </span>
            {isPending && (
              <span className="diff-controls">
                <button 
                  className="diff-accept-btn" 
                  onClick={() => handleAcceptChange(deletion.change.id)}
                  title="Accept deletion"
                >
                  ✓
                </button>
                <button 
                  className="diff-reject-btn" 
                  onClick={() => handleRejectChange(deletion.change.id)}
                  title="Reject deletion"
                >
                  ✗
                </button>
              </span>
            )}
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
        processedChanges.forEach(change => {
          if (change.type === 'insert' && 
              change.start_pos > currentPos && 
              change.start_pos < nextChangePos &&
              !rejectedChanges.has(change.id)) {
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

  const pendingChangesCount = processedChanges.filter(
    c => !acceptedChanges.has(c.id) && !rejectedChanges.has(c.id)
  ).length;

  return (
    <div className="diff-container">
      {pendingChangesCount > 0 && (
        <div className="diff-controls-bar">
          <span className="pending-count">{pendingChangesCount} pending changes</span>
          <div className="diff-bulk-controls">
            <button onClick={handleAcceptAll} className="diff-accept-all">
              Accept All
            </button>
            <button onClick={handleRejectAll} className="diff-reject-all">
              Reject All
            </button>
          </div>
        </div>
      )}
      <div className="diff-view">
        {renderDiffText()}
      </div>
    </div>
  );
};

export default DiffView; 