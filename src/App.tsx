import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { InternationalizationProvider } from './contexts/InternationalizationContext';
import { CurrencyConversionProvider } from './contexts/CurrencyConversionContext';
import { FinanceProvider, useFinance } from './contexts/FinanceContext';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { AiFinancialAssistant } from './components/dashboard/AiFinancialAssistant';
import Silk from './components/background/Silk';
import { ToastProvider } from './components/common/Toast';
import { Dashboard } from './pages/Dashboard';
import { Calendar } from './pages/Calendar';
import { Analytics } from './pages/Analytics';
import { Goals } from './pages/Goals';
import { Liabilities } from './pages/Liabilities';
import { Budgets } from './pages/Budgets';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Privacy } from './pages/Privacy';
import { About } from './pages/About';
import { AddTransaction } from './pages/AddTransaction';
import { RecurringTransactions } from './pages/RecurringTransactions';
import { TransactionHistory } from './pages/TransactionHistory';
import { Auth } from './pages/Auth';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

const AppContent: React.FC = () => {
  const { user, loading, needsOnboarding, completeOnboarding } = useAuth();
  const { addTransaction, addGoal, addBudget, addRecurringTransaction } = useFinance();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isNative = Capacitor.isNativePlatform();

  // Set initial load state
  useEffect(() => {
    if (!loading) {
      // Add a small delay to ensure smooth transitions
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
        if (isNative) {
          SplashScreen.hide();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, isNative]);

  if (isInitialLoad || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Silk 
          speed={3}
          scale={2}
          color="#0f172a"
          noiseIntensity={0.8}
          rotation={0.1}
        />
        <div className="relative z-10">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const handleOnboardingComplete = async (onboardingData: any) => {
    try {
      console.log("Onboarding completed with data:", onboardingData);
      setIsInitialLoad(true); // Set loading state while processing
      
      // Create initial balance transaction if provided
      if (onboardingData.initialBalance && onboardingData.initialBalance > 0) {
        await addTransaction({
          type: 'income',
          amount: onboardingData.initialBalance,
          category: 'Initial Balance',
          description: 'Starting balance (initial setup)',
          date: new Date(),
        });
      }
      
      // Create initial income transaction if provided
      if (onboardingData.monthlyIncome) {
        await addTransaction({
          type: 'income',
          amount: onboardingData.monthlyIncome,
          category: 'Salary',
          description: 'Monthly income (initial setup)',
          date: new Date(),
        });
        
        // Create recurring income transaction
        await addRecurringTransaction({
          type: 'income',
          amount: onboardingData.monthlyIncome,
          category: 'Salary',
          description: 'Monthly salary',
          frequency: 'monthly',
          startDate: new Date(),
          nextOccurrenceDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          isActive: true,
          currentOccurrences: 0,
        });
      }

      // Create goals based on selected primary goals
      if (onboardingData.primaryGoals && onboardingData.primaryGoals.length > 0) {
        const goalPromises = onboardingData.primaryGoals.map(async (goalType: string) => {
          const goalData = getGoalData(goalType, onboardingData);
          if (goalData) {
            await addGoal(goalData);
          }
        });
        await Promise.all(goalPromises);
      }

      // Create emergency fund goal if specified
      if (onboardingData.emergencyFund && onboardingData.emergencyFund > 0) {
        await addGoal({
          title: 'Emergency Fund',
          description: 'Financial safety net for unexpected expenses',
          targetAmount: onboardingData.emergencyFund,
          currentAmount: 0,
          targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          category: 'Emergency',
        });
      }

      // Create initial budgets based on income
      if (onboardingData.monthlyIncome) {
        const budgetCategories = [
          { category: 'Food', percentage: 0.15 },
          { category: 'Transportation', percentage: 0.15 },
          { category: 'Entertainment', percentage: 0.10 },
          { category: 'Shopping', percentage: 0.10 },
        ];

        const budgetPromises = budgetCategories.map(async ({ category, percentage }) => {
          await addBudget({
            category,
            amount: onboardingData.monthlyIncome! * percentage,
            spent: 0,
            period: onboardingData.budgetPeriod || 'monthly',
          });
        });
        await Promise.all(budgetPromises);
      }

    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsInitialLoad(false);
      completeOnboarding(); // Complete onboarding regardless of success or failure
    }
  };

  const getGoalData = (goalType: string, data: any) => {
    const baseTargetDate = new Date();
    const timeHorizonMonths = {
      '1year': 12,
      '2-5years': 36,
      '5-10years': 84,
      '10+years': 120,
    };
    
    const months = timeHorizonMonths[data.timeHorizon || '2-5years'];
    baseTargetDate.setMonth(baseTargetDate.getMonth() + months);

    const goalTemplates: Record<string, any> = {
      emergency: {
        title: 'Emergency Fund',
        description: 'Build a financial safety net for unexpected expenses',
        targetAmount: data.monthlyIncome ? data.monthlyIncome * 6 : 10000,
        category: 'Emergency',
      },
      house: {
        title: 'House Down Payment',
        description: 'Save for a down payment on your dream home',
        targetAmount: 50000,
        category: 'Home',
      },
      travel: {
        title: 'Travel Fund',
        description: 'Save for your next adventure and vacation',
        targetAmount: 5000,
        category: 'Travel',
      },
      education: {
        title: 'Education Fund',
        description: 'Invest in your education and skill development',
        targetAmount: 15000,
        category: 'Education',
      },
      wedding: {
        title: 'Wedding Fund',
        description: 'Save for your special day',
        targetAmount: 25000,
        category: 'Other',
      },
      car: {
        title: 'Car Purchase',
        description: 'Save for a new vehicle',
        targetAmount: 20000,
        category: 'Other',
      },
      business: {
        title: 'Business Startup',
        description: 'Fund your entrepreneurial dreams',
        targetAmount: 30000,
        category: 'Investment',
      },
      retirement: {
        title: 'Retirement Savings',
        description: 'Secure your financial future',
        targetAmount: data.monthlyIncome ? data.monthlyIncome * 120 : 100000,
        category: 'Investment',
      },
    };

    const template = goalTemplates[goalType];
    if (!template) return null;

    return {
      ...template,
      currentAmount: 0,
      targetDate: baseTargetDate,
    };
  };

  if (needsOnboarding) {
    return (
      <div className="relative">
        <Silk 
          speed={3}
          scale={2}
          color="#0f172a"
          noiseIntensity={0.8}
          rotation={0.1}
        />
        <div className="relative z-10">
          <OnboardingFlow onComplete={handleOnboardingComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Animated Silk Background */}
      <Silk 
        speed={3}
        scale={2}
        color="#0f172a"
        noiseIntensity={0.8}
        rotation={0.1}
      />
      
      {/* App Content */}
      <div className="relative z-10">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/add-transaction" element={<AddTransaction />} />
            <Route path="/transaction-history" element={<TransactionHistory />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/liabilities" element={<Liabilities />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/recurring-transactions" element={<RecurringTransactions />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/about" element={<About />} />
            <Route path="/onboarding" element={<OnboardingFlow onComplete={handleOnboardingComplete} />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <BottomNavigation />
          <AiFinancialAssistant />
        </ErrorBoundary>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <AuthProvider>
            <InternationalizationProvider>
              <CurrencyConversionProvider>
                <FinanceProvider>
                  <AppContent />
                </FinanceProvider>
              </CurrencyConversionProvider>
            </InternationalizationProvider>
          </AuthProvider>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;