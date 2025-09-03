import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Clock, Signal } from 'lucide-react';

const StatusBar = ({ isConnected }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [signalStrength, setSignalStrength] = useState(100);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const signalInterval = setInterval(() => {
      // Simulate signal strength changes
      setSignalStrength(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        return Math.max(0, Math.min(100, prev + change));
      });
    }, 5000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(signalInterval);
    };
  }, []);

  const getSignalColor = (strength) => {
    if (strength >= 80) return 'text-green-500';
    if (strength >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConnectionColor = () => {
    return isConnected ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-20 bg-black bg-opacity-75 text-white p-2">
      <div className="flex justify-between items-center text-sm">
        {/* Left side - Connection status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className={getConnectionColor()}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Signal className={`h-4 w-4 ${getSignalColor(signalStrength)}`} />
            <span className={getSignalColor(signalStrength)}>
              {signalStrength}%
            </span>
          </div>
        </div>

        {/* Right side - Time and system info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>
              {currentTime.toLocaleTimeString()}
            </span>
          </div>

          <div className="text-xs opacity-75">
            Digital Signage Player v1.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusBar; 