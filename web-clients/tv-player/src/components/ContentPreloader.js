import React, { useEffect, useRef, useState } from 'react';

const ContentPreloader = ({ playlist, currentIndex }) => {
  const [preloadedContent, setPreloadedContent] = useState(new Set());
  const preloadQueueRef = useRef([]);
  const isPreloadingRef = useRef(false);

  // Optimize image URL for better performance
  const optimizeImageUrl = (url, type = 'image') => {
    if (!url) return url;
    
    // For Zoho Stratus URLs, return the original URL without optimization parameters
    // Zoho Stratus doesn't support URL-based optimization parameters
    if (url.includes('zohostratus.com') || url.includes('atrium-media')) {
      return url; // Return original URL without modification
    }
    
    // For other URLs, you could add optimization parameters if supported
    // For now, return the original URL
    return url;
  };

  // Preload a single content item
  const preloadContentItem = async (content) => {
    if (!content || !content.url) return false;
    
    const optimizedUrl = optimizeImageUrl(content.url, content.type);
    
    return new Promise((resolve) => {
      if (content.type === 'image') {
        const img = new Image();
        
        img.onload = () => {
          console.log('✅ Preloaded:', content.name || content.url);
          setPreloadedContent(prev => new Set([...prev, content.url]));
          resolve(true);
        };
        
        img.onerror = () => {
          console.warn('⚠️ Failed to preload:', content.name || content.url);
          resolve(false);
        };
        
        // Set a timeout to prevent hanging
        const timeout = setTimeout(() => {
          console.warn('⏰ Preload timeout for:', content.name || content.url);
          resolve(false);
        }, 10000); // 10 second timeout
        
        img.onload = () => {
          clearTimeout(timeout);
          console.log('✅ Preloaded:', content.name || content.url);
          setPreloadedContent(prev => new Set([...prev, content.url]));
          resolve(true);
        };
        
        img.onerror = () => {
          clearTimeout(timeout);
          console.warn('⚠️ Failed to preload:', content.name || content.url);
          resolve(false);
        };
        
        img.src = optimizedUrl;
      } else if (content.type === 'video') {
        // For videos, we'll just preload the metadata
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        const timeout = setTimeout(() => {
          console.warn('⏰ Video preload timeout for:', content.name || content.url);
          resolve(false);
        }, 5000);
        
        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          console.log('✅ Preloaded video metadata:', content.name || content.url);
          setPreloadedContent(prev => new Set([...prev, content.url]));
          resolve(true);
        };
        
        video.onerror = () => {
          clearTimeout(timeout);
          console.warn('⚠️ Failed to preload video:', content.name || content.url);
          resolve(false);
        };
        
        video.src = content.url;
      } else {
        resolve(false);
      }
    });
  };

  // Process preload queue
  const processPreloadQueue = async () => {
    if (isPreloadingRef.current || preloadQueueRef.current.length === 0) return;
    
    isPreloadingRef.current = true;
    
    while (preloadQueueRef.current.length > 0) {
      const content = preloadQueueRef.current.shift();
      
      // Skip if already preloaded
      if (preloadedContent.has(content.url)) {
        continue;
      }
      
      await preloadContentItem(content);
      
      // Small delay to prevent overwhelming the network
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    isPreloadingRef.current = false;
  };

  // Get upcoming content to preload
  const getUpcomingContent = () => {
    if (!playlist || !playlist.items || currentIndex === undefined) return [];
    
    const items = Array.isArray(playlist.items) ? playlist.items : [];
    const upcoming = [];
    
    // Preload next 3 items
    for (let i = 1; i <= 3; i++) {
      const nextIndex = (currentIndex + i) % items.length;
      const item = items[nextIndex];
      
      if (item && item.url) {
        upcoming.push(item);
      }
    }
    
    return upcoming;
  };

  // Update preload queue when playlist or current index changes
  useEffect(() => {
    const upcomingContent = getUpcomingContent();
    
    // Clear existing queue and add new items
    preloadQueueRef.current = upcomingContent.filter(
      content => !preloadedContent.has(content.url)
    );
    
    // Start processing the queue
    processPreloadQueue();
  }, [playlist, currentIndex, preloadedContent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      preloadQueueRef.current = [];
      isPreloadingRef.current = false;
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default ContentPreloader;
