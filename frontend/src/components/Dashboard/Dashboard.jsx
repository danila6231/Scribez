import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import DocumentGroup from './DocumentGroup';
import { documentAPI, utils } from '../../services/api';

function Dashboard() {
  const { user } = useUser();
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user documents when component mounts or userId changes
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch documents from backend
        const apiDocuments = await documentAPI.getUserDocuments(userId);
        
        // Format documents for frontend display
        const formattedDocuments = apiDocuments.map(utils.formatDocument);
        
        setDocuments(formattedDocuments);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents. Please try again.');
        // Fallback to empty array if API fails
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [userId]);

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group documents by date sections
  const groupDocumentsByDate = (docs) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const groups = {
      today: [],
      yesterday: [],
      previous7Days: [],
      previous30Days: [],
      older: []
    };

    docs.forEach(doc => {
      const docDate = new Date(doc.lastModified);
      const docDateOnly = new Date(docDate.getFullYear(), docDate.getMonth(), docDate.getDate());

      if (docDateOnly.getTime() === today.getTime()) {
        groups.today.push(doc);
      } else if (docDateOnly.getTime() === yesterday.getTime()) {
        groups.yesterday.push(doc);
      } else if (docDate >= sevenDaysAgo) {
        groups.previous7Days.push(doc);
      } else if (docDate >= thirtyDaysAgo) {
        groups.previous30Days.push(doc);
      } else {
        groups.older.push(doc);
      }
    });

    // Sort each group by last modified (newest first)
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    });

    return groups;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const groupedDocuments = groupDocumentsByDate(filteredDocuments);

  const createNewDocument = async () => {
    if (!userId) {
      setError('Please sign in to create documents.');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      // Create document in backend using Clerk userId
      const newDocument = await documentAPI.createDocument(userId, 'Untitled Document');
      
      // Format the new document for frontend
      const formattedDoc = utils.formatDocument(newDocument);
      
      // Add to local state
      setDocuments(prev => [formattedDoc, ...prev]);
      
      // Navigate to editor with the new document ID from backend
      navigate(`/editor/${newDocument.id}`);
      
    } catch (err) {
      console.error('Error creating document:', err);
      setError('Failed to create document. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteDocument = async (documentId) => {
    try {
      await documentAPI.deleteDocument(documentId);
      
      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document. Please try again.');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-nav">
          <div className="nav-left">
            <div className="logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#4285f4">
                <path d="M14,17H7V15H14M17,13H7V11H17M17,9H7V7H17M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z"/>
              </svg>
              <span className="logo-text">WriteFlow</span>
            </div>
          </div>
          <div className="nav-center">
            <div className="search-container">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="#5f6368">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search documents"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="nav-right">
            <span className="user-name">Hello, {user?.firstName || 'User'}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Error Message */}
          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}

          {/* Create New Document Section */}
          <section className="create-section">
            <h2>Start a new document</h2>
            <div className="template-gallery">
              <div 
                className={`template-card new-doc ${isCreating ? 'creating' : ''}`} 
                onClick={createNewDocument}
                disabled={isCreating}
              >
                <div className="template-preview">
                  {isCreating ? (
                    <div className="creating-spinner"></div>
                  ) : (
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="#4285f4">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                  )}
                </div>
                <span className="template-name">
                  {isCreating ? 'Creating...' : 'Blank'}
                </span>
              </div>
            </div>
          </section>

          {/* Recent Documents Section */}
          <section className="documents-section">
            <div className="section-header">
              <h2>Recent documents</h2>
            </div>

            {filteredDocuments.length === 0 ? (
              <div className="empty-state">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="#dadce0">
                  <path d="M14,17H7V15H14M17,13H7V11H17M17,9H7V7H17M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z"/>
                </svg>
                <h3>No documents found</h3>
                <p>
                  {searchTerm 
                    ? 'No documents match your search. Try a different search term.' 
                    : 'Create your first document to get started'
                  }
                </p>
              </div>
            ) : (
              <div className="documents-list">
                <DocumentGroup
                  title="Today"
                  documents={groupedDocuments.today}
                  formatTime={formatTime}
                  formatDate={formatDate}
                  onDelete={deleteDocument}
                />
                
                <DocumentGroup
                  title="Previous 7 days"
                  documents={groupedDocuments.previous7Days}
                  formatTime={formatTime}
                  formatDate={formatDate}
                  onDelete={deleteDocument}
                />
                
                <DocumentGroup
                  title="Previous 30 days"
                  documents={groupedDocuments.previous30Days}
                  formatTime={formatTime}
                  formatDate={formatDate}
                  onDelete={deleteDocument}
                />
                
                <DocumentGroup
                  title="Older"
                  documents={groupedDocuments.older}
                  formatTime={formatTime}
                  formatDate={formatDate}
                  onDelete={deleteDocument}
                />
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard; 