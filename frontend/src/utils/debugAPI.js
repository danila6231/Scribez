import { documentAPI } from '../services/api';

// Debug utility to test API endpoints
export const debugDocumentAPI = async (documentId) => {
  console.log('🐛 DEBUG: Testing document API endpoints');
  console.log('Document ID:', documentId);
  
  if (!documentId) {
    console.error('❌ No document ID provided');
    return;
  }

  try {
    // Test 1: Check if document exists by getting title
    console.log('🧪 Test 1: Getting document title...');
    const title = await documentAPI.getDocumentTitle(documentId);
    console.log('✅ Title retrieved:', title);

    // Test 2: Get document content
    console.log('🧪 Test 2: Getting document content...');
    const content = await documentAPI.getDocumentContent(documentId);
    console.log('✅ Content retrieved:');
    console.log('Content type:', typeof content);
    console.log('Content length:', content?.length || 0);
    console.log('Content value:', JSON.stringify(content));
    console.log('Content preview:', content?.substring(0, 200) || 'No content');

    // Test 3: Test direct API call
    console.log('🧪 Test 3: Testing direct API call...');
    const response = await fetch(`https://aiberkeley-hack.onrender.com/api/documents/${documentId}/content`);
    const directData = await response.json();
    console.log('✅ Direct API response:', directData);

    return {
      title,
      content,
      directData,
      success: true
    };

  } catch (error) {
    console.error('❌ Debug test failed:', error);
    return {
      error: error.message,
      success: false
    };
  }
};

// Test content loading in isolation
export const testContentLoading = (content) => {
  console.log('🧪 Testing content loading...');
  console.log('Input content:', content);
  console.log('Content type:', typeof content);
  console.log('Content length:', content?.length || 0);
  
  if (!content) {
    console.log('⚠️ Content is empty or null');
    return false;
  }

  // Test markdown detection
  const isMarkdown = content.includes('# ') || 
                    content.includes('## ') || 
                    content.includes('**') || 
                    content.includes('- ') ||
                    content.includes('1. ') ||
                    content.includes('> ');
  
  console.log('Is Markdown:', isMarkdown);
  
  // Test content splitting
  const lines = content.split('\n');
  console.log('Number of lines:', lines.length);
  console.log('First 3 lines:', lines.slice(0, 3));
  
  return true;
};

// Verify document exists and has content
export const verifyDocument = async (documentId) => {
  try {
    console.log('🔍 Verifying document exists:', documentId);
    
    const response = await fetch(`https://aiberkeley-hack.onrender.com/api/documents/${documentId}/content`);
    
    if (!response.ok) {
      console.error('❌ Document not found or API error:', response.status, response.statusText);
      return false;
    }
    
    const data = await response.json();
    console.log('✅ Document verification successful');
    console.log('Response data:', data);
    
    return true;
    
  } catch (error) {
    console.error('❌ Document verification failed:', error);
    return false;
  }
};

export default {
  debugDocumentAPI,
  testContentLoading,
  verifyDocument
}; 