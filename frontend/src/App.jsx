import React from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import { Routes, Route, Link } from 'react-router-dom';
import LandingPage from './components/Landing/LandingPage';
import { 
  SignedIn
} from '@clerk/clerk-react';

function WordEditor() {
  return <Layout />;
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