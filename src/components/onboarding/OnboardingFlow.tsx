import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { OnboardingWelcome } from './OnboardingWelcome';
import { OnboardingProfile } from './OnboardingProfile';
import { OnboardingGoals } from './OnboardingGoals';
import { OnboardingPreferences } from './OnboardingPreferences';
import { OnboardingFinancial } from './OnboardingFinancial';
import { OnboardingComplete } from './OnboardingComplete';
import { useAuth } from '../../contexts/AuthContext';
import { Capacitor } from '@capacitor/core';

interface OnboardingData {
  // Profile data
  name?: string;
  age?: number;
  occupation?: string;
  monthlyIncome?: number;
  experience?: 'beginner' | 'intermediate' | 'advanced';
  
  // Financial data
  initialBalance?: number;
  currency?: string;
  
  // Goals data
  primaryGoals?: string[];
  emergencyFund?: number;
  timeHorizon?: '1year' | '2-5years' | '5-10years' | '10+years';
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  
  // Preferences data
  currency?: string;
  budgetPeriod?: 'weekly' | 'monthly' | 'yearly';
  notifications?: {
    budgetAlerts: boolean;
    goalReminders: boolean;
    billReminders: boolean;
    weeklyReports: boolean;
  };
  startOfWeek?: 'sunday' | 'monday';
  theme?: 'light' | 'dark' | 'auto';
  biometricEnabled?: boolean;
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNative = Capacitor.isNativePlatform();

  // Pre-fill user data if available
  useEffect(() => {
    if (user) {
      setOnboardingData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const steps = [
    { title: "Welcome", component: OnboardingWelcome },
    { title: "Financial", component: OnboardingFinancial },
    { title: "Profile", component: OnboardingProfile },
    { title: "Goals", component: OnboardingGoals },
    { title: "Preferences", component: OnboardingPreferences },
    { title: "Complete", component: OnboardingComplete },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepData = (data: any) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
    nextStep();
  };

  const completeOnboarding = async () => {
    // Add biometric setting for mobile devices
    if (isNative) {
      onboardingData.biometricEnabled = true;
    }
    
    onComplete(onboardingData);
    navigate('/');
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress Bar */}
        {currentStep > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-300">
                Step {currentStep} of {steps.length - 1}
              </span>
              <span className="text-sm text-gray-400">
                {Math.round((currentStep / (steps.length - 1)) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xl">
          <CurrentStepComponent
            onNext={handleStepData}
            onPrev={prevStep}
            onComplete={completeOnboarding}
            userData={onboardingData}
            initialData={onboardingData}
            canGoBack={currentStep > 0}
          />
        </div>
      </div>
    </div>
  );
};