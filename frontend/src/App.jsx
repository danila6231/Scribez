import React from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import DiffTester from './components/Diff/DiffTester';
import PrintView from './components/Print/PrintView';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import LandingPage from './components/Landing/LandingPage';
import { 
  SignedIn
} from '@clerk/clerk-react';
import { useAuth } from "@clerk/clerk-react";

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

// Protected Print Component
function ProtectedPrintView() {
  return (
    <SignedIn>
      <PrintView />
    </SignedIn>
  );
}

function userId(){
  const { isLoaded, isSignedIn, userId } = useAuth();

  // You have to wait for Clerk to load before you can check the status
  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <div>Please sign in to see your profile.</div>;
  }

  // Once loaded and signed in, you have the userId
  return <div>Your User ID is: {userId}</div>;
}
function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/editor" element={<Navigate to="/dashboard" replace />} />
      <Route path="/editor/:documentId" element={<ProtectedEditor />} />
      <Route path="/dashboard" element={<ProtectedDashboard />} />
      <Route path="/diff-tester" element={<DiffTester />} />
      <Route path="/print/:documentId" element={<ProtectedPrintView />} />
      {/* Catch-all route for invalid URLs */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App; 