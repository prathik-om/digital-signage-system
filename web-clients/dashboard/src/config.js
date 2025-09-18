// Configuration file for the dashboard
const isDevelopment = process.env.NODE_ENV === 'development' || 
                     (typeof window !== 'undefined' && 
                      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));


const config = {
  // Smart API configuration - Auto-detects environment
  API_BASE_URL: (() => {
    const url = process.env.REACT_APP_API_BASE_URL || 
                (isDevelopment 
                  ? 'http://localhost:3001'  // Development: Use local proxy to handle CORS
                  : 'https://atrium-60045083855.development.catalystserverless.in'); // Production: Direct API
    console.log('🔍 [Config] Environment Detection:');
    console.log('  - NODE_ENV:', process.env.NODE_ENV);
    console.log('  - REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
    console.log('  - isDevelopment:', isDevelopment);
    console.log('  - Final API_BASE_URL:', url);
    return url;
  })(),
  
  // API endpoints for Catalyst functions
  API_ENDPOINTS: {
    auth: '/auth',
    content: '/content',
    playlist: '/playlist',
    emergency: '/emergency',
    settings: '/settings',
    setupDatabase: '/setup_database_multiuser',
    zohoIntegration: '/zoho-integration',
    events: '/events',
    screens: '/screens',
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
  
  // Zoho OAuth Configuration
  ZOHO_OAUTH: {
    clientId: process.env.REACT_APP_ZOHO_CLIENT_ID || 'YOUR_CLIENT_ID_HERE',
    redirectUri: process.env.REACT_APP_ZOHO_REDIRECT_URI || (isDevelopment ? 'http://localhost:3000/auth/callback' : 'https://atrium-60045083855.development.catalystserverless.in/dashboard/auth/callback'),
    scope: 'openid profile email phone',
    authUrl: 'https://accounts.zoho.in/oauth/v2/auth',
    tokenUrl: 'https://accounts.zoho.in/oauth/v2/token',
    userInfoUrl: 'https://accounts.zoho.in/oauth/user/info'
  },
  
  // Multi-user configuration
  MULTI_USER: {
    enabled: true,
    defaultUserId: 'default_user_001',
    userContextHeader: 'X-User-ID'
  },

  // Feature flags
  FEATURES: {
    enableSettings: true,
    enableContentManagement: true,
    enablePlaylistManagement: true,
    enableEmergencyMessages: true,
    enableAuth: true,
    enableMultiUser: true
  },
  
  // Media configuration
  MEDIA: {
    FOLDER_ID: '38435000000022100' // Catalyst folder ID for media uploads
  }
};

// Export individual values for direct import
export const { API_BASE_URL, API_ENDPOINTS, DEFAULT_SETTINGS, UI, ZOHO_OAUTH, MULTI_USER, FEATURES, MEDIA } = config;

// Helper function to get Catalyst authentication headers
export const getCatalystAuthHeaders = (userId = null) => {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Add user context header if multi-user is enabled and userId is provided
  if (config.MULTI_USER.enabled && userId) {
    headers[config.MULTI_USER.userContextHeader] = userId;
  }
  
  return headers;
};

// Helper function to build full API URLs
export const getApiUrl = (endpoint) => {
  return `${config.API_BASE_URL}${endpoint}`;
};

export default config;
