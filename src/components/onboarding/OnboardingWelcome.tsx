import React from 'react';
import { TrendingUp, DollarSign, Target, PieChart, Calendar, Shield, Globe, Sparkles, Users, Heart } from 'lucide-react';
import { Button } from '../common/Button';
import { useTranslation } from 'react-i18next';

interface OnboardingWelcomeProps {
  onNext: () => void;
}

export const OnboardingWelcome: React.FC<OnboardingWelcomeProps> = ({ onNext }) => {
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ];

  return (
    <div className="text-center space-y-6 relative">
      {/* Language Selector */}
      <div className="flex justify-center space-x-2 mb-6">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
              i18n.language === lang.code
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-black/20 text-gray-300 hover:bg-white/10'
            }`}
          >
            <span className="mr-1">{lang.flag}</span>
            {lang.name}
          </button>
        ))}
      </div>

      {/* Hero Section */}
      <div className="space-y-6">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
            <TrendingUp size={48} className="text-white" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles size={20} className="text-yellow-400 animate-bounce" />
          </div>
        </div>
        
        <div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Welcome to <span className="text-primary-400 bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">Finspire</span>
          </h1>
          <p className="text-2xl font-medium text-primary-300 mb-2">
            Master your finances. Anywhere. Anytime.
          </p>
          <p className="text-lg text-gray-300 max-w-md mx-auto">
            Join thousands of users taking control of their financial future with AI-powered insights and personalized guidance.
          </p>
        </div>
        
        {/* Global Visual Cues */}
        <div className="flex justify-center items-center space-x-4 text-2xl opacity-60">
          <span>💰</span>
          <span>€</span>
          <span>£</span>
          <span>¥</span>
          <span>₹</span>
          <span>$</span>
        </div>
        
        {/* Diverse User Representation */}
        <div className="flex justify-center items-center space-x-2 text-3xl">
          <span>👨‍💼</span>
          <span>👩‍🎓</span>
          <span>👨‍💻</span>
          <span>👩‍🏫</span>
          <span>👨‍🔬</span>
        </div>
      </div>

      {/* Key Features Preview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl border border-green-500/30 hover:scale-105 transition-transform">
          <DollarSign size={32} className="mx-auto text-green-400 mb-3" />
          <h3 className="font-semibold text-white mb-1">Smart Tracking</h3>
          <p className="text-xs text-gray-300">AI-powered expense categorization</p>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl border border-blue-500/30 hover:scale-105 transition-transform">
          <Target size={32} className="mx-auto text-blue-400 mb-3" />
          <h3 className="font-semibold text-white mb-1">Goal Achievement</h3>
          <p className="text-xs text-gray-300">Personalized savings strategies</p>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl border border-purple-500/30 hover:scale-105 transition-transform">
          <PieChart size={32} className="mx-auto text-purple-400 mb-3" />
          <h3 className="font-semibold text-white mb-1">Smart Budgets</h3>
          <p className="text-xs text-gray-300">Adaptive spending limits</p>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl border border-orange-500/30 hover:scale-105 transition-transform">
          <Globe size={32} className="mx-auto text-orange-400 mb-3" />
          <h3 className="font-semibold text-white mb-1">Global Ready</h3>
          <p className="text-xs text-gray-300">40+ currencies supported</p>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-500/20">
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-300">
          <div className="flex items-center space-x-2">
            <Shield size={16} className="text-green-400" />
            <span>Bank-level Security</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users size={16} className="text-blue-400" />
            <span>10K+ Users</span>
          </div>
          <div className="flex items-center space-x-2">
            <Heart size={16} className="text-red-400" />
            <span>4.8★ Rating</span>
          </div>
        </div>
      </div>

      {/* Quick Setup Promise */}
      <div className="bg-primary-500/20 rounded-xl p-4 border border-primary-500/30">
        <h3 className="font-semibold text-white mb-2">Quick 2-Minute Setup</h3>
        <p className="text-sm text-primary-200">
          Answer a few questions to personalize your experience. We'll create your custom dashboard, set up smart budgets, and activate AI insights tailored just for you.
        </p>
      </div>

      <Button onClick={onNext} className="w-full py-4 text-lg bg-gradient-to-r from-primary-500 to-blue-500 hover:from-primary-600 hover:to-blue-600 shadow-xl">
        <Sparkles size={20} className="mr-2" />
        Start Your Financial Journey
      </Button>
      
      <p className="text-xs text-gray-500">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
};