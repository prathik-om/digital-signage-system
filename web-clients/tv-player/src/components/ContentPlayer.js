import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactPlayer from 'react-player';
import LoadingScreen from './LoadingScreen';

const ContentPlayer = ({ content, onContentEnd }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeLeft, setTimeLeft] = useState(content.duration);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [showLoading, setShowLoading] = useState(true);
  const [fadeState, setFadeState] = useState('fade-in'); // 'fade-in', 'visible', 'fade-out'
  const [retryCount, setRetryCount] = useState(0);
  const [lastImageUrl, setLastImageUrl] = useState(null);
  const [screenInfo, setScreenInfo] = useState({ width: 1920, height: 1080 });
  
  const imageRef = useRef(null);
  const preloadTimeoutRef = useRef(null);

  // Detect screen dimensions for TV optimization
  useEffect(() => {
    const updateScreenInfo = () => {
      setScreenInfo({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    updateScreenInfo();
    window.addEventListener('resize', updateScreenInfo);
    
    return () => window.removeEventListener('resize', updateScreenInfo);
  }, []);

  // Helper function to determine if content is from Zoho CLiq
  const isCliqContent = () => {
    const isCliq = content.source === 'zoho_cliq' || 
                   content.title === 'Zoho Cliq' || 
                   (content.type === 'text' && content.text && !content.url);
    
    console.log('🔍 [ContentPlayer] Content source check:', {
      source: content.source,
      title: content.title,
      type: content.type,
      isCliq: isCliq
    });
    
    return isCliq;
  };

  // Helper function to get optimal image display settings for TV
  const getTVOptimizedImageSettings = () => {
    const { width, height } = screenInfo;
    const isWideScreen = width > height;
    const isHighRes = width >= 1920 || height >= 1080;
    
    // For TV screens, prioritize full coverage while maintaining aspect ratio
    if (isHighRes) {
      return {
        objectFit: 'cover', // Fill the screen completely
        objectPosition: 'center',
        maxWidth: '100vw',
        maxHeight: '100vh',
        width: '100%',
        height: '100%'
      };
    } else {
      // For smaller screens, use contain to show full image
      return {
        objectFit: 'contain',
        objectPosition: 'center',
        maxWidth: '100%',
        maxHeight: '100%',
        width: 'auto',
        height: 'auto'
      };
    }
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return '';
    }
  };

  // Helper function to get single beautiful gradient for appreciation messages
  const getAppreciationGradient = () => {
    // Array of beautiful, professional gradients for appreciation messages
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',  // Purple to Blue
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',  // Pink to Red
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',  // Blue to Cyan
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',  // Green to Turquoise
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',  // Pink to Yellow
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',  // Mint to Pink
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',  // Peach to Coral
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'   // Lavender to Pink
    ];
    
    // Use the message content to generate a consistent color for each unique message
    // This ensures the same message always gets the same color
    const messageHash = content.text ? content.text.length : 0;
    const colorIndex = messageHash % gradients.length;
    
    return gradients[colorIndex];
  };

  // Helper function to determine optimal text color based on background
  const getOptimalTextColor = () => {
    const messageHash = content.text ? content.text.length : 0;
    const colorIndex = messageHash % 8;
    
    // Define which gradients need white text vs black text for optimal readability
    const needsWhiteText = [0, 1, 2, 3, 7]; // Purple-Blue, Pink-Red, Blue-Cyan, Green-Turquoise, Lavender-Pink
    const needsBlackText = [4, 5, 6]; // Pink-Yellow, Mint-Pink, Peach-Coral
    
    return needsWhiteText.includes(colorIndex) ? 'white' : 'black';
  };

  // Image optimization and preloading with CORS proxy
  const optimizeImageUrl = useCallback((url, type = 'image') => {
    if (!url) return url;
    
    // For external URLs (like Zoho Stratus), use our CORS proxy
    if (url.includes('zohostratus.com') || url.includes('atrium-media') || url.startsWith('https://')) {
      // Use the development proxy to avoid CORS issues
      return `http://localhost:3001/proxy-image?url=${encodeURIComponent(url)}`;
    }
    
    // For relative/local URLs, return as-is
    return url;
  }, []);

  // Preload next content
  const preloadContent = useCallback((url, type) => {
    if (!url) return;
    
    const optimizedUrl = optimizeImageUrl(url, type);
    
    if (type === 'image') {
      const img = new Image();
      
      img.onload = () => {
        console.log('✅ Preloaded image:', optimizedUrl);
        setPreloadProgress(100);
      };
      
      img.onerror = () => {
        console.warn('⚠️ Failed to preload image:', optimizedUrl);
        setPreloadProgress(0);
      };
      
      img.src = optimizedUrl;
    }
  }, [optimizeImageUrl]);

  // Handle image retry
  const handleRetry = useCallback(() => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setImageError(false);
      setImageLoading(true);
      setImageLoaded(false);
      setShowLoading(true);
      
      // Force reload the image
      if (imageRef.current) {
        imageRef.current.src = '';
        setTimeout(() => {
          if (imageRef.current) {
            imageRef.current.src = optimizeImageUrl(content.url, content.type);
          }
        }, 100);
      }
    }
  }, [retryCount, content.url, content.type, optimizeImageUrl]);

  useEffect(() => {
    // Only start timer when image is loaded (for images) or immediately (for videos and text)
    if (content.type === 'image' && imageLoading) {
      console.log('🔍 [ContentPlayer] Skipping timer start - image still loading:', content.title);
      return; // Don't start timer until image loads
    }
    
    console.log('🔍 [ContentPlayer] Starting timer for:', content.title, 'Duration:', content.duration, 'TimeLeft:', content.duration);
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        console.log('🔍 [ContentPlayer] Timer tick for:', content.title, 'TimeLeft:', prev);
        if (prev <= 1) {
          console.log('🔍 [ContentPlayer] Timer finished for:', content.title);
          onContentEnd();
          return content.duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      console.log('🔍 [ContentPlayer] Clearing timer for:', content.title);
      clearInterval(timer);
    };
  }, [content.duration, onContentEnd, content.type, imageLoading]);

  // Reset image states when content changes
  useEffect(() => {
    console.log('🔍 [ContentPlayer] Content changed to:', content.title, 'Duration:', content.duration, 'Type:', content.type);
    
    // Start fade out transition
    setFadeState('fade-out');
    
    setTimeout(() => {
      setImageError(false);
      setRetryCount(0);
      setPreloadProgress(0);
      setTimeLeft(content.duration); // Reset timer to new content duration
      
      console.log('🔍 [ContentPlayer] Reset timer to:', content.duration);
      
      // Clear any existing preload timeout
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
      
      // Handle different content types
      if (content.type === 'text') {
        // Text content doesn't need loading
        setImageLoading(false);
        setShowLoading(false);
        setImageLoaded(true);
        setFadeState('visible');
        console.log('🔍 [ContentPlayer] Text content - no loading needed');
      } else if (content.type === 'image') {
        // Image content needs loading
        const isNewImage = content.url !== lastImageUrl;
        if (isNewImage) {
          setImageLoading(true);
          setShowLoading(true);
          setImageLoaded(false);
          setLastImageUrl(content.url);
          console.log('🔄 [ContentPlayer] New image detected, resetting loading state:', content.url);
        } else {
          console.log('🔄 [ContentPlayer] Same image, keeping current state:', content.url);
        }
        setFadeState('fade-in');
      } else if (content.type === 'video') {
        // Video content - minimal loading
        setImageLoading(false);
        setShowLoading(false);
        setImageLoaded(true);
        setFadeState('fade-in');
        console.log('🔍 [ContentPlayer] Video content - minimal loading');
      }
      
      // Only preload if content has a URL (images/videos)
      if (content.url && content.type !== 'text') {
        preloadTimeoutRef.current = setTimeout(() => {
          preloadContent(content.url, content.type);
        }, 100);
      }
    }, 300); // Wait for fade out to complete
    
    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, [content.url, content.duration, content.type, lastImageUrl, preloadContent]);

  const handleVideoEnd = () => {
    onContentEnd();
  };

  const handleVideoError = () => {
    console.error('Video playback error');
    onContentEnd();
  };

  const handleImageLoad = (event) => {
    console.log('✅ Image loaded successfully:', content.url);
    console.log('✅ Image dimensions:', event.target?.naturalWidth, 'x', event.target?.naturalHeight);
    console.log('✅ Image complete:', event.target?.complete);
    console.log('✅ Image src used:', event.target?.src);
    console.log('✅ Image loading state before:', imageLoading);
    
    setImageLoaded(true);
    setImageLoading(false);
    setImageError(false);
    setShowLoading(false);
    
    console.log('✅ Image loading state set to false');
    
    // Complete fade in
    setTimeout(() => {
      setFadeState('visible');
    }, 200);
  };

  const handleImageError = (event) => {
    console.error('❌ Failed to load image:', content.url);
    console.error('❌ Image error event:', event);
    console.error('❌ Image naturalWidth:', event.target?.naturalWidth);
    console.error('❌ Image naturalHeight:', event.target?.naturalHeight);
    console.error('❌ Image complete:', event.target?.complete);
    
    setImageError(true);
    setImageLoading(false);
    setImageLoaded(false);
    setShowLoading(false);
    
    // Retry logic
    if (retryCount < 3) {
      console.log(`🔄 Retrying image load (${retryCount + 1}/3) in 1 second...`);
      setTimeout(() => {
        handleRetry();
      }, 1000);
    } else {
      console.log('❌ All retries failed, moving to next content in 2 seconds...');
      // Move to next content after 3 retries
      setTimeout(onContentEnd, 2000);
    }
  };

  // Progressive image loading with blur effect and TV optimization
  const renderProgressiveImage = () => {
    const optimizedUrl = optimizeImageUrl(content.url, 'image');
    const imageSettings = getTVOptimizedImageSettings();
    
    console.log('🖼️ [renderProgressiveImage] Creating img element with src:', optimizedUrl);
    console.log('📺 [renderProgressiveImage] TV optimization settings:', imageSettings);
    
    return (
      <img
        ref={(imgElement) => {
          // Set the main imageRef for other uses
          imageRef.current = imgElement;
          // Check if image is already loaded when element is created
          if (imgElement && imgElement.complete && imgElement.naturalWidth > 0) {
            console.log('🔄 [ContentPlayer] Image already loaded, triggering onLoad manually');
            handleImageLoad({ target: imgElement });
          }
        }}
        src={optimizedUrl}
        alt={content.title}
        className={`transition-all duration-700 ${
          imageLoading || imageError 
            ? 'opacity-0 scale-95 blur-sm' 
            : 'opacity-100 scale-100 blur-0'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="eager" // Force eager loading for digital signage
        decoding="async" // Async decoding for better performance
        crossOrigin="anonymous" // Allow CORS for external images
        style={{
          ...imageSettings,
          willChange: 'opacity, transform, filter', // Optimize for animations
          backfaceVisibility: 'hidden', // Prevent flickering
          transform: 'translateZ(0)' // Force hardware acceleration
        }}
      />
    );
  };

  console.log('🔍 [ContentPlayer] Rendering with content:', {
    title: content.title,
    type: content.type,
    url: content.url,
    imageLoading,
    showLoading,
    imageError,
    imageLoaded,
    fadeState,
    retryCount
  });
  
  // Set a timeout to detect stuck loading states (must be at top level)
  React.useEffect(() => {
    if (imageLoading && content.type === 'image') {
      console.log('⏱️ [ContentPlayer] Image loading timeout started (15 seconds)');
      const timeout = setTimeout(() => {
        if (imageLoading) {
          console.warn('⚠️ [ContentPlayer] Image still loading after 15 seconds, forcing next content...');
          console.warn('⚠️ Current state:', { imageLoading, imageError, imageLoaded, retryCount });
          if (imageRef.current) {
            console.warn('⚠️ Image element:', {
              src: imageRef.current.src,
              complete: imageRef.current.complete,
              naturalWidth: imageRef.current.naturalWidth,
              naturalHeight: imageRef.current.naturalHeight
            });
          }
          
          // Force move to next content if loading is stuck
          setImageLoading(false);
          setShowLoading(false);
          setImageError(true);
          setTimeout(() => {
            onContentEnd();
          }, 1000);
        }
      }, 15000);
      
      return () => clearTimeout(timeout);
    }
  }, [imageLoading, content.type, imageError, imageLoaded, retryCount, onContentEnd]);

  // Additional debugging for image rendering
  if (content.type === 'image') {
    console.log('🖼️ [ContentPlayer] Image details:', {
      originalUrl: content.url,
      optimizedUrl: optimizeImageUrl(content.url),
      imageLoading,
      imageError,
      retryCount,
      imageLoaded,
      fadeState,
      showLoading,
      lastImageUrl
    });
  }
  
  // Handle null content
  if (!content) {
    return (
      <div className="fullscreen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <h1 className="text-4xl mb-4">No Content Available</h1>
          <p className="text-gray-400">Waiting for content to load</p>
        </div>
      </div>
    );
  }

  // Handle invalid content
  if (!content.type || !content.title) {
    console.warn('⚠️ [ContentPlayer] Invalid content received:', content);
    return (
      <div className="fullscreen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <h1 className="text-4xl mb-4">Invalid Content</h1>
          <p className="text-gray-400">Content format error</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fullscreen flex items-center justify-center bg-black">
      {/* Dynamic Header - Only show for Zoho CLiq content */}
      {isCliqContent() && (
        <div style={{
          position: 'absolute',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          background: 'rgba(0,0,0,0.7)',
          padding: '15px 30px',
          borderRadius: '25px',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255,255,255,0.2)'
        }}>
          {/* Left Logo */}
          <div style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src="https://atrium-media-development.zohostratus.in/image%20%281%29.jpg"
              alt="Atrium Media Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '8px'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #8e44ad 100%)';
                e.target.parentElement.innerHTML = '<span style="font-size: 24px; font-weight: bold; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">A</span>';
              }}
            />
          </div>
          
          {/* Title Text */}
          <span style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            letterSpacing: '1px'
          }}>
            Jems by Jambav
          </span>
          
          {/* Right Logo */}
          <div style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src="https://atrium-media-development.zohostratus.in/image%20%281%29.jpg"
              alt="Atrium Media Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '8px'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #8e44ad 100%)';
                e.target.parentElement.innerHTML = '<span style="font-size: 24px; font-weight: bold; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">A</span>';
              }}
            />
          </div>
        </div>
      )}

      {/* Loading Screen - only for image and video content */}
      {showLoading && content.type === 'image' && (
        <LoadingScreen 
          message={imageError ? `Retrying... (${retryCount}/3)` : 'Loading image...'}
          progress={preloadProgress}
          showProgress={!imageError}
          type={imageError ? 'error' : 'content'}
        />
      )}

      {/* Loading for video content */}
      {showLoading && content.type === 'video' && (
        <div className="flex items-center justify-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent mr-3"></div>
          <span>Loading video...</span>
        </div>
      )}

      {/* Fallback loading for any stuck state */}
      {showLoading && !content.type && (
        <div className="flex items-center justify-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent mr-3"></div>
          <span>Loading content...</span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="absolute left-4 right-4 z-10" style={{ top: isCliqContent() ? '4px' : '20px' }}>
        <div className="bg-gray-800 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${((content.duration - timeLeft) / content.duration) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Debug Info - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 text-white text-xs bg-black bg-opacity-50 p-2 rounded">
          <div>Type: {content.type}</div>
          <div>Loading: {imageLoading ? 'Yes' : 'No'}</div>
          <div>Show: {showLoading ? 'Yes' : 'No'}</div>
          <div>Error: {imageError ? 'Yes' : 'No'}</div>
          <div>Loaded: {imageLoaded ? 'Yes' : 'No'}</div>
          <div>Fade: {fadeState}</div>
          <div>Timestamp: {content.CREATEDTIME || content.created_at || content.timestamp || 'None'}</div>
        </div>
      )}

      {/* Content Display with Fade Transitions */}
      <div className={`w-full h-full flex items-center justify-center transition-opacity duration-500 ${
        fadeState === 'fade-in' ? 'opacity-0' : 
        fadeState === 'fade-out' ? 'opacity-0' : 
        'opacity-100'
      }`} style={{ paddingTop: isCliqContent() ? '140px' : '0px' }}>
        {content.type === 'image' ? (
          renderProgressiveImage()
        ) : content.type === 'video' ? (
          <ReactPlayer
            url={content.url}
            playing={isPlaying}
            width="100%"
            height="100%"
            onEnded={handleVideoEnd}
            onError={handleVideoError}
            controls={false}
            muted={true}
            loop={false}
            style={{ objectFit: 'contain' }}
            config={{
              file: {
                attributes: {
                  preload: 'auto', // Preload video
                  poster: content.poster || '', // Show poster while loading
                }
              }
            }}
            fallback={
              <div className="text-white text-center">
                <p className="text-2xl mb-4">⚠️ Video Error</p>
                <p className="text-gray-400">Unable to play video content</p>
              </div>
            }
          />
        ) : content.type === 'text' ? (
          <div style={{
            background: content.source === 'zoho_cliq' ? getAppreciationGradient() : 'rgba(0,0,0,0.9)',
            textAlign: 'center', 
            maxWidth: '75%', 
            margin: '0 auto', 
            padding: '30px 50px', 
            borderRadius: '24px', 
            border: content.source === 'zoho_cliq' ? '3px solid rgba(255,255,255,0.3)' : '2px solid white',
            boxShadow: content.source === 'zoho_cliq' ? '0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)' : '0 10px 30px rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {content.source === 'zoho_cliq' ? (
              // Clean and beautiful design for Cliq appreciation messages
              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Main message with enhanced styling */}
                <p style={{
                  fontSize: '44px', 
                  color: getOptimalTextColor(), 
                  lineHeight: '1.4', 
                  fontWeight: '700',
                  textShadow: getOptimalTextColor() === 'white' ? '3px 3px 6px rgba(0,0,0,0.4)' : '3px 3px 6px rgba(255,255,255,0.4)',
                  marginBottom: '20px',
                  letterSpacing: '0.8px',
                  textAlign: 'center'
                }}>
                  {content.text}
                </p>
                
                {/* Timestamp */}
                {(content.CREATEDTIME || content.created_at || content.timestamp) && (
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '400',
                    color: getOptimalTextColor() === 'white' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                    marginTop: '16px',
                    textAlign: 'center',
                    letterSpacing: '0.3px'
                  }}>
                    📅 {formatTimestamp(content.CREATEDTIME || content.created_at || content.timestamp)}
                  </div>
                )}
              </div>
            ) : (
              // Standard design for other text content
              <>
                <h2 style={{fontSize: '48px', fontWeight: 'bold', marginBottom: '24px', color: 'white'}}>
                  {content.title}
                </h2>
                <p style={{fontSize: '32px', color: 'lightblue', lineHeight: '1.5'}}>
                  {content.text}
                </p>
                {(content.CREATEDTIME || content.created_at || content.timestamp) && (
                  <div style={{
                    fontSize: '16px',
                    color: 'rgba(255,255,255,0.7)',
                    marginTop: '20px'
                  }}>
                    📅 {formatTimestamp(content.CREATEDTIME || content.created_at || content.timestamp)}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="text-white text-center">
            <p className="text-2xl mb-4">Unsupported Content Type</p>
            <p className="text-gray-400">{content.type}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentPlayer;