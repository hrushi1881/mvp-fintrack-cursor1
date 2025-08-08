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
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import Balatro from './components/background/Balatro';

// Lazy load pages for better performance
const Auth = React.lazy(() => import('./pages/Auth').then(module => ({ default: module.Auth })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const AddTransaction = React.lazy(() => import('./pages/AddTransaction').then(module => ({ default: module.AddTransaction })));
const TransactionHistory = React.lazy(() => import('./pages/TransactionHistory').then(module => ({ default: module.TransactionHistory })));
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

// Create a client with optimized settings
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
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    }
  }
});

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <InternationalizationProvider>
              <CurrencyConversionProvider>
                <PersonalizationProvider>
                  <FinanceProvider>
                    <Router>
                      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-charcoal-900 to-dark-950 relative">
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
                          <Suspense fallback={<LoadingScreen message="Loading your financial dashboard..." />}>
                            <Routes>
                              {/* Public Routes */}
                              <Route path="/auth" element={<Auth />} />
                              
                              {/* Onboarding Route */}
                              <Route 
                                path="/onboarding" 
                                element={
                                  <ProtectedRoute>
                                    <OnboardingFlow 
                                      onComplete={() => {
                                        // Always redirect to dashboard after onboarding
                                        window.location.href = '/';
                                      }} 
                                    />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              {/* Protected Routes */}
                              <Route 
                                path="/" 
                                element={
                                  <ProtectedRoute>
                                    <Dashboard />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/add-transaction" 
                                element={
                                  <ProtectedRoute>
                                    <AddTransaction />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/transaction-history" 
                                element={
                                  <ProtectedRoute>
                                    <TransactionHistory />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/analytics" 
                                element={
                                  <ProtectedRoute>
                                    <Analytics />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/calendar" 
                                element={
                                  <ProtectedRoute>
                                    <Calendar />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/goals" 
                                element={
                                  <ProtectedRoute>
                                    <Goals />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/liabilities" 
                                element={
                                  <ProtectedRoute>
                                    <Liabilities />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/budgets" 
                                element={
                                  <ProtectedRoute>
                                    <Budgets />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/recurring-transactions" 
                                element={
                                  <ProtectedRoute>
                                    <RecurringTransactions />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/profile" 
                                element={
                                  <ProtectedRoute>
                                    <Profile />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/settings" 
                                element={
                                  <ProtectedRoute>
                                    <Settings />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/privacy" 
                                element={
                                  <ProtectedRoute>
                                    <Privacy />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              <Route 
                                path="/about" 
                                element={
                                  <ProtectedRoute>
                                    <About />
                                    <BottomNavigation />
                                  </ProtectedRoute>
                                } 
                              />
                              
                              {/* Catch all route */}
                              <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                          </Suspense>
                        </div>
                      </div>
                    </Router>
                    <ReactQueryDevtools initialIsOpen={false} />
                  </FinanceProvider>
                </PersonalizationProvider>
              </CurrencyConversionProvider>
            </InternationalizationProvider>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;