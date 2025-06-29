import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n'; // Import i18n configuration
import { LoadingScreen } from './components/common/LoadingScreen.tsx';
import { ErrorFallback } from './components/common/ErrorFallback.tsx';
import ErrorBoundary from './components/common/ErrorBoundary.tsx';
import { OfflineNotice } from './components/common/OfflineNotice.tsx';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar } from '@capacitor/status-bar';

// Initialize Capacitor plugins if running as a native app
if (Capacitor.isNativePlatform()) {
  console.log('Running on native platform:', Capacitor.getPlatform());
  
  // Hide the splash screen with a fade animation
  SplashScreen.hide({
    fadeOutDuration: 500
  });
  
  // Set status bar style
  StatusBar.setStyle({ style: Capacitor.getPlatform() === 'ios' ? 'dark' : 'dark' });
  if (Capacitor.getPlatform() === 'android') {
    StatusBar.setBackgroundColor({ color: '#0f172a' });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Suspense fallback={<LoadingScreen message="Loading translations..." />}>
        <App />
        <OfflineNotice />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
);