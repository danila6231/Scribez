import React from 'react';
import DocumentItem from './DocumentItem';

function DocumentGroup({ title, documents, formatTime, formatDate, onDelete }) {
  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="document-group">
      <h3 className="group-title">{title}</h3>
      <div className="document-items">
        {documents.map((doc) => (
          <DocumentItem
            key={doc.id}
            document={doc}
            formatTime={formatTime}
            formatDate={formatDate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

export default DocumentGroup; 