import React from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import { Routes, Route, Link } from 'react-router-dom';
import { 
  SignedIn, 
  SignedOut, 
  SignInButton, 
  UserButton 
} from '@clerk/clerk-react';

function WordEditor() {
  return <Layout />;
}

function LandingPage() {
  return (
    <div className="landing-page">
      {/* Navigation Header */}
      <header className="landing-header">
        <div className="landing-nav">
          <div className="nav-left">
            <div className="logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#4285f4">
                <path d="M14,17H7V15H14M17,13H7V11H17M17,9H7V7H17M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z"/>
              </svg>
              <span className="logo-text">WriteFlow</span>
            </div>
          </div>
          <div className="nav-right">
            {/*<button className="nav-button secondary">About</button>
            <button className="nav-button secondary">Help</button>*/}
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="nav-button primary">Sign in</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="landing-main">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Create beautiful documents with 
              <span className="highlight-text"> AI assistance</span>
            </h1>
            <p className="hero-subtitle">
              A modern writing tool that combines powerful editing with intelligent chat assistance. 
              Write, edit, and collaborate seamlessly.
            </p>
            <div className="hero-buttons">
              <SignedOut>
                <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                  <button className="cta-button primary">
                    Start writing for free
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link to="/editor" className="cta-button primary">
                  Go to Editor
                </Link>
              </SignedIn>
            </div>
          </div>
          
          {/* Feature Preview */}
          <div className="hero-preview">
            <div className="preview-window">
              <div className="preview-header">
                <div className="preview-dots">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <span className="preview-title">Document.docx</span>
              </div>
              <div className="preview-content">
                <div className="preview-toolbar">
                  <div className="toolbar-section">
                    <button className="tool-btn"><strong>B</strong></button>
                    <button className="tool-btn"><em>I</em></button>
                    <button className="tool-btn"><u>U</u></button>
                    <button className="tool-btn active">🎨</button>
                  </div>
                  <div className="toolbar-section">
                    <button className="tool-btn">≡</button>
                    <button className="tool-btn">≣</button>
                    <button className="tool-btn">≡</button>
                  </div>
                </div>
                <div className="preview-text">
                  <h2>The Future of Writing</h2>
                  <p>Modern tools for modern writers. Create, collaborate, and communicate with ease.</p>
                  <p className="highlighted-text">AI-powered assistance makes writing effortless</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="features-section">
          <div className="features-container">
            <h2 className="features-title">Everything you need to write better</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">✨</div>
                <h3>AI Writing Assistant</h3>
                <p>Get intelligent suggestions and real-time help with your writing</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎨</div>
                <h3>Rich Formatting</h3>
                <p>Beautiful text formatting with alignment, styles, and highlighting</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💬</div>
                <h3>Smart Chat</h3>
                <p>Ask questions and get instant help without leaving your document</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">☁️</div>
                <h3>Auto-Save</h3>
                <p>Never lose your work with automatic saving and sync</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <p>&copy; 2024 WriteFlow. Made with ❤️ by the QuackHacks Tech Team.</p>
        </div>
      </footer>
    </div>
  );
}


// Protected Route Component
function ProtectedEditor() {
  return (
    <SignedIn>
      <WordEditor />
    </SignedIn>
  );
}
function ProtectedDashboard() {
  return (
    <SignedIn>
      <Dashboard />
    </SignedIn>
  );
}
function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/editor" element={<ProtectedEditor />} />
      <Route path="/editor/:documentId" element={<ProtectedEditor />} />
      <Route path="/dashboard" element={<ProtectedDashboard />} />
    </Routes>
  );
}

export default App; 