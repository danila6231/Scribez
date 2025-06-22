import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function DocumentItem({ document, formatTime, formatDate, onDelete }) {
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleActionClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowActions(!showActions);
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete "${document.title}"?`)) {
      try {
        setIsDeleting(true);
        await onDelete(document.id);
      } catch (error) {
        console.error('Failed to delete document:', error);
      } finally {
        setIsDeleting(false);
        setShowActions(false);
      }
    }
  };

  const handleClickOutside = () => {
    setShowActions(false);
  };

  const getFormattedDate = (date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const docDate = new Date(date);
    const docDateOnly = new Date(docDate.getFullYear(), docDate.getMonth(), docDate.getDate());

    // If it's today, show time, otherwise show date
    if (docDateOnly.getTime() === today.getTime()) {
      return formatTime(docDate);
    } else {
      return formatDate(docDate);
    }
  };

  return (
    <div className="document-item-wrapper">
      <Link to={`/editor/${document.id}`} className="document-item">
        <div className="document-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#4285f4">
            <path d="M14,17H7V15H14M17,13H7V11H17M17,9H7V7H17M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z"/>
          </svg>
        </div>
        <div className="document-details">
          <span className="document-name">{document.title}</span>
          <div className="document-meta-row">
            <span className="owner">me</span>
            <span className="last-opened">{getFormattedDate(document.lastModified)}</span>
          </div>
        </div>
        <div className="document-actions">
          <button 
            className="action-btn" 
            onClick={handleActionClick}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <div className="mini-spinner"></div>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"/>
              </svg>
            )}
          </button>
        </div>
      </Link>
      
      {/* Actions Dropdown */}
      {showActions && (
        <>
          <div className="dropdown-overlay" onClick={handleClickOutside}></div>
          <div className="actions-dropdown">
            <button 
              className="action-option delete-option" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
              </svg>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default DocumentItem; 