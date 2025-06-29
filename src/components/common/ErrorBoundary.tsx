import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can also log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-black/90 flex items-center justify-center p-4">
          <div className="bg-black/50 backdrop-blur-md rounded-2xl p-6 border border-white/10 max-w-md w-full">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-error-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={32} className="text-error-400" />
              </div>
              
              <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
              <p className="text-gray-400 mb-6">
                We're sorry, but an error occurred while rendering this component.
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
                  onClick={this.handleReset} 
                  variant="outline"
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
              
              {this.state.error && (
                <div className="mt-6 p-4 bg-error-500/10 rounded-lg border border-error-500/20 text-left w-full">
                  <p className="text-error-400 font-medium text-sm mb-2">Error Details:</p>
                  <p className="text-error-300 text-xs font-mono overflow-auto">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;