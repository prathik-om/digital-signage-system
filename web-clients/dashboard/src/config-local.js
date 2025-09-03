// Local configuration file for testing
const config = {
  // API configuration - Local testing with proxy
  API_BASE_URL: 'http://localhost:3001/api',
  
  // API endpoints for Catalyst functions
  API_ENDPOINTS: {
    auth: '/auth',
    content: '/content',
    playlist: '/playlist',
    emergency: '/emergency',
    zohoIntegration: '/zoho-integration',
    testSimple: '/test-simple'
  },
  
  // Default settings
  DEFAULT_SETTINGS: {
    default_slide_timer: 10
  },
  
  // UI configuration
  UI: {
    refreshInterval: 30000, // 30 seconds
    maxRetries: 3,
    timeout: 10000 // 10 seconds
  },
  
  // Feature flags
  FEATURES: {
    enableSettings: true,
    enableContentManagement: true,
    enablePlaylistManagement: true,
    enableEmergencyMessages: true
  }
};

// Export individual values for direct import
export const { API_BASE_URL, API_ENDPOINTS, DEFAULT_SETTINGS, UI, FEATURES } = config;

// Helper function to get Catalyst authentication headers
export const getCatalystAuthHeaders = () => {
  return {
    'Content-Type': 'application/json'
  };
};

// Helper function to build full API URLs
export const getApiUrl = (endpoint) => {
  return `${config.API_BASE_URL}${endpoint}`;
};

export default config;
