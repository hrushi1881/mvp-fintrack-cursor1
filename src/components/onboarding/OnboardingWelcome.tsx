import React from 'react';
import { TrendingUp, DollarSign, Target, PieChart, Calendar, Shield, Globe } from 'lucide-react';
import { Button } from '../common/Button';
import Silk from '../background/Silk';

interface OnboardingWelcomeProps {
  onNext: () => void;
}

export const OnboardingWelcome: React.FC<OnboardingWelcomeProps> = ({ onNext }) => {
  return (
    <div className="text-center space-y-8 relative">
      {/* Hero Section */}
      <div className="space-y-4">
        <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
          <TrendingUp size={48} className="text-white" />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to <span className="text-primary-400">Finspire</span>! 🎉
          </h1>
          <p className="text-lg text-gray-300">
            Your journey to financial freedom starts here
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl border border-green-500/30">
          <DollarSign size={32} className="mx-auto text-green-400 mb-3" />
          <h3 className="font-semibold text-white mb-1">Track Income</h3>
          <p className="text-sm text-gray-300">Monitor all your income sources</p>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl border border-blue-500/30">
          <Target size={32} className="mx-auto text-blue-400 mb-3" />
          <h3 className="font-semibold text-white mb-1">Set Goals</h3>
          <p className="text-sm text-gray-300">Achieve your financial dreams</p>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl border border-purple-500/30">
          <PieChart size={32} className="mx-auto text-purple-400 mb-3" />
          <h3 className="font-semibold text-white mb-1">Budget Smart</h3>
          <p className="text-sm text-gray-300">Control your spending habits</p>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl border border-orange-500/30">
          <Globe size={32} className="mx-auto text-orange-400 mb-3" />
          <h3 className="font-semibold text-white mb-1">Global Finance</h3>
          <p className="text-sm text-gray-300">Multi-currency support</p>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 text-left border border-white/10">
        <h3 className="font-semibold text-white mb-4 text-center">What you'll get:</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
            <span className="text-sm text-gray-300">Real-time financial health score</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
            <span className="text-sm text-gray-300">Personalized insights and recommendations</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
            <span className="text-sm text-gray-300">Beautiful charts and analytics</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
            <span className="text-sm text-gray-300">Multi-currency support for global users</span>
          </div>
        </div>
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center space-x-2 text-gray-400">
        <Shield size={16} />
        <span className="text-sm">Bank-level security & encryption</span>
      </div>

      <Button onClick={onNext} className="w-full py-4 text-lg">
        Let's Get Started! 🚀
      </Button>
    </div>
  );
};