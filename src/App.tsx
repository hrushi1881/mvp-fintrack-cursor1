import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { InternationalizationProvider } from './contexts/InternationalizationContext';
import { CurrencyConversionProvider } from './contexts/CurrencyConversionContext';
import { PersonalizationProvider } from './contexts/PersonalizationContext';
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
  const { user, loading } = useAuth();
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

  // Always show onboarding for logged-in users
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

  function handleOnboardingComplete(onboardingData: any) {
    try {
      console.log("Onboarding completed with data:", onboardingData);
      setIsInitialLoad(true); // Set loading state while processing
      
      // Process and store personalization data
      const personalizedSettings = processOnboardingForPersonalization(onboardingData);
      localStorage.setItem(`finspire_personalization_${user?.id}`, JSON.stringify(personalizedSettings));
      
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
      
      // Create income transactions based on income sources
      if (onboardingData.incomeSources && onboardingData.incomeSources.length > 0) {
        for (const source of onboardingData.incomeSources) {
          if (source.amount > 0) {
            await addTransaction({
              type: 'income',
              amount: source.amount,
              category: source.type.charAt(0).toUpperCase() + source.type.slice(1),
              description: source.description || `${source.type} income (initial setup)`,
              date: new Date(),
            });
            
            // Create recurring transaction for regular income
            if (source.frequency !== 'irregular') {
              await addRecurringTransaction({
                type: 'income',
                amount: source.amount,
                category: source.type.charAt(0).toUpperCase() + source.type.slice(1),
                description: source.description || `${source.type} income`,
                frequency: source.frequency === 'weekly' ? 'weekly' : 
                          source.frequency === 'yearly' ? 'yearly' : 'monthly',
                startDate: new Date(),
                nextOccurrenceDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                isActive: true,
                currentOccurrences: 0,
              });
            }
          }
        }
      } else if (onboardingData.monthlyIncome) {
        // Fallback to old method
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
      if (onboardingData.primaryFocus && onboardingData.primaryFocus.length > 0) {
        const goalPromises = onboardingData.primaryFocus.map(async (goalType: string) => {
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
      const monthlyIncome = onboardingData.totalMonthlyIncome || onboardingData.monthlyIncome;
      if (monthlyIncome) {
        const budgetCategories = [
          { category: 'Food', percentage: 0.15 },
          { category: 'Transportation', percentage: 0.15 },
          { category: 'Entertainment', percentage: 0.10 },
          { category: 'Shopping', percentage: 0.10 },
        ];
        
        // Adjust budget categories based on user type
        if (onboardingData.userTypes?.includes('student')) {
          budgetCategories.push({ category: 'Education', percentage: 0.20 });
        }
        
        if (onboardingData.userTypes?.includes('business_owner')) {
          budgetCategories.push({ category: 'Business', percentage: 0.25 });
        }

        const budgetPromises = budgetCategories.map(async ({ category, percentage }) => {
          await addBudget({
            category,
            amount: monthlyIncome * percentage,
            spent: 0,
            period: onboardingData.budgetPeriod || 
                   (onboardingData.userTypes?.includes('student') ? 'weekly' : 'monthly'),
          });
        });
        await Promise.all(budgetPromises);
      }

    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsInitialLoad(false);
      // Navigate to dashboard after onboarding
      window.location.href = '/';
    }
  }

  // Process onboarding data for personalization
  const processOnboardingForPersonalization = (data: any) => {
    const personalization = {
      dashboardLayout: ['overview', 'recent_transactions', 'quick_actions'],
      priorityFeatures: [] as string[],
      hiddenFeatures: [] as string[],
      budgetingFrequency: 'monthly' as 'weekly' | 'monthly' | 'yearly',
      alertSettings: {
        budgetAlerts: true,
        goalReminders: true,
        billReminders: true,
        weeklyReports: false,
      },
      assistantPersonality: 'balanced' as 'conservative' | 'balanced' | 'aggressive',
      userTypes: data.userTypes || [],
      primaryFocus: data.primaryFocus || [],
      incomeStability: data.incomeStability || 'stable',
      experienceLevel: data.experience || 'intermediate',
    };

    // Process user types for dashboard layout
    if (data.userTypes?.includes('student')) {
      personalization.dashboardLayout.unshift('budgeting', 'savings_goals');
      personalization.budgetingFrequency = 'weekly';
      personalization.assistantPersonality = 'conservative';
    }
    
    if (data.userTypes?.includes('freelancer')) {
      personalization.dashboardLayout.unshift('income_tracking', 'cash_flow');
      personalization.alertSettings.irregularIncomeWarning = true;
    }
    
    if (data.userTypes?.includes('business_owner')) {
      personalization.dashboardLayout.unshift('business_tracking', 'investment_planning');
      personalization.assistantPersonality = 'aggressive';
    }
    }
    // Process primary focus for priority features
    if (data.primaryFocus?.includes('save_more')) {
      personalization.priorityFeatures.push('savings_dashboard', 'goal_tracking');
    }
    
    if (data.primaryFocus?.includes('pay_off_debt')) {
      personalization.priorityFeatures.push('debt_strategies', 'emi_tracking');
    }
    
    if (data.primaryFocus?.includes('invest_better')) {
      personalization.priorityFeatures.push('investment_tracking', 'portfolio_analysis');
    }
  };
    // Hide features based on financial activities
    if (!data.hasInvestments) {
      personalization.hiddenFeatures.push('investment_tracking', 'portfolio_analysis');
    }
    
    if (!data.hasDebts) {
      personalization.hiddenFeatures.push('debt_tracking', 'emi_reminders');
    }

    return personalization;
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
        targetAmount: (data.totalMonthlyIncome || data.monthlyIncome) ? (data.totalMonthlyIncome || data.monthlyIncome) * 6 : 10000,
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
        targetAmount: (data.totalMonthlyIncome || data.monthlyIncome) ? (data.totalMonthlyIncome || data.monthlyIncome) * 120 : 100000,
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
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <AuthProvider>
            <InternationalizationProvider>
              <CurrencyConversionProvider>
                <PersonalizationProvider>
                  <FinanceProvider>
                    <AppContent />
                  </FinanceProvider>
                </PersonalizationProvider>
              </CurrencyConversionProvider>
            </InternationalizationProvider>
          </AuthProvider>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;