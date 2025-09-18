// Smart configuration for TV Player that automatically switches between environments
import devConfig from './App.js'; // Import the existing config from App.js
import prodConfig from './config-production.js';

// Environment detection
const isDevelopment = () => {
  return process.env.NODE_ENV === 'development' || 
         process.env.REACT_APP_ENVIRONMENT === 'development' ||
         window.location.hostname === 'localhost';
};

const isProduction = () => {
  return process.env.NODE_ENV === 'production' || 
         process.env.REACT_APP_ENVIRONMENT === 'production' ||
         window.location.hostname.includes('vercel.app') ||
         window.location.hostname.includes('catalystserverless.in') ||
         window.location.hostname.includes('your-domain.com');
};

// Smart config selection
const getConfig = () => {
  if (isProduction()) {
    console.log('🏭 Using PRODUCTION configuration');
    return prodConfig;
  } else {
    console.log('🛠️ Using DEVELOPMENT configuration');
    // Return development config structure
    return {
      PROJECT_ID: devConfig.PROJECT_ID || '17550000000010120',
      API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://atrium-60045083855.development.catalystserverless.in',
      IS_DEVELOPMENT: devConfig.IS_DEVELOPMENT || true,
      GATEWAY_BASE: devConfig.GATEWAY_BASE || 'https://atrium-60045083855.development.catalystserverless.in',
      callCatalystFunction: devConfig.callCatalystFunction
    };
  }
};

// Get the appropriate configuration
const config = getConfig();

// Add environment info to config
config.ENVIRONMENT = {
  isDevelopment: isDevelopment(),
  isProduction: isProduction(),
  nodeEnv: process.env.NODE_ENV,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server'
};

// Log configuration for debugging (only in development)
if (isDevelopment()) {
  console.log('🔧 TV Player configuration loaded:', {
    environment: config.ENVIRONMENT.isProduction ? 'PRODUCTION' : 'DEVELOPMENT',
    apiBaseUrl: config.API_BASE_URL || config.GATEWAY_BASE,
    projectId: config.PROJECT_ID
  });
}

export default config;
export const { 
  PROJECT_ID, 
  API_BASE_URL, 
  GATEWAY_BASE, 
  IS_DEVELOPMENT, 
  callCatalystFunction,
  ENVIRONMENT 
} = config;

// Helper function for optimized image URLs
export const getOptimizedImageUrl = (url) => {
  if (!url) return url;
  
  // In development, use proxy for CORS
  if (isDevelopment()) {
    if (url.includes('zohostratus.com') || url.includes('atrium-media') || url.startsWith('https://')) {
      return `http://localhost:3001/proxy-image?url=${encodeURIComponent(url)}`;
    }
  }
  
  // In production, use direct URLs or CDN
  return url;
};
