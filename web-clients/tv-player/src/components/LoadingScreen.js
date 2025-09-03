import React, { useRef, useEffect, useState } from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ 
  message = 'Loading Content...', 
  progress = 0, 
  showProgress = true,
  type = 'default' 
}) => {
  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      console.log('🔍 [LoadingScreen] Video element created');
      
      videoRef.current.addEventListener('loadstart', () => {
        console.log('🔍 [LoadingScreen] Video load started');
      });
      
      videoRef.current.addEventListener('canplay', () => {
        console.log('🔍 [LoadingScreen] Video can play');
        setVideoError(false);
      });
      
      videoRef.current.addEventListener('error', (e) => {
        console.error('🔍 [LoadingScreen] Video error:', e);
        console.error('🔍 [LoadingScreen] Video error details:', videoRef.current.error);
        setVideoError(true);
      });
      
      videoRef.current.addEventListener('loadeddata', () => {
        console.log('🔍 [LoadingScreen] Video data loaded');
      });
    }
  }, []);
  const getLoadingIcon = () => {
    switch (type) {
      case 'content':
        return (
          <>
            {!videoError ? (
              <video 
                ref={videoRef}
                autoPlay 
                muted 
                loop 
                playsInline
                className="custom-loading-animation"
                controls={false}
              >
                <source src="https://atrium-media-development.zohostratus.com/animate.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="fallback-animation">
                <div className="custom-spinner"></div>
              </div>
            )}
          </>
        );
      case 'error':
        return (
          <div className="loading-icon error-icon">
            <div className="error-pulse"></div>
          </div>
        );
      default:
        return (
          <>
            {!videoError ? (
              <video 
                ref={videoRef}
                autoPlay 
                muted 
                loop 
                playsInline
                className="custom-loading-animation"
                controls={false}
              >
                <source src="https://atrium-media-development.zohostratus.com/animate.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="fallback-animation">
                <div className="custom-spinner"></div>
              </div>
            )}
          </>
        );
    }
  };

  return (
    <div className="loading-screen">
      {getLoadingIcon()}
      {showProgress && (
        <div className="progress-container" style={{ position: 'absolute', bottom: '50px', left: '50%', transform: 'translateX(-50%)' }}>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingScreen;
