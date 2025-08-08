import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  const goHome = () => {
    try {
      // Prefer SPA navigation when router is available
      if ((window as any).history) {
        window.location.assign('/');
        return;
      }
    } catch (_) {
      // no-op; fallback below
    }
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-black/90 flex items-center justify-center p-4">
      <div className="bg-black/50 backdrop-blur-md rounded-2xl p-6 border border-white/10 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-error-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-error-400" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-6">
            We're sorry, but an error occurred while loading this page.
          </p>
          
          <div className="space-y-4 w-full">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              <RefreshCw size={16} className="mr-2" />
              Reload Application
            </Button>
            
            <Button 
              onClick={goHome} 
              variant="outline"
              className="w-full"
            >
              <Home size={16} className="mr-2" />
              Back to Dashboard
            </Button>
            
            {resetErrorBoundary && (
              <Button 
                onClick={resetErrorBoundary} 
                variant="ghost"
                className="w-full"
              >
                Try Again
              </Button>
            )}
          </div>
          
          {error && (
            <div className="mt-6 p-4 bg-error-500/10 rounded-lg border border-error-500/20 text-left w-full">
              <p className="text-error-400 font-medium text-sm mb-2">Error Details:</p>
              <p className="text-error-300 text-xs font-mono overflow-auto">
                {error.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};