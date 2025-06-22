import React, { useState } from 'react';
import DiffView from './DiffView';
import './diffTester.css';

const DiffTester = () => {
  const [originalText, setOriginalText] = useState('The Smart City Initiative aims to transform urban living through technology.');
  const [newText, setNewText] = useState('The City Initiative aims to revolutionize urban living through cutting-edge technology.');
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [granularity, setGranularity] = useState('word');

  const computeDiff = async () => {
    if (!originalText || !newText) {
      setError('Please provide both original and new text');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/diff/compute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          old_content: originalText,
          new_content: newText,
          granularity: granularity
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setChanges(data.changes);
    } catch (err) {
      setError(`Failed to compute diff: ${err.message}`);
      console.error('Diff error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="diff-tester">
      <h1>Diff Tester</h1>
      <p className="instructions">
        Enter original and new text below to see the differences. 
        Deleted text will appear with a <span className="example-deleted">blue strikethrough</span>, 
        and added text will have <span className="example-inserted">top and bottom bars</span>.
      </p>

      <div className="input-section">
        <div className="text-input-container">
          <label htmlFor="original-text">Original Text:</label>
          <textarea
            id="original-text"
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="Enter original text..."
            rows={8}
          />
        </div>

        <div className="text-input-container">
          <label htmlFor="new-text">New Text:</label>
          <textarea
            id="new-text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Enter new text..."
            rows={8}
          />
        </div>
      </div>

      <div className="controls">
        <div className="granularity-selector">
          <label>
            Granularity:
            <select value={granularity} onChange={(e) => setGranularity(e.target.value)}>
              <option value="word">Word</option>
              <option value="character">Character</option>
            </select>
          </label>
        </div>
        <button 
          onClick={computeDiff} 
          disabled={loading}
          className="compute-button"
        >
          {loading ? 'Computing...' : 'Compute Diff'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {changes.length > 0 && (
        <>
          <div className="result-section">
            <h2>Diff Result:</h2>
            <div className="diff-result">
              <DiffView originalText={originalText} changes={changes} />
            </div>
          </div>

          <div className="debug-section">
            <h3>Debug Info (Changes Array):</h3>
            <pre className="debug-info">
              {JSON.stringify(changes, null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
};

export default DiffTester; 