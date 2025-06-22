import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { documentAPI } from '../../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function PrintView() {
  const { documentId } = useParams();
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDocumentForPrint = async () => {
      if (!documentId) {
        setError('No document ID provided');
        setLoading(false);
        return;
      }

      try {
        console.log('📄 Loading document for print:', documentId);
        
        // Fetch both title and content using existing endpoints
        const [title, documentContent] = await Promise.all([
          documentAPI.getDocumentTitle(documentId),
          documentAPI.getDocumentContent(documentId)
        ]);

        console.log('✅ Document loaded for print:');
        console.log('Title:', title);
        console.log('Content length:', documentContent?.length || 0);

        setDocument({ title, id: documentId });
        setContent(documentContent || '');
        
        // Auto-trigger print dialog after content loads
        setTimeout(() => {
          window.print();
        }, 500);
        
      } catch (err) {
        console.error('❌ Failed to load document for print:', err);
        setError(`Failed to load document: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadDocumentForPrint();
  }, [documentId]);

  if (loading) {
    return (
      <div className="print-loading">
        <p>Loading document for printing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="print-error">
        <h1>Print Error</h1>
        <p>{error}</p>
        <button onClick={() => window.close()}>Close</button>
      </div>
    );
  }

  return (
    <div className="print-document">
      <div className="print-content">
        {content ? (
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // Customize components for print
              h1: ({children}) => <h1 className="print-h1">{children}</h1>,
              h2: ({children}) => <h2 className="print-h2">{children}</h2>,
              h3: ({children}) => <h3 className="print-h3">{children}</h3>,
              h4: ({children}) => <h4 className="print-h4">{children}</h4>,
              h5: ({children}) => <h5 className="print-h5">{children}</h5>,
              h6: ({children}) => <h6 className="print-h6">{children}</h6>,
              p: ({children}) => <p className="print-paragraph">{children}</p>,
              blockquote: ({children}) => <blockquote className="print-blockquote">{children}</blockquote>,
              ul: ({children}) => <ul className="print-ul">{children}</ul>,
              ol: ({children}) => <ol className="print-ol">{children}</ol>,
              li: ({children}) => <li className="print-li">{children}</li>,
              code: ({inline, children}) => 
                inline ? 
                  <code className="print-inline-code">{children}</code> : 
                  <pre className="print-code-block"><code>{children}</code></pre>,
              a: ({href, children}) => <a href={href} className="print-link">{children}</a>,
              img: ({src, alt}) => <img src={src} alt={alt} className="print-image" />,
              table: ({children}) => <table className="print-table">{children}</table>,
              thead: ({children}) => <thead className="print-thead">{children}</thead>,
              tbody: ({children}) => <tbody className="print-tbody">{children}</tbody>,
              tr: ({children}) => <tr className="print-tr">{children}</tr>,
              th: ({children}) => <th className="print-th">{children}</th>,
              td: ({children}) => <td className="print-td">{children}</td>,
              hr: () => <hr className="print-hr" />,
            }}
          >
            {content}
          </ReactMarkdown>
        ) : (
          <p className="print-empty">This document is empty.</p>
        )}
      </div>
    </div>
  );
}

export default PrintView; 