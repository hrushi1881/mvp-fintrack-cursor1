import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface PersonalizationSettings {
  dashboardLayout: string[];
  priorityFeatures: string[];
  hiddenFeatures: string[];
  budgetingFrequency: 'weekly' | 'monthly' | 'yearly';
  alertSettings: Record<string, boolean>;
  assistantPersonality: 'conservative' | 'balanced' | 'aggressive';
  userTypes: string[];
  primaryFocus: string[];
  incomeStability: 'stable' | 'variable' | 'irregular';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
}

interface PersonalizationContextType {
  settings: PersonalizationSettings;
  updateSettings: (updates: Partial<PersonalizationSettings>) => void;
  isFeatureEnabled: (feature: string) => boolean;
  isFeaturePriority: (feature: string) => boolean;
  getDashboardComponents: () => string[];
  getRecommendedBudgetPeriod: () => 'weekly' | 'monthly' | 'yearly';
  getAssistantTone: () => 'conservative' | 'balanced' | 'aggressive';
  shouldShowTutorial: (feature: string) => boolean;
}

const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);

export const usePersonalization = () => {
  const context = useContext(PersonalizationContext);
  if (context === undefined) {
    throw new Error('usePersonalization must be used within a PersonalizationProvider');
  }
  return context;
};

interface PersonalizationProviderProps {
  children: ReactNode;
}

export const PersonalizationProvider: React.FC<PersonalizationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PersonalizationSettings>({
    dashboardLayout: ['overview', 'recent_transactions', 'quick_actions'],
    priorityFeatures: [],
    hiddenFeatures: [],
    budgetingFrequency: 'monthly',
    alertSettings: {
      budgetAlerts: true,
      goalReminders: true,
      billReminders: true,
      weeklyReports: false,
    },
    assistantPersonality: 'balanced',
    userTypes: [],
    primaryFocus: [],
    incomeStability: 'stable',
    experienceLevel: 'intermediate',
  });

  // Load personalization settings
  useEffect(() => {
    if (user) {
      loadPersonalizationSettings();
    }
  }, [user]);

  const loadPersonalizationSettings = async () => {
    try {
      const saved = localStorage.getItem(`finspire_personalization_${user?.id}`);
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
        console.log('✅ Loaded personalization settings:', parsedSettings);
      }
    } catch (error) {
      console.error('❌ Error loading personalization settings:', error);
    }
  };

  const updateSettings = (updates: Partial<PersonalizationSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    
    // Save to localStorage
    if (user) {
      localStorage.setItem(`finspire_personalization_${user.id}`, JSON.stringify(newSettings));
      console.log('✅ Updated personalization settings:', updates);
    }
  };

  const isFeatureEnabled = (feature: string): boolean => {
    return !settings.hiddenFeatures.includes(feature);
  };

  const isFeaturePriority = (feature: string): boolean => {
    return settings.priorityFeatures.includes(feature);
  };

  const getDashboardComponents = (): string[] => {
    const baseComponents = ['overview', 'recent_transactions'];
    const personalizedComponents = [...baseComponents, ...settings.dashboardLayout];
    
    // Filter out hidden features
    return personalizedComponents.filter(component => isFeatureEnabled(component));
  };

  const getRecommendedBudgetPeriod = (): 'weekly' | 'monthly' | 'yearly' => {
    // Students and irregular income users benefit from weekly budgets
    if (settings.userTypes.includes('student') || settings.incomeStability === 'irregular') {
      return 'weekly';
    }
    
    // Business owners might prefer yearly planning
    if (settings.userTypes.includes('business_owner')) {
      return 'yearly';
    }
    
    return settings.budgetingFrequency;
  };

  const getAssistantTone = (): 'conservative' | 'balanced' | 'aggressive' => {
    // Students and beginners get conservative advice
    if (settings.userTypes.includes('student') || settings.experienceLevel === 'beginner') {
      return 'conservative';
    }
    
    // Business owners and investors get aggressive advice
    if (settings.userTypes.includes('business_owner') || settings.userTypes.includes('investor')) {
      return 'aggressive';
    }
    
    return settings.assistantPersonality;
  };

  const shouldShowTutorial = (feature: string): boolean => {
    // Show tutorials for beginners or when a feature is new to the user
    return settings.experienceLevel === 'beginner' || 
           (settings.priorityFeatures.includes(feature) && !localStorage.getItem(`tutorial_${feature}_${user?.id}`));
  };

  const value = {
    settings,
    updateSettings,
    isFeatureEnabled,
    isFeaturePriority,
    getDashboardComponents,
    getRecommendedBudgetPeriod,
    getAssistantTone,
    shouldShowTutorial,
  };

  return (
    <PersonalizationContext.Provider value={value}>
      {children}
    </PersonalizationContext.Provider>
  );
};