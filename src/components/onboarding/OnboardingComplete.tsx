import React, { useState } from 'react';
import { CheckCircle, Sparkles, TrendingUp, Target, PieChart, Calendar, ArrowRight, Globe } from 'lucide-react';
import { Button } from '../common/Button';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface OnboardingCompleteProps {
  onComplete: () => void;
  onPrev: () => void;
  userData: any;
}

export const OnboardingComplete: React.FC<OnboardingCompleteProps> = ({ 
  onComplete, 
  onPrev, 
  userData 
}) => {
  const [isCreatingData, setIsCreatingData] = useState(false);
  const { formatCurrency } = useInternationalization();

  const handleComplete = async () => {
    setIsCreatingData(true);
    
    // Simulate creating initial data
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onComplete();
  };

  const features = [
    {
      icon: TrendingUp,
      title: 'Smart Analytics',
      description: 'Get insights into your spending patterns and financial health'
    },
    {
      icon: Target,
      title: 'Goal Tracking',
      description: 'Monitor progress towards your financial objectives'
    },
    {
      icon: PieChart,
      title: 'Budget Management',
      description: 'Stay on top of your spending with intelligent budgeting'
    },
    {
      icon: Globe,
      title: 'Global Finance',
      description: 'Track finances in your preferred currency'
    }
  ];

  if (isCreatingData) {
    return (
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-400"></div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Setting up your account...</h2>
          <p className="text-gray-400">
            We're creating your personalized financial dashboard
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            <CheckCircle size={16} className="text-green-400" />
            <span>Creating your profile</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            <CheckCircle size={16} className="text-green-400" />
            <span>Setting up your goals</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-400"></div>
            <span>Configuring your preferences</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-8">
      {/* Success Animation */}
      <div className="relative">
        <div className="w-24 h-24 bg-gradient-to-br from-green-400/80 to-green-600/80 rounded-full flex items-center justify-center mx-auto shadow-lg">
          <CheckCircle size={48} className="text-white" />
        </div>
        <div className="absolute -top-2 -right-2">
          <Sparkles size={24} className="text-yellow-400 animate-pulse" />
        </div>
      </div>
      
      {/* Success Message */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-white">
          Welcome to Finspire! 🎉
        </h2>
        <p className="text-lg text-gray-300">
          Your financial journey starts now. You're all set up and ready to take control of your finances.
        </p>
      </div>

      {/* Summary */}
      {userData && (
        <div className="bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-xl p-6 text-left border border-primary-500/30">
          <h3 className="font-semibold text-white mb-4 text-center">Your Profile Summary</h3>
          <div className="grid grid-cols-1 gap-3 text-sm">
            {userData.name && (
              <div className="flex justify-between">
                <span className="text-gray-400">Name:</span>
                <span className="font-medium text-white">{userData.name}</span>
              </div>
            )}
            {userData.initialBalance > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Initial Balance:</span>
                <span className="font-medium text-white">{formatCurrency(userData.initialBalance)}</span>
              </div>
            )}
            {userData.monthlyIncome > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Monthly Income:</span>
                <span className="font-medium text-white">{formatCurrency(userData.monthlyIncome)}</span>
              </div>
            )}
            {userData.currency && (
              <div className="flex justify-between">
                <span className="text-gray-400">Preferred Currency:</span>
                <span className="font-medium text-white">{userData.currency}</span>
              </div>
            )}
            {userData.primaryGoals && userData.primaryGoals.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Primary Goals:</span>
                <span className="font-medium text-white">{userData.primaryGoals.length} selected</span>
              </div>
            )}
            {userData.experience && (
              <div className="flex justify-between">
                <span className="text-gray-400">Experience Level:</span>
                <span className="font-medium text-white capitalize">{userData.experience}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Features Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">What's next?</h3>
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="p-4 bg-black/30 rounded-lg border border-white/10 backdrop-blur-sm">
              <feature.icon size={24} className="mx-auto text-primary-400 mb-2" />
              <h4 className="font-medium text-white text-sm mb-1">{feature.title}</h4>
              <p className="text-xs text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="space-y-4">
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2 text-yellow-400">
            <Sparkles size={16} />
            <span className="text-sm font-medium">Pro Tip</span>
          </div>
          <p className="text-yellow-300 text-sm mt-1">
            Start by adding your first transaction or setting up a budget to see Finspire in action!
          </p>
        </div>

        <Button onClick={handleComplete} className="w-full py-4 text-lg">
          Enter Finspire
          <ArrowRight size={20} className="ml-2" />
        </Button>

        <button
          onClick={onPrev}
          className="text-gray-400 hover:text-gray-300 text-sm font-medium"
        >
          Go back to make changes
        </button>
      </div>
    </div>
  );
};