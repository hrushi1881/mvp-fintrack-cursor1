import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';

export const OfflineNotice: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show the banner briefly when coming back online
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div className={`fixed bottom-20 left-0 right-0 z-50 mx-auto max-w-md px-4 transition-all duration-300 ${
      showBanner ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
    }`}>
      <div className={`rounded-xl p-4 shadow-lg flex items-center justify-between ${
        isOnline 
          ? 'bg-success-500/90 backdrop-blur-md border border-success-400/30' 
          : 'bg-warning-500/90 backdrop-blur-md border border-warning-400/30'
      }`}>
        <div className="flex items-center space-x-3">
          {isOnline ? (
            <Wifi size={20} className="text-white" />
          ) : (
            <WifiOff size={20} className="text-white" />
          )}
          <div>
            <p className="font-medium text-white">
              {isOnline ? 'You\'re back online!' : 'You\'re offline'}
            </p>
            <p className="text-sm text-white/80">
              {isOnline 
                ? 'Your changes will now sync to the cloud' 
                : 'Changes will be saved locally until you reconnect'
              }
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowBanner(false)}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
};