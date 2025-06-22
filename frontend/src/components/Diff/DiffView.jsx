import React, { useState, useEffect } from 'react';
import './diff.css';

const DiffView = ({ originalText, changes, onAccept, onReject, onAcceptAll, onRejectAll, acceptedChanges, rejectedChanges }) => {
  const [processedChanges, setProcessedChanges] = useState([]);
  const [localAcceptedChanges, setLocalAcceptedChanges] = useState(new Set());
  const [localRejectedChanges, setLocalRejectedChanges] = useState(new Set());
  
  // Use external state if provided, otherwise use local state
  const acceptedChangesSet = acceptedChanges || localAcceptedChanges;
  const rejectedChangesSet = rejectedChanges || localRejectedChanges;

  useEffect(() => {
    // Process and sort changes
    const processed = changes.map((change, index) => ({
      ...change,
      id: `change-${index}`,
      index: index
    }));
    setProcessedChanges(processed);
  }, [changes]);

  const handleAcceptChange = (changeId, changeIndex) => {
    if (acceptedChanges && rejectedChanges) {
      // External state management
      onAccept(changeId, changes[changeIndex]);
    } else {
      // Local state management
      setLocalAcceptedChanges(new Set([...localAcceptedChanges, changeId]));
      setLocalRejectedChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(changeId);
        return newSet;
      });
      if (onAccept) onAccept(changeId, changes[changeIndex]);
    }
  };

  const handleRejectChange = (changeId, changeIndex) => {
    if (acceptedChanges && rejectedChanges) {
      // External state management
      onReject(changeId, changes[changeIndex]);
    } else {
      // Local state management
      setLocalRejectedChanges(new Set([...localRejectedChanges, changeId]));
      setLocalAcceptedChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(changeId);
        return newSet;
      });
      if (onReject) onReject(changeId, changes[changeIndex]);
    }
  };

  const handleAcceptAll = () => {
    const allIds = processedChanges.map(c => c.id);
    setLocalAcceptedChanges(new Set(allIds));
    setLocalRejectedChanges(new Set());
    if (onAcceptAll) onAcceptAll();
  };

  const handleRejectAll = () => {
    const allIds = processedChanges.map(c => c.id);
    setLocalRejectedChanges(new Set(allIds));
    setLocalAcceptedChanges(new Set());
    if (onRejectAll) onRejectAll();
  };

  // Function to apply changes to the original text and create a rendered output
  const renderDiffText = () => {
    if (!processedChanges || processedChanges.length === 0) {
      return <span>{originalText}</span>;
    }

    // Create a map to track all positions and their changes
    const positionMap = new Map();
    
    // Track deletions and replacements by their position range
    processedChanges.forEach(change => {
      if ((change.type === 'delete' || change.type === 'replace') && !rejectedChangesSet.has(change.id)) {
        for (let pos = change.start_pos; pos < change.end_pos; pos++) {
          positionMap.set(pos, { type: change.type, change });
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
        c => c.type === 'insert' && c.start_pos === currentPos && !rejectedChangesSet.has(c.id)
      );
      
      insertions.forEach(insertion => {
        const isAccepted = acceptedChangesSet.has(insertion.id);
        const isPending = !isAccepted && !rejectedChangesSet.has(insertion.id);
        
        elements.push(
          <span key={`insert-${elementKey++}`} className="diff-change-wrapper">
            {isPending && (
              <span className="diff-controls">
                <button 
                  className="diff-accept-btn" 
                  onClick={() => handleAcceptChange(insertion.id, insertion.index)}
                  title="Accept change"
                >
                  ✓
                </button>
                <button 
                  className="diff-reject-btn" 
                  onClick={() => handleRejectChange(insertion.id, insertion.index)}
                  title="Reject change"
                >
                  ✗
                </button>
              </span>
            )}
            <span className={`diff-inserted ${isAccepted ? 'accepted' : ''} ${isPending ? 'pending' : ''}`}>
              {insertion.new_text}
            </span>
          </span>
        );
      });
      
      // If we've reached the end, break
      if (currentPos >= originalText.length) break;
      
      // Check if current position is part of a deletion or replacement
      const changeAtPos = positionMap.get(currentPos);
      
      if (changeAtPos) {
        const isAccepted = acceptedChangesSet.has(changeAtPos.change.id);
        const isPending = !isAccepted && !rejectedChangesSet.has(changeAtPos.change.id);
        
        // Find the full change range
        let changeEnd = currentPos;
        while (positionMap.get(changeEnd) && positionMap.get(changeEnd).change === changeAtPos.change) {
          changeEnd++;
        }
        
        // Handle delete or replace
        if (changeAtPos.type === 'delete') {
          // Add the deleted text
          elements.push(
            <span key={`delete-${elementKey++}`} className="diff-change-wrapper">
              {isPending && (
                <span className="diff-controls">
                  <button 
                    className="diff-accept-btn" 
                    onClick={() => handleAcceptChange(changeAtPos.change.id, changeAtPos.change.index)}
                    title="Accept deletion"
                  >
                    ✓
                  </button>
                  <button 
                    className="diff-reject-btn" 
                    onClick={() => handleRejectChange(changeAtPos.change.id, changeAtPos.change.index)}
                    title="Reject deletion"
                  >
                    ✗
                  </button>
                </span>
              )}
              <span className={`diff-deleted ${isAccepted ? 'accepted' : ''} ${isPending ? 'pending' : ''}`}>
                {originalText.substring(currentPos, changeEnd)}
              </span>
            </span>
          );
        } else if (changeAtPos.type === 'replace') {
          // Add both the deleted text and the new text for replacements
          elements.push(
            <span key={`replace-${elementKey++}`} className="diff-change-wrapper">
              {isPending && (
                <span className="diff-controls">
                  <button 
                    className="diff-accept-btn" 
                    onClick={() => handleAcceptChange(changeAtPos.change.id, changeAtPos.change.index)}
                    title="Accept replacement"
                  >
                    ✓
                  </button>
                  <button 
                    className="diff-reject-btn" 
                    onClick={() => handleRejectChange(changeAtPos.change.id, changeAtPos.change.index)}
                    title="Reject replacement"
                  >
                    ✗
                  </button>
                </span>
              )}
              <span className={`diff-deleted ${isAccepted ? 'accepted' : ''} ${isPending ? 'pending' : ''}`}>
                {changeAtPos.change.old_text}
              </span>
              <span className={`diff-inserted ${isAccepted ? 'accepted' : ''} ${isPending ? 'pending' : ''}`}>
                {changeAtPos.change.new_text}
              </span>
            </span>
          );
        }
        
        currentPos = changeEnd;
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
              !rejectedChangesSet.has(change.id)) {
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
    c => !acceptedChangesSet.has(c.id) && !rejectedChangesSet.has(c.id)
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