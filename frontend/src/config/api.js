// Get the API base URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
console.log(API_BASE_URL);

// Export the base URL and full API URL
export const BASE_URL = API_BASE_URL;
export const API_URL = `${API_BASE_URL}/api`;

// Helper function to construct API endpoints
export const getApiUrl = (endpoint) => {
  return `${API_URL}${endpoint}`;
};

// Helper function to construct full URL (without /api prefix)
export const getBaseUrl = (endpoint) => {
  return `${BASE_URL}${endpoint}`;
}; 