import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
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

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
          return false;
        }
        return failureCount < 3;
      }
    },
    mutations: {
      retry: 1
    }
  }
});

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
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary fallback={<ErrorFallback />}>
        <Suspense fallback={<LoadingScreen message="Loading translations..." />}>
          <App />
          <OfflineNotice />
        </Suspense>
      </ErrorBoundary>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
);