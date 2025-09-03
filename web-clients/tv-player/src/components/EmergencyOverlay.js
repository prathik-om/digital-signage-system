import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const EmergencyOverlay = ({ message, priority }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getPriorityStyles = () => {
    switch (priority) {
      case 'high':
        return {
          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          textColor: 'text-white',
          borderColor: 'border-red-300'
        };
      case 'medium':
        return {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          textColor: 'text-white',
          borderColor: 'border-yellow-300'
        };
      case 'low':
        return {
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          textColor: 'text-white',
          borderColor: 'border-blue-300'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          textColor: 'text-white',
          borderColor: 'border-red-300'
        };
    }
  };

  const styles = getPriorityStyles();

  if (!isVisible) {
    return null;
  }

  return (
    <div className="emergency-overlay">
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{ background: styles.background }}
      >
        <div className="text-center max-w-4xl mx-auto px-8">
          {/* Emergency Icon */}
          <div className="mb-8">
            <AlertTriangle className="h-24 w-24 text-white mx-auto animate-pulse" />
          </div>

          {/* Emergency Message */}
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-white mb-4">
              EMERGENCY
            </h1>
            <p className="text-3xl text-white font-medium leading-relaxed">
              {message}
            </p>
          </div>

          {/* Priority Badge */}
          <div className="mb-8">
            <span className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-bold bg-white bg-opacity-20 ${styles.textColor} border-2 ${styles.borderColor}`}>
              {priority.toUpperCase()} PRIORITY
            </span>
          </div>

          {/* Timer */}
          <div className="text-white text-xl">
            <p>This message will automatically clear in {timeLeft} seconds</p>
          </div>

          {/* Close Button (for testing) */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-8 w-8" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyOverlay; 