import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ContentPlayer from './components/ContentPlayer';
import EmergencyOverlay from './components/EmergencyOverlay';
import StatusBar from './components/StatusBar';
import ContentPreloader from './components/ContentPreloader';
import LoadingScreen from './components/LoadingScreen';

/*
 * DIGITAL SIGNAGE TV PLAYER - CONTENT PRIORITY ORDER (FIXED):
 * 
 * 1. EMERGENCY MESSAGES (Highest Priority - Overrides everything)
 * 2. ACTIVE PLAYLISTS (Admin-set active playlists - Single Source of Truth)
 * 3. SCHEDULED PLAYLISTS (Time-based scheduled playlists)
 * 4. ZOHO CLIQ MESSAGES (Default fallback content - latest messages)
 * 5. GENERAL CONTENT (Individual content items)
 * 6. NO CONTENT MESSAGE (When nothing else is available)
 * 
 * SINGLE SOURCE OF TRUTH: Admin-set active playlists OVERRIDE everything except emergencies.
 * When no active playlist is set, system falls back to default Cliq messages.
 */

// API Configuration
const PROJECT_ID = '17550000000010120';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// API helper function
const GATEWAY_BASE = 'https://atrium-60045083855.development.catalystserverless.in';
  const callCatalystFunction = async (functionName, data = {}) => {
    // Real API calls via development proxy
    try {
      const response = await fetch(`http://localhost:3001/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error);
      throw error; // Don't fall back to mock data - let the error propagate
    }
  };



function App() {
  const [currentContent, setCurrentContent] = useState(null);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const currentContentIndexRef = useRef(0); // Add ref to track current index
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
  const fetchContentTimeoutRef = useRef(null); // Add timeout ref to prevent multiple calls
  const isContentChangingRef = useRef(false); // Add flag to prevent multiple content changes

  useEffect(() => {
    // Initialize the player
    initializePlayer();
    
    // Set up polling for content, emergency messages, and settings
    const contentInterval = setInterval(fetchContent, 30000); // Every 30 seconds for real-time Cliq content refresh
    const emergencyInterval = setInterval(fetchEmergencyMessages, 30000); // Every 30 seconds for emergency messages
    const settingsInterval = setInterval(fetchDisplaySettings, 300000); // Every 5 minutes for settings refresh
    
    return () => {
      clearInterval(contentInterval);
      clearInterval(emergencyInterval);
      clearInterval(settingsInterval);
      // Clear any pending fetchContent timeout
      if (fetchContentTimeoutRef.current) {
        clearTimeout(fetchContentTimeoutRef.current);
        fetchContentTimeoutRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDisplaySettings = async () => {
    // Settings function removed - use default settings
    console.log('🔧 [TV Player] Using default display settings (settings function removed)');
    // Keep default settings as they are already initialized
  };

  // Helper function to apply default timer logic to content
  const applyDefaultTimer = (content) => {
    if (!content) return content;

    const settings = displaySettings;
    let duration = content.duration || content.display_duration;

    // Ultra-simple logic: use content duration if set, otherwise use universal default
    if (!duration || duration <= 0) {
      // Everything uses the same universal default timer
      duration = settings.default_slide_timer;
      console.log(`🔧 [TV Player] Applied universal default timer: ${duration}s`);
    } else {
      // Content has its own duration, keep it
      console.log(`🔧 [TV Player] Using content-specific timer: ${duration}s`);
    }

    return {
      ...content,
      duration: duration
    };
  };

  const initializePlayer = async () => {
    try {
      // Test connection to backend by calling the content function (which works)
      const testResponse = await callCatalystFunction('content', { action: 'getAll' });
      
      if (testResponse.success !== undefined) {
        setIsConnected(true);
        console.log('Successfully connected to Catalyst backend via content endpoint');
      } else {
        throw new Error('Invalid response from backend');
      }
      
      // Fetch display settings
      await fetchDisplaySettings();
      
      // Get initial content
      await fetchContent();
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize player:', error);
      setIsConnected(false);
      setLoading(false);
      
      // Set fallback content when disconnected
      setCurrentContent({
        id: Date.now(),
        type: 'text',
        text: 'Unable to connect to the content server. Please check your connection.',
        title: 'Connection Error',
        duration: displaySettings.default_slide_timer || 10,
        source: 'error'
      });
    }
  };

  const fetchContent = async () => {
    // Prevent multiple simultaneous calls
    if (fetchContentTimeoutRef.current) {
      console.log('🔍 [TV Player] fetchContent already in progress, skipping...');
      return;
    }
    
    console.log('🔍 [TV Player] Starting fetchContent with CORRECT priority order...');
    
    fetchContentTimeoutRef.current = setTimeout(() => {
      fetchContentTimeoutRef.current = null;
    }, 2000); // 2 second debounce to be safer
    
    try {
      // PRIORITY 1: Check for ACTIVE PLAYLISTS first (Admin Override)
      console.log('🔍 [TV Player] 1. Checking for active playlists...');
      const playlistResponse = await callCatalystFunction('playlist', { action: 'getAll' });
      
      if (playlistResponse.success && playlistResponse.playlists && playlistResponse.playlists.length > 0) {
        // Find ONLY active playlists
        const activePlaylists = playlistResponse.playlists.filter(p => {
          const playlistData = p.playlists || p;
          return playlistData.is_active === true;
        });
        
        if (activePlaylists.length > 0) {
          // Use the first active playlist (admin override)
          const activePlaylist = activePlaylists[0];
          const playlistData = activePlaylist.playlists || activePlaylist;
          setCurrentPlaylist(playlistData);
          
          console.log('🔍 [TV Player] ✅ ACTIVE PLAYLIST FOUND:', playlistData.name, 'Duration:', playlistData.duration, 'seconds');
          
          if (playlistData && playlistData.items) {
            let playlistItems;
            try {
              playlistItems = typeof playlistData.items === 'string' 
                ? JSON.parse(playlistData.items) 
                : playlistData.items;
            } catch (e) {
              console.error('🔍 [TV Player] Error parsing playlist items:', e);
              playlistItems = [];
            }
            
            if (playlistItems.length > 0) {
              // Get the next item in sequence using ref for reliable tracking
              const currentIndex = currentContentIndexRef.current;
              const nextIndex = (currentIndex + 1) % playlistItems.length;
              const nextItem = playlistItems[nextIndex];
              
              console.log('🔍 [TV Player] Cycling active playlist - Current index:', currentIndex, 'Next index:', nextIndex);
              
              // Update both state and ref
              setCurrentContentIndex(nextIndex);
              currentContentIndexRef.current = nextIndex;
              
              // Get media details
              const mediaResponse = await callCatalystFunction('media-upload', { action: 'listMedia' });
              
              if (mediaResponse.success && mediaResponse.media) {
                // Find the media object for this playlist item
                const mediaObject = mediaResponse.media.find(m => 
                  m.ROWID === nextItem.id || 
                  m.ROWID === nextItem.media_object_id || 
                  m.file_name === nextItem.name ||
                  m.file_name === nextItem.file_name
                );
                
                if (mediaObject) {
                  // Reset skip count on successful media object found
                  window.playlistSkipCount = 0;
                  
                  const content = {
                    id: mediaObject.ROWID || Date.now(),
                    type: mediaObject.mime_type?.startsWith('video/') ? 'video' : 'image',
                    url: mediaObject.object_url,
                    duration: playlistData.duration || nextItem.duration || 10, // Use playlist duration first
                    title: mediaObject.file_name || nextItem.name || nextItem.title || 'Digital Signage Content',
                    source: 'playlist' // Mark as playlist content (not Zoho CLiq)
                  };
                  
                  console.log('🔍 [TV Player] ✅ SHOWING ACTIVE PLAYLIST CONTENT:', content.title, 'Duration:', content.duration, 'seconds');
                  
                  // Prevent multiple content changes
                  if (isContentChangingRef.current) {
                    console.log('🔍 [TV Player] Content change already in progress, skipping...');
                    return;
                  }
                  
                  isContentChangingRef.current = true;
                  setCurrentContent(applyDefaultTimer(content));
                  
                  // Reset the flag after a short delay
                  setTimeout(() => {
                    isContentChangingRef.current = false;
                  }, 1000);
                  
                  return;
                } else {
                  console.warn('🔍 [TV Player] Media object not found for playlist item:', nextItem);
                  
                  // Add safety mechanism to prevent infinite loops
                  if (!window.playlistSkipCount) window.playlistSkipCount = 0;
                  window.playlistSkipCount++;
                  
                  if (window.playlistSkipCount > playlistItems.length * 2) {
                    console.error('🔍 [TV Player] Too many failed attempts, creating fallback content');
                    window.playlistSkipCount = 0;
                    
                    // Create fallback content for content without media objects
                    const fallbackContent = {
                      id: nextItem.id || Date.now(),
                      type: 'text',
                      text: `Content: ${nextItem.title || nextItem.name || 'Digital Signage Content'}`,
                      title: nextItem.title || nextItem.name || 'Digital Signage Content',
                      duration: playlistData.duration || nextItem.duration || 10,
                      source: 'playlist-fallback'
                    };
                    
                    console.log('🔍 [TV Player] ✅ SHOWING FALLBACK CONTENT:', fallbackContent.title);
                    
                    // Prevent multiple content changes
                    if (isContentChangingRef.current) {
                      console.log('🔍 [TV Player] Content change already in progress, skipping...');
                      return;
                    }
                    
                    isContentChangingRef.current = true;
                    setCurrentContent(applyDefaultTimer(fallbackContent));
                    
                    // Reset the flag after a short delay
                    setTimeout(() => {
                      isContentChangingRef.current = false;
                    }, 1000);
                    
                    return;
                  } else {
                    // Skip this item and try the next one
                    setTimeout(() => fetchContent(), 100);
                    return;
                  }
                }
              }
            } else {
              console.log('🔍 [TV Player] Active playlist is empty, falling back to next priority...');
            }
          }
        }
      }
      
      // PRIORITY 2: Check for SCHEDULED PLAYLISTS (Time-based)
      console.log('🔍 [TV Player] 2. Checking for scheduled playlists...');
      const scheduledResponse = await callCatalystFunction('playlist', { action: 'getScheduled' });
      
      if (scheduledResponse.success && scheduledResponse.playlists && scheduledResponse.playlists.length > 0) {
        console.log('🔍 [TV Player] ✅ SCHEDULED PLAYLIST FOUND, using first scheduled playlist');
        const activePlaylist = scheduledResponse.playlists[0];
        const playlistData = activePlaylist.playlists || activePlaylist;
        setCurrentPlaylist(playlistData);
        // ... (implement scheduled playlist logic similar to active playlist)
        console.log('🔍 [TV Player] Scheduled playlist handling - TODO: implement if needed');
      }
      
      // PRIORITY 3: DEFAULT FALLBACK IMAGE (Fallback)
      console.log('🔍 [TV Player] 3. No active/scheduled playlists, showing default fallback image...');
      try {
        const fallbackResponse = await callCatalystFunction('content', { action: 'getDefaultFallbackImage' });
        
        if (fallbackResponse.success && fallbackResponse.fallbackImage) {
          const fallbackImage = fallbackResponse.fallbackImage;
          console.log('🔍 [TV Player] ✅ SHOWING DEFAULT FALLBACK IMAGE:', fallbackImage.title);
          
          const content = {
            id: fallbackImage.id,
            type: fallbackImage.type,
            url: fallbackImage.url,
            title: fallbackImage.title,
            duration: fallbackImage.duration,
            source: fallbackImage.source
          };
          
          setCurrentContent(applyDefaultTimer(content));
          return;
        }
      } catch (fallbackError) {
        console.log('🔍 [TV Player] Default fallback image not available, trying Cliq messages...');
      }
      
      // PRIORITY 3.5: CLIQ MESSAGES (Secondary Fallback)
      console.log('🔍 [TV Player] 3.5. Trying Cliq messages as secondary fallback...');
      try {
        const cliqResponse = await callCatalystFunction('content', { action: 'getLiveCliqMessages', limit: 10 });
        
        if (cliqResponse.success && cliqResponse.playlist) {
          // Use the default "Zoho Cliq Content" playlist
          const playlistData = cliqResponse.playlist;
          console.log('🔍 [TV Player] ✅ USING DEFAULT ZOHO CLIQ CONTENT PLAYLIST:', playlistData.name);
          
          setCurrentPlaylist(playlistData);
          
          if (playlistData && playlistData.items) {
            let playlistItems;
            try {
              playlistItems = typeof playlistData.items === 'string' 
                ? JSON.parse(playlistData.items) 
                : playlistData.items;
            } catch (e) {
              console.error('🔍 [TV Player] Error parsing Cliq playlist items:', e);
              playlistItems = [];
            }
            
            if (playlistItems.length > 0) {
              // Get the next item in sequence
              const currentIndex = currentContentIndexRef.current;
              const nextIndex = (currentIndex + 1) % playlistItems.length;
              const nextItem = playlistItems[nextIndex];
              
              console.log('🔍 [TV Player] Cycling Cliq playlist - Current index:', currentIndex, 'Next index:', nextIndex);
              
              // Update indices
              setCurrentContentIndex(nextIndex);
              currentContentIndexRef.current = nextIndex;
              
              // Get media details
              const mediaResponse = await callCatalystFunction('media-upload', { action: 'listMedia' });
              
              if (mediaResponse.success && mediaResponse.media) {
                const mediaObject = mediaResponse.media.find(m => 
                  m.ROWID === nextItem.media_object_id || 
                  m.ROWID === nextItem.id ||
                  m.file_name === nextItem.name ||
                  m.file_name === nextItem.file_name
                );
                
                if (mediaObject) {
                  const content = {
                    id: mediaObject.ROWID || Date.now(),
                    type: mediaObject.mime_type?.startsWith('video/') ? 'video' : 'image',
                    url: mediaObject.object_url,
                    duration: playlistData.duration || 15,
                    title: mediaObject.file_name || nextItem.name || nextItem.title || 'Zoho Cliq Content',
                    source: 'zoho_cliq_playlist'
                  };
                  
                  console.log('🔍 [TV Player] ✅ SHOWING CLIQ PLAYLIST CONTENT:', content.title);
                  setCurrentContent(applyDefaultTimer(content));
                  return;
                } else {
                  console.warn('🔍 [TV Player] Media object not found for Cliq playlist item:', nextItem);
                  // Fall through to next priority
                }
              }
            } else {
              console.log('🔍 [TV Player] Cliq playlist is empty, falling back to next priority...');
            }
          }
        } else if (cliqResponse.success && cliqResponse.files && cliqResponse.files.length > 0) {
          // Fallback to old Cliq messages format
          console.log('🔍 [TV Player] Using legacy Cliq messages format');
          const currentContentId = currentContent?.id;
          const sortedMessages = cliqResponse.files.sort((a, b) => 
            new Date(b.CREATEDTIME || b.created_at || b.timestamp || 0) - 
            new Date(a.CREATEDTIME || a.created_at || a.timestamp || 0)
          );
          
          let nextItem;
          if (currentContentId && currentContent?.source === 'zoho_cliq') {
            const currentIndex = currentContentIndexRef.current;
            const nextIndex = (currentIndex + 1) % cliqResponse.files.length;
            nextItem = cliqResponse.files[nextIndex];
          } else {
            nextItem = sortedMessages[0];
          }
          
          console.log('🔍 [TV Player] Showing legacy Cliq message:', nextItem.title || nextItem.content);
          
          const selectedIndex = cliqResponse.files.findIndex(item => 
            (item.ROWID || item.id) === (nextItem.ROWID || nextItem.id)
          );
          setCurrentContentIndex(selectedIndex >= 0 ? selectedIndex : 0);
          currentContentIndexRef.current = selectedIndex >= 0 ? selectedIndex : 0;
          
          const content = {
            id: nextItem.ROWID || Date.now(),
            type: 'text',
            text: nextItem.content || nextItem.title || 'Zoho Cliq Message',
            title: nextItem.title || 'Zoho Cliq',
            duration: 15,
            source: 'zoho_cliq',
            url: null,
            CREATEDTIME: nextItem.CREATEDTIME || nextItem.created_at || nextItem.timestamp
          };
          
          setCurrentContent(applyDefaultTimer(content));
          return;
        }
      } catch (cliqError) {
        console.log('🔍 [TV Player] 4. Cliq messages not available, trying general content...');
      }
      
      // PRIORITY 4: GENERAL CONTENT (Fallback)
      try {
        const contentResponse = await callCatalystFunction('content', { action: 'getAll' });
        
        if (contentResponse.success && contentResponse.files && contentResponse.files.length > 0) {
          // Filter for active content and sort by creation time (newest first)
          const activeContent = contentResponse.files
            .filter(item => item.is_active === true)
            .sort((a, b) => new Date(b.CREATEDTIME || b.createdtime || 0) - new Date(a.CREATEDTIME || a.createdtime || 0));
          
          if (activeContent.length > 0) {
            // Get the next content item in sequence
            const currentIndex = currentContentIndexRef.current;
            const nextIndex = (currentIndex + 1) % activeContent.length;
            const nextItem = activeContent[nextIndex];
            
            console.log('🔍 [TV Player] ✅ SHOWING GENERAL CONTENT:', nextItem.title);
            
            // Update indices
            setCurrentContentIndex(nextIndex);
            currentContentIndexRef.current = nextIndex;
            
            const content = {
              id: nextItem.ROWID || Date.now(),
              type: 'text',
              text: nextItem.content || nextItem.description || nextItem.title || 'Digital Signage Message',
              title: nextItem.title || 'Digital Signage',
              duration: 8,
              source: nextItem.source || 'content',
              url: null,
              CREATEDTIME: nextItem.CREATEDTIME || nextItem.created_at || nextItem.timestamp
            };
            
            setCurrentContent(applyDefaultTimer(content));
            return;
          }
        }
      } catch (contentError) {
        console.log('🔍 [TV Player] General content not available...');
      }
      
      // PRIORITY 5: NO CONTENT AVAILABLE
      console.log('🔍 [TV Player] ❌ NO CONTENT AVAILABLE - showing fallback message');
      setCurrentContent(applyDefaultTimer({
        id: Date.now(),
        type: 'text',
        text: 'No content available at this time. Please check your content management system.',
        title: 'No Content Available',
        duration: 10,
        source: 'fallback'
      }));
      
    } catch (error) {
      console.error('Error fetching content:', error);
      setAppError(error.message);
        
      // Retry logic for connection issues
      if (connectionRetries < 3) {
        setConnectionRetries(prev => prev + 1);
        setTimeout(() => {
          console.log(`🔍 [TV Player] Retrying connection (${connectionRetries + 1}/3)...`);
          fetchContent();
        }, 5000); // Retry after 5 seconds
      } else {
        // Fallback content on error after retries
        setCurrentContent(applyDefaultTimer({
          id: Date.now(),
          type: 'text',
          text: 'Connection error. Please check your network connection.',
          title: 'Connection Error',
          duration: 10,
          source: 'error'
        }));
      }
    } finally {
      // Clear the timeout
      if (fetchContentTimeoutRef.current) {
        clearTimeout(fetchContentTimeoutRef.current);
        fetchContentTimeoutRef.current = null;
      }
    }
  };

  const fetchEmergencyMessages = async () => {
    try {
      const response = await callCatalystFunction('emergency', { action: 'getActive' });
      
      if (response.success && response.messages && response.messages.length > 0) {
        // Get the highest priority active emergency message
        const sortedMessages = response.messages.sort((a, b) => {
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          const aPriority = a.emergency_messages?.importance || 'medium';
          const bPriority = b.emergency_messages?.importance || 'medium';
          return (priorityOrder[bPriority] || 1) - (priorityOrder[aPriority] || 1);
        });
        
        const emergencyMessage = sortedMessages[0];
        
        if (emergencyMessage && emergencyMessage.emergency_messages?.is_active) {
          const emergency = emergencyMessage.emergency_messages;
          setEmergencyMessage({
            id: emergency.ROWID || Date.now(),
            message: emergency.message || emergency.description,
            priority: emergency.importance || 'medium',
            duration: emergency.display_duration || 30
          });
          
          // Clear emergency after its duration
          const duration = (emergency.display_duration || 30) * 1000;
          setTimeout(() => {
            setEmergencyMessage(null);
          }, duration);
        } else {
          setEmergencyMessage(null);
        }
      } else {
        setEmergencyMessage(null);
      }
    } catch (error) {
      console.error('Error fetching emergency messages:', error);
      setEmergencyMessage(null);
    }
  };

  if (loading) {
    return (
      <LoadingScreen 
        message=""
        progress={0}
        showProgress={false}
        type="default"
      />
    );
  }

  // Show error state if there's a persistent error
  if (appError && connectionRetries >= 3) {
    return (
      <LoadingScreen 
        message="Connection Error"
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
      
      {/* No development mode indicator - using real backend only */}
      
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
          message=""
          progress={0}
          showProgress={false}
          type="content"
        />
      )}
    </div>
  );
}

export default App; 