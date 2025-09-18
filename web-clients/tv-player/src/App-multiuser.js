import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ContentPlayer from './components/ContentPlayer';
import EmergencyOverlay from './components/EmergencyOverlay';
import StatusBar from './components/StatusBar';
import ContentPreloader from './components/ContentPreloader';
import LoadingScreen from './components/LoadingScreen';

/*
 * MULTI-USER DIGITAL SIGNAGE TV PLAYER
 * 
 * This TV player supports multiple users/organizations by:
 * 1. Using a unique TV_PLAYER_USER_ID or TV_PLAYER_LOCATION_ID
 * 2. Filtering all content by user/location
 * 3. Ensuring data isolation between different TV players
 * 
 * CONTENT PRIORITY ORDER (User-Specific):
 * 1. EMERGENCY MESSAGES (User-specific emergencies)
 * 2. ACTIVE PLAYLISTS (User's active playlists)
 * 3. SCHEDULED PLAYLISTS (User's scheduled content)
 * 4. ZOHO CLIQ MESSAGES (User's Cliq messages)
 * 5. GENERAL CONTENT (User's general content)
 * 6. NO CONTENT MESSAGE (When user has no content)
 */

// TV Player Configuration - MUST be set for each TV player
const TV_PLAYER_USER_ID = process.env.REACT_APP_TV_PLAYER_USER_ID;
const TV_PLAYER_LOCATION_ID = process.env.REACT_APP_TV_PLAYER_LOCATION_ID;
const TV_PLAYER_API_KEY = process.env.REACT_APP_TV_PLAYER_API_KEY;

// API Configuration
const PROJECT_ID = '17550000000010120';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Validate TV Player Configuration
const validateTVPlayerConfig = () => {
  const hasUserId = !!TV_PLAYER_USER_ID;
  const hasLocationId = !!TV_PLAYER_LOCATION_ID;
  const hasApiKey = !!TV_PLAYER_API_KEY;
  
  if (!hasUserId && !hasLocationId) {
    console.error('❌ TV Player Configuration Error: Either TV_PLAYER_USER_ID or TV_PLAYER_LOCATION_ID must be set');
    return false;
  }
  
  if (!hasApiKey) {
    console.warn('⚠️ TV Player Warning: TV_PLAYER_API_KEY not set - using unauthenticated mode');
  }
  
  console.log('🔧 TV Player Configuration:', {
    user_id: TV_PLAYER_USER_ID,
    location_id: TV_PLAYER_LOCATION_ID,
    has_api_key: hasApiKey
  });
  
  return true;
};

// API helper function with user/location context
const callCatalystFunction = async (functionName, data = {}) => {
  // Add user/location context to all API calls
  const requestData = {
    ...data,
    // Add user identification
    ...(TV_PLAYER_USER_ID && { user_id: TV_PLAYER_USER_ID }),
    ...(TV_PLAYER_LOCATION_ID && { location_id: TV_PLAYER_LOCATION_ID })
  };
  
  // Build headers with authentication
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Add API key authentication if available
  if (TV_PLAYER_API_KEY) {
    headers['X-TV-Player-API-Key'] = TV_PLAYER_API_KEY;
  }
  
  // Add user identification header
  if (TV_PLAYER_USER_ID) {
    headers['X-TV-Player-User-ID'] = TV_PLAYER_USER_ID;
  }
  
  if (TV_PLAYER_LOCATION_ID) {
    headers['X-TV-Player-Location-ID'] = TV_PLAYER_LOCATION_ID;
  }
  
  try {
    console.log(`🔍 [TV Player] Calling ${functionName} with context:`, {
      user_id: TV_PLAYER_USER_ID,
      location_id: TV_PLAYER_LOCATION_ID
    });
    
    const response = await fetch(`http://localhost:3001/${functionName}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ data: requestData })
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }
};

function App() {
  const [currentContent, setCurrentContent] = useState(null);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const currentContentIndexRef = useRef(0);
  const [emergencyMessage, setEmergencyMessage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appError, setAppError] = useState(null);
  const [connectionRetries, setConnectionRetries] = useState(0);
  const [displaySettings, setDisplaySettings] = useState({
    default_slide_timer: 10,
    cliq_message_min_duration: 5,
    cliq_message_max_duration: 30,
    emergency_message_default_duration: 30,
    enable_default_timer_override: true
  });
  const fetchContentTimeoutRef = useRef(null);
  const isContentChangingRef = useRef(false);

  useEffect(() => {
    // Validate configuration before starting
    if (!validateTVPlayerConfig()) {
      setAppError('TV Player configuration error. Please check environment variables.');
      setLoading(false);
      return;
    }
    
    // Initialize the player
    initializePlayer();
    
    // Set up polling for content, emergency messages, and settings
    const contentInterval = setInterval(fetchContent, 30000);
    const emergencyInterval = setInterval(fetchEmergencyMessages, 30000);
    const settingsInterval = setInterval(fetchDisplaySettings, 300000);
    
    return () => {
      clearInterval(contentInterval);
      clearInterval(emergencyInterval);
      clearInterval(settingsInterval);
      if (fetchContentTimeoutRef.current) {
        clearTimeout(fetchContentTimeoutRef.current);
        fetchContentTimeoutRef.current = null;
      }
    };
  }, []);

  const fetchDisplaySettings = async () => {
    try {
      console.log('🔧 [TV Player] Fetching display settings for user/location...');
      const response = await callCatalystFunction('settings', { action: 'getDisplaySettings' });
      
      if (response.success && response.settings) {
        setDisplaySettings(prev => ({
          ...prev,
          ...response.settings
        }));
        console.log('🔧 [TV Player] Settings updated:', response.settings);
      }
    } catch (error) {
      console.error('🔧 [TV Player] Error fetching settings:', error);
    }
  };

  const fetchEmergencyMessages = async () => {
    try {
      console.log('🚨 [TV Player] Fetching emergency messages for user/location...');
      const response = await callCatalystFunction('emergency', { action: 'getActive' });
      
      if (response.success && response.emergencies && response.emergencies.length > 0) {
        const activeEmergency = response.emergencies[0];
        setEmergencyMessage({
          message: activeEmergency.message,
          priority: activeEmergency.priority || 'high'
        });
        console.log('🚨 [TV Player] Active emergency message:', activeEmergency.message);
      } else {
        setEmergencyMessage(null);
      }
    } catch (error) {
      console.error('🚨 [TV Player] Error fetching emergency messages:', error);
    }
  };

  const initializePlayer = async () => {
    console.log('🚀 [TV Player] Initializing multi-user TV player...');
    setLoading(true);
    
    try {
      // Fetch initial content and settings
      await Promise.all([
        fetchContent(),
        fetchEmergencyMessages(),
        fetchDisplaySettings()
      ]);
      
      setIsConnected(true);
      setAppError(null);
      setConnectionRetries(0);
      console.log('✅ [TV Player] Initialization complete');
    } catch (error) {
      console.error('❌ [TV Player] Initialization failed:', error);
      setAppError(error.message);
      setConnectionRetries(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const fetchContent = async () => {
    if (isContentChangingRef.current) {
      console.log('🔍 [TV Player] Content change in progress, skipping fetch');
      return;
    }

    try {
      console.log('🔍 [TV Player] Fetching content for user/location...');
      
      // Fetch user/location-specific playlists
      const playlistResponse = await callCatalystFunction('playlist', { action: 'getActive' });
      
      if (playlistResponse.success && playlistResponse.playlists && playlistResponse.playlists.length > 0) {
        // Use the first active playlist for this user/location
        const activePlaylist = playlistResponse.playlists[0];
        setCurrentPlaylist(activePlaylist);
        
        console.log('🔍 [TV Player] ✅ ACTIVE PLAYLIST FOUND for user/location:', activePlaylist.name);
        
        if (activePlaylist && activePlaylist.items) {
          let playlistItems;
          try {
            playlistItems = typeof activePlaylist.items === 'string' 
              ? JSON.parse(activePlaylist.items) 
              : activePlaylist.items;
          } catch (e) {
            console.error('🔍 [TV Player] Error parsing playlist items:', e);
            playlistItems = [];
          }
          
          if (playlistItems.length > 0) {
            // Get the next item in the playlist
            const nextIndex = currentContentIndexRef.current % playlistItems.length;
            const nextContent = playlistItems[nextIndex];
            
            if (nextContent) {
              setCurrentContent(nextContent);
              setCurrentContentIndex(nextIndex);
              currentContentIndexRef.current = nextIndex + 1;
              console.log('🔍 [TV Player] Content updated from playlist:', nextContent.title);
              return;
            }
          }
        }
      }
      
      // Fallback: Fetch user/location-specific Cliq messages
      console.log('🔍 [TV Player] No active playlist, fetching Cliq messages for user/location...');
      const cliqResponse = await callCatalystFunction('zoho-integration', { action: 'getLatestMessages' });
      
      if (cliqResponse.success && cliqResponse.messages && cliqResponse.messages.length > 0) {
        const latestMessage = cliqResponse.messages[0];
        setCurrentContent({
          id: `cliq-${latestMessage.id}`,
          title: 'Zoho Cliq Message',
          text: latestMessage.message,
          type: 'text',
          source: 'zoho_cliq',
          duration: Math.max(displaySettings.cliq_message_min_duration, 
                           Math.min(displaySettings.cliq_message_max_duration, 
                                   latestMessage.message.length / 10)),
          CREATEDTIME: latestMessage.timestamp
        });
        console.log('🔍 [TV Player] Content updated from Cliq:', latestMessage.message.substring(0, 50));
        return;
      }
      
      // Final fallback: Show no content message
      setCurrentContent({
        id: 'no-content',
        title: 'No Content Available',
        text: `No content configured for this TV player.\nUser ID: ${TV_PLAYER_USER_ID || 'Not set'}\nLocation ID: ${TV_PLAYER_LOCATION_ID || 'Not set'}`,
        type: 'text',
        duration: 10
      });
      console.log('🔍 [TV Player] No content available for user/location');
      
    } catch (error) {
      console.error('🔍 [TV Player] Error fetching content:', error);
      setAppError(error.message);
      setConnectionRetries(prev => prev + 1);
    }
  };

  // Show loading screen during initialization
  if (loading) {
    return (
      <LoadingScreen 
        message="Initializing TV Player..."
        progress={0}
        showProgress={false}
        type="content"
      />
    );
  }

  // Show error state if there's a persistent error
  if (appError && connectionRetries >= 3) {
    return (
      <LoadingScreen 
        message={`Connection Error: ${appError}`}
        progress={0}
        showProgress={false}
        type="error"
      />
    );
  }

  return (
    <div className="fullscreen bg-black">
      {/* Status Bar */}
      <StatusBar isConnected={isConnected} />
      
      {/* User/Location Info (Development only) */}
      {IS_DEVELOPMENT && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          <div>User ID: {TV_PLAYER_USER_ID || 'Not set'}</div>
          <div>Location ID: {TV_PLAYER_LOCATION_ID || 'Not set'}</div>
          <div>API Key: {TV_PLAYER_API_KEY ? 'Set' : 'Not set'}</div>
        </div>
      )}
      
      {/* Emergency Overlay */}
      {emergencyMessage && (
        <EmergencyOverlay 
          message={emergencyMessage.message}
          priority={emergencyMessage.priority}
        />
      )}
      
      {/* Content Preloader */}
      <ContentPreloader 
        playlist={currentPlaylist}
        currentIndex={currentContentIndex}
      />
      
      {/* Content Player */}
      {currentContent && !emergencyMessage && (
        <ContentPlayer 
          content={currentContent}
          onContentEnd={() => fetchContent()}
        />
      )}
      
      {/* No Content Fallback */}
      {!currentContent && !emergencyMessage && (
        <LoadingScreen 
          message="Loading content..."
          progress={0}
          showProgress={false}
          type="content"
        />
      )}
    </div>
  );
}

export default App;
