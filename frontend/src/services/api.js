import axios from 'axios';

// Base API URL - change this to your deployed backend URL
const API_BASE_URL = 'https://aiberkeley-hack.onrender.com/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth headers if needed
api.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    throw error;
  }
);

// Document API functions
export const documentAPI = {
  // Create a new document
  createDocument: async (userId, title = 'Untitled Document') => {
    try {
      const response = await api.post('/documents/', {
        user_id: userId,
        title: title
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create document: ${error.response?.data?.detail || error.message}`);
    }
  },

  // Get all documents for a user
  getUserDocuments: async (userId) => {
    try {
      const response = await api.get(`/documents/user/${userId}`);
      return response.data.documents;
    } catch (error) {
      throw new Error(`Failed to fetch documents: ${error.response?.data?.detail || error.message}`);
    }
  },

  // Get document content
  getDocumentContent: async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}/content`);
      return response.data.content;
    } catch (error) {
      throw new Error(`Failed to fetch document content: ${error.response?.data?.detail || error.message}`);
    }
  },

  // Update document content
  updateDocumentContent: async (documentId, content) => {
    try {
      const response = await api.put(`/documents/${documentId}`, {
        content: content
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update document: ${error.response?.data?.detail || error.message}`);
    }
  },

  // Delete document
  deleteDocument: async (documentId) => {
    try {
      const response = await api.delete(`/documents/${documentId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete document: ${error.response?.data?.detail || error.message}`);
    }
  },

  // Get document title
  getDocumentTitle: async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}/title`);
      return response.data.title;
    } catch (error) {
      throw new Error(`Failed to fetch document title: ${error.response?.data?.detail || error.message}`);
    }
  },

  // Add chat message to document
  addChatMessage: async (documentId, role, content) => {
    try {
      const response = await api.post(`/documents/${documentId}/chat-message`, {
        role: role,
        content: content
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to add chat message: ${error.response?.data?.detail || error.message}`);
    }
  },

  // Get chat history for document
  getChatHistory: async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}/chat-history`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch chat history: ${error.response?.data?.detail || error.message}`);
    }
  }
};

// Chat API functions
export const chatAPI = {
  // Send a message to AI
  sendMessage: async (message, conversationHistory = [], preferredModel = 'claude') => {
    try {
      const response = await api.post('/chat/message', {
        message: message,
        conversation_history: conversationHistory,
        preferred_complex_model: preferredModel
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send message: ${error.response?.data?.detail || error.message}`);
    }
  },

  // Stream message response
  streamMessage: async (message, conversationHistory = [], preferredModel = 'claude') => {
    try {
      const response = await api.post('/chat/message/stream', {
        message: message,
        conversation_history: conversationHistory,
        preferred_complex_model: preferredModel
      }, {
        responseType: 'stream'
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to stream message: ${error.response?.data?.detail || error.message}`);
    }
  },

  // Check chat service health
  checkHealth: async () => {
    try {
      const response = await api.get('/chat/health');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to check chat health: ${error.response?.data?.detail || error.message}`);
    }
  }
};

// Diff API functions
export const diffAPI = {
  // Compute diff between two texts
  computeDiff: async (oldContent, newContent, granularity = 'word') => {
    try {
      const response = await api.post('/diff/compute', {
        old_content: oldContent,
        new_content: newContent,
        granularity: granularity
      });
      return response.data.changes;
    } catch (error) {
      throw new Error(`Failed to compute diff: ${error.response?.data?.detail || error.message}`);
    }
  },

  // Compute line-based diff
  computeLineDiff: async (oldContent, newContent) => {
    try {
      const response = await api.post('/diff/compute-line-based', {
        old_content: oldContent,
        new_content: newContent
      });
      return response.data.changes;
    } catch (error) {
      throw new Error(`Failed to compute line diff: ${error.response?.data?.detail || error.message}`);
    }
  }
};

// Utility functions
export const utils = {
  // Format document data from API response
  formatDocument: (doc) => ({
    id: doc.id,
    title: doc.title,
    lastModified: new Date(doc.updated_at),
    preview: doc.content ? doc.content.substring(0, 100) + '...' : '',
    wordCount: doc.content ? doc.content.split(/\s+/).length : 0,
    createdAt: new Date(doc.created_at)
  }),

  // Format chat message from API response
  formatChatMessage: (msg) => ({
    content: msg.content,
    role: msg.role,
    timestamp: new Date(msg.timestamp)
  })
};

export default api; 