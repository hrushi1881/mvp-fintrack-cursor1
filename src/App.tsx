import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './contexts/AuthContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { InternationalizationProvider } from './contexts/InternationalizationContext';
import { CurrencyConversionProvider } from './contexts/CurrencyConversionContext';
import { PersonalizationProvider } from './contexts/PersonalizationContext';
import { ToastProvider } from './components/common/Toast';
import { LoadingScreen } from './components/common/LoadingScreen';
import { ErrorFallback } from './components/common/ErrorFallback';
import ErrorBoundary from './components/common/ErrorBoundary';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { useAuth } from './contexts/AuthContext';
import Balatro from './components/background/Balatro';

// Lazy load pages for better performance
const Auth = React.lazy(() => import('./pages/Auth').then(module => ({ default: module.Auth })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const AddTransaction = React.lazy(() => import('./pages/AddTransaction').then(module => ({ default: module.AddTransaction })));
const TransactionHistory = React.lazy(() => import('./pages/TransactionHistory').then(module => ({ default: module.TransactionHistory })));
const Transactions = React.lazy(() => import('./pages/Transactions').then(module => ({ default: module.Transactions })));
const Analytics = React.lazy(() => import('./pages/Analytics').then(module => ({ default: module.Analytics })));
const Calendar = React.lazy(() => import('./pages/Calendar').then(module => ({ default: module.Calendar })));
const Goals = React.lazy(() => import('./pages/Goals').then(module => ({ default: module.Goals })));
const Liabilities = React.lazy(() => import('./pages/Liabilities').then(module => ({ default: module.Liabilities })));
const Budgets = React.lazy(() => import('./pages/Budgets').then(module => ({ default: module.Budgets })));
const RecurringTransactions = React.lazy(() => import('./pages/RecurringTransactions').then(module => ({ default: module.RecurringTransactions })));
const Profile = React.lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const Settings = React.lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const Privacy = React.lazy(() => import('./pages/Privacy').then(module => ({ default: module.Privacy })));
const About = React.lazy(() => import('./pages/About').then(module => ({ default: module.About })));
const OnboardingFlow = React.lazy(() => import('./components/onboarding/OnboardingFlow').then(module => ({ default: module.OnboardingFlow })));

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

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Loading your financial data..." />;
  }

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Balatro 
          spinRotation={-1.5}
          spinSpeed={3.0}
          color1="#14b8a6"
          color2="#0d9488"
          color3="#0f172a"
          contrast={2.5}
          lighting={0.5}
          spinAmount={0.3}
          isRotate={true}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <Routes>
          {/* Public Routes */}
          <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/onboarding" replace />} />
          
          {/* Protected Routes */}
          {user ? (
            <>
              <Route path="/onboarding" element={<OnboardingFlow onComplete={() => window.location.href = '/'} />} />
              <Route path="/" element={<Dashboard />} />
              <Route path="/add-transaction" element={<AddTransaction />} />
              <Route path="/transaction-history" element={<TransactionHistory />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/liabilities" element={<Liabilities />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/recurring-transactions" element={<RecurringTransactions />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/auth" replace />} />
          )}
        </Routes>

        {/* Bottom Navigation - Only show for authenticated users on main pages */}
        {user && (
          <BottomNavigation />
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <InternationalizationProvider>
            <CurrencyConversionProvider>
              <PersonalizationProvider>
                <FinanceProvider>
                  <Router>
                    <ErrorBoundary fallback={<ErrorFallback />}>
                      <Suspense fallback={<LoadingScreen />}>
                        <AppContent />
                      </Suspense>
                    </ErrorBoundary>
                  </Router>
                </FinanceProvider>
              </PersonalizationProvider>
            </CurrencyConversionProvider>
          </InternationalizationProvider>
        </AuthProvider>
      </ToastProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;