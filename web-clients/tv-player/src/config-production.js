// Production configuration for TV Player
const config = {
  // API Configuration - Production
  PROJECT_ID: '17550000000010120',
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://atrium-60045083855.production.catalystserverless.in',
  
  // API endpoints
  API_ENDPOINTS: {
    auth: '/auth',
    content: '/content',
    playlist: '/playlist',
    emergency: '/emergency',
    zohoIntegration: '/zoho-integration'
  },
  
  // Player settings - Production optimized
  PLAYER: {
    refreshInterval: 30000, // 30 seconds
    maxRetries: 5,
    timeout: 15000,
    imageCacheTime: 3600000, // 1 hour image cache
    emergencyCheckInterval: 10000 // Check for emergencies every 10 seconds
  },
  
  // Display settings
  DISPLAY: {
    defaultSlideDuration: 10, // seconds
    maxSlideDuration: 300, // 5 minutes max
    minSlideDuration: 3, // 3 seconds min
    enableFullscreen: true,
    enableKioskMode: true
  },
  
  // Error handling
  ERROR_HANDLING: {
    maxRetries: 5,
    retryDelay: 2000, // 2 seconds
    fallbackToStatic: true,
    showErrorMessages: false // Don't show errors to end users
  },
  
  // Production features
  FEATURES: {
    enableEmergencyOverlay: true,
    enableStatusBar: true,
    enableContentPreloading: true,
    enableAutoRefresh: true,
    enableOfflineMode: true,
    enableAnalytics: true
  }
};

// Export individual values
export const { 
  PROJECT_ID, 
  API_BASE_URL, 
  API_ENDPOINTS, 
  PLAYER, 
  DISPLAY, 
  ERROR_HANDLING, 
  FEATURES 
} = config;

// Helper function for API calls - Production version
export const callCatalystFunction = async (functionName, data = {}) => {
  try {
    const response = await fetch(`${config.API_BASE_URL}/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Digital-Signage-TV-Player/1.0.0'
      },
      body: JSON.stringify({ data }),
      timeout: config.PLAYER.timeout
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }
};

// Production environment detection
export const isProduction = () => {
  return process.env.NODE_ENV === 'production' || 
         process.env.REACT_APP_ENVIRONMENT === 'production';
};

// Helper function to get optimized image URL for production
export const getOptimizedImageUrl = (url) => {
  if (!url) return url;
  
  // In production, we can use direct URLs since CORS is handled by the backend
  // Or use a production image proxy if needed
  if (url.includes('zohostratus.com') || url.includes('atrium-media')) {
    // For production, you might want to use a CDN or image optimization service
    return url;
  }
  
  return url;
};

export default config;
