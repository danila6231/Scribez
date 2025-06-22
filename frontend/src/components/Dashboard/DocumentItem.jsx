import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import notesIcon from '../../assets/icons/notes.png';

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

  const handlePrint = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Open print view in new tab
    const printUrl = `/print/${document.id}`;
    window.open(printUrl, '_blank');
    setShowActions(false);
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
        <img src={notesIcon} alt="Document" width="20" height="20" />
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
              className="action-option print-option" 
              onClick={handlePrint}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
                <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"/>
              </svg>
              Print
            </button>
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