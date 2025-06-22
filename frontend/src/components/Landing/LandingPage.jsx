import React from 'react';
import { 
    SignedIn, 
    SignedOut, 
    SignInButton, 
    UserButton 
  } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import quillLogo from '../../assets/icons/quill-and-piece-of-paper.png';

export default function LandingPage() {
return (
    <div className="landing-page">
    {/* Navigation Header */}
    <header className="landing-header">
        <div className="landing-nav">
        <div className="nav-left">
            <div className="logo">
            <div className="logo">
              <img src={quillLogo} alt="Skribez Logo" />
            </div>
            <span className="logo-text">Skribez</span>
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
                <Link to="/dashboard" className="cta-button primary">
                Go to Dashboard
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

    <footer className="landing-footer">
        <div className="footer-container">
        <p>&copy; 2024 Skribez. Made with ❤️</p>
        </div>
    </footer>
    </div>
);
}