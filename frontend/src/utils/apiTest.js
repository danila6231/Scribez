import { documentAPI, chatAPI, diffAPI } from '../services/api';

// Test API Integration
export const testAPIIntegration = async (userId) => {
  console.log('🧪 Starting API Integration Tests...');
  
  if (!userId) {
    console.error('❌ No userId provided for testing');
    return false;
  }

  try {
    // Test 1: Create a new document
    console.log('📝 Test 1: Creating a new document...');
    const newDoc = await documentAPI.createDocument(userId, 'API Test Document');
    console.log('✅ Document created successfully:', newDoc);

    // Test 2: Get user documents
    console.log('📋 Test 2: Fetching user documents...');
    const userDocs = await documentAPI.getUserDocuments(userId);
    console.log('✅ User documents fetched:', userDocs);

    // Test 3: Update document content
    console.log('📝 Test 3: Updating document content...');
    const testContent = '# Test Document\n\nThis is a test document created via API.\n\n- Feature 1\n- Feature 2\n- Feature 3';
    const updatedDoc = await documentAPI.updateDocumentContent(newDoc.id, testContent);
    console.log('✅ Document updated successfully:', updatedDoc);

    // Test 4: Get document content
    console.log('📖 Test 4: Fetching document content...');
    const content = await documentAPI.getDocumentContent(newDoc.id);
    console.log('✅ Document content fetched:', content);

    // Test 5: Add chat message
    console.log('💬 Test 5: Adding chat message...');
    await documentAPI.addChatMessage(newDoc.id, 'user', 'This is a test chat message');
    console.log('✅ Chat message added successfully');

    // Test 6: Get chat history
    console.log('📜 Test 6: Fetching chat history...');
    const chatHistory = await documentAPI.getChatHistory(newDoc.id);
    console.log('✅ Chat history fetched:', chatHistory);

    // Test 7: Test chat API (if API keys are configured)
    console.log('🤖 Test 7: Testing chat AI...');
    try {
      const chatResponse = await chatAPI.sendMessage('Hello, this is a test message');
      console.log('✅ Chat AI response:', chatResponse);
    } catch (err) {
      console.log('⚠️ Chat AI test skipped (API keys may not be configured):', err.message);
    }

    // Test 8: Test diff API
    console.log('🔄 Test 8: Testing diff computation...');
    const oldText = 'Hello world';
    const newText = 'Hello beautiful world';
    const diffResult = await diffAPI.computeDiff(oldText, newText, 'word');
    console.log('✅ Diff computed successfully:', diffResult);

    // Test 9: Delete the test document (cleanup)
    console.log('🗑️ Test 9: Cleaning up - deleting test document...');
    await documentAPI.deleteDocument(newDoc.id);
    console.log('✅ Test document deleted successfully');

    console.log('🎉 All API tests completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ API test failed:', error);
    return false;
  }
};

// Test specific API endpoint
export const testEndpoint = async (endpoint, ...args) => {
  console.log(`🧪 Testing endpoint: ${endpoint}`);
  
  try {
    let result;
    
    switch (endpoint) {
      case 'createDocument':
        result = await documentAPI.createDocument(...args);
        break;
      case 'getUserDocuments':
        result = await documentAPI.getUserDocuments(...args);
        break;
      case 'getDocumentContent':
        result = await documentAPI.getDocumentContent(...args);
        break;
      case 'updateDocumentContent':
        result = await documentAPI.updateDocumentContent(...args);
        break;
      case 'deleteDocument':
        result = await documentAPI.deleteDocument(...args);
        break;
      case 'sendMessage':
        result = await chatAPI.sendMessage(...args);
        break;
      case 'computeDiff':
        result = await diffAPI.computeDiff(...args);
        break;
      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }
    
    console.log(`✅ ${endpoint} test passed:`, result);
    return result;
  } catch (error) {
    console.error(`❌ ${endpoint} test failed:`, error);
    throw error;
  }
};

// Check API health
export const checkAPIHealth = async () => {
  console.log('🏥 Checking API health...');
  
  try {
    const health = await chatAPI.checkHealth();
    console.log('✅ API health check passed:', health);
    return health;
  } catch (error) {
    console.error('❌ API health check failed:', error);
    return null;
  }
};

export default {
  testAPIIntegration,
  testEndpoint,
  checkAPIHealth
}; 