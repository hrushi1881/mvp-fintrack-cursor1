import React from 'react';
import { Users, GraduationCap, Briefcase, Code, Building, Heart, Zap } from 'lucide-react';
import { Button } from '../common/Button';
import { useForm } from 'react-hook-form';

interface UserClassificationData {
  userTypes: string[];
  experience: 'beginner' | 'intermediate' | 'advanced';
  primaryFocus: string[];
}

interface OnboardingUserClassificationProps {
  onNext: (data: UserClassificationData) => void;
  onPrev: () => void;
  initialData?: Partial<UserClassificationData>;
  canGoBack?: boolean;
}

export const OnboardingUserClassification: React.FC<OnboardingUserClassificationProps> = ({ 
  onNext, 
  onPrev, 
  initialData,
  canGoBack = true
}) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<UserClassificationData>({
    defaultValues: {
      userTypes: [],
      primaryFocus: [],
      ...initialData
    }
  });

  const selectedUserTypes = watch('userTypes') || [];
  const selectedFocus = watch('primaryFocus') || [];
  const experience = watch('experience');

  const userTypeOptions = [
    { 
      id: 'student', 
      label: 'Student', 
      icon: GraduationCap, 
      color: 'blue',
      description: 'Managing education expenses and pocket money',
      features: ['budgeting', 'savings_goals', 'expense_tracking']
    },
    { 
      id: 'employee', 
      label: 'Employee', 
      icon: Briefcase, 
      color: 'green',
      description: 'Regular salary and career-focused planning',
      features: ['salary_tracking', 'retirement_planning', 'tax_optimization']
    },
    { 
      id: 'freelancer', 
      label: 'Freelancer', 
      icon: Code, 
      color: 'purple',
      description: 'Irregular income and project-based work',
      features: ['income_tracking', 'cash_flow', 'tax_planning', 'invoicing']
    },
    { 
      id: 'business_owner', 
      label: 'Business Owner', 
      icon: Building, 
      color: 'orange',
      description: 'Managing business finances and growth',
      features: ['business_tracking', 'investment_planning', 'cash_flow', 'tax_optimization']
    },
    { 
      id: 'retiree', 
      label: 'Retiree', 
      icon: Heart, 
      color: 'pink',
      description: 'Fixed income and expense management',
      features: ['expense_tracking', 'healthcare_budgeting', 'fixed_income']
    },
    { 
      id: 'investor', 
      label: 'Investor', 
      icon: Zap, 
      color: 'yellow',
      description: 'Portfolio management and wealth building',
      features: ['investment_tracking', 'portfolio_analysis', 'market_insights']
    },
  ];

  const focusOptions = [
    { id: 'save_more', label: 'Save More Money', icon: '💰', priority: 'high' },
    { id: 'track_expenses', label: 'Track Expenses', icon: '📊', priority: 'high' },
    { id: 'pay_off_debt', label: 'Pay Off Debt', icon: '💳', priority: 'high' },
    { id: 'invest_better', label: 'Invest Smarter', icon: '📈', priority: 'medium' },
    { id: 'plan_retirement', label: 'Plan Retirement', icon: '🏖️', priority: 'medium' },
    { id: 'buy_house', label: 'Buy a House', icon: '🏠', priority: 'medium' },
    { id: 'start_business', label: 'Start a Business', icon: '🚀', priority: 'low' },
    { id: 'travel_more', label: 'Travel More', icon: '✈️', priority: 'low' },
  ];

  const experienceOptions = [
    {
      value: 'beginner',
      label: 'Beginner',
      description: 'New to personal finance',
      icon: '🌱',
      features: ['guided_tutorials', 'simple_interface', 'basic_tips']
    },
    {
      value: 'intermediate',
      label: 'Intermediate',
      description: 'Some experience with budgeting',
      icon: '📈',
      features: ['advanced_analytics', 'goal_tracking', 'investment_basics']
    },
    {
      value: 'advanced',
      label: 'Advanced',
      description: 'Experienced with investments',
      icon: '🎯',
      features: ['complex_analytics', 'portfolio_tracking', 'tax_optimization']
    }
  ];

  const toggleUserType = (typeId: string) => {
    const currentTypes = selectedUserTypes;
    const newTypes = currentTypes.includes(typeId)
      ? currentTypes.filter(id => id !== typeId)
      : [...currentTypes, typeId];
    setValue('userTypes', newTypes);
  };

  const toggleFocus = (focusId: string) => {
    const currentFocus = selectedFocus;
    const newFocus = currentFocus.includes(focusId)
      ? currentFocus.filter(id => id !== focusId)
      : [...currentFocus, focusId];
    setValue('primaryFocus', newFocus);
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors = {
      blue: isSelected ? 'border-blue-500 bg-blue-500/20 text-blue-400' : 'border-white/20 hover:border-blue-400/50',
      green: isSelected ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-white/20 hover:border-green-400/50',
      purple: isSelected ? 'border-purple-500 bg-purple-500/20 text-purple-400' : 'border-white/20 hover:border-purple-400/50',
      orange: isSelected ? 'border-orange-500 bg-orange-500/20 text-orange-400' : 'border-white/20 hover:border-orange-400/50',
      pink: isSelected ? 'border-pink-500 bg-pink-500/20 text-pink-400' : 'border-white/20 hover:border-pink-400/50',
      yellow: isSelected ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400' : 'border-white/20 hover:border-yellow-400/50',
    };
    return colors[color as keyof typeof colors];
  };

  const onSubmit = (data: UserClassificationData) => {
    console.log('🔄 User classification data:', data);
    onNext(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users size={32} className="text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">What best describes you?</h2>
        <p className="text-gray-400">Help us personalize your experience (select all that apply)</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* User Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            I am a... (Select all that apply)
          </label>
          <div className="grid grid-cols-2 gap-3">
            {userTypeOptions.map((type) => {
              const isSelected = selectedUserTypes.includes(type.id);
              const IconComponent = type.icon;
              
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => toggleUserType(type.id)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${getColorClasses(type.color, isSelected)}`}
                >
                  <div className="flex items-start space-x-3">
                    <IconComponent size={24} className="opacity-80 mt-1" />
                    <div>
                      <h4 className="font-semibold mb-1">{type.label}</h4>
                      <p className="text-xs opacity-80">{type.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {selectedUserTypes.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">Select at least one to continue</p>
          )}
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Financial Experience Level
          </label>
          <div className="space-y-2">
            {experienceOptions.map((option) => (
              <label key={option.value} className="cursor-pointer">
                <input
                  type="radio"
                  value={option.value}
                  {...register('experience', { required: 'Please select your experience level' })}
                  className="sr-only"
                />
                <div className={`p-4 rounded-lg border-2 transition-colors ${
                  experience === option.value 
                    ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                    : 'border-white/20 hover:border-white/30 text-gray-300'
                }`}>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm opacity-80">{option.description}</p>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
          {errors.experience && (
            <p className="text-sm text-error-400 mt-1">{errors.experience.message}</p>
          )}
        </div>

        {/* Primary Focus */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            What's your main financial focus? (Select up to 3)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {focusOptions.map((focus) => {
              const isSelected = selectedFocus.includes(focus.id);
              
              return (
                <button
                  key={focus.id}
                  type="button"
                  onClick={() => toggleFocus(focus.id)}
                  disabled={!isSelected && selectedFocus.length >= 3}
                  className={`p-3 rounded-lg border-2 transition-colors text-left ${
                    isSelected 
                      ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                      : selectedFocus.length >= 3
                      ? 'border-white/10 text-gray-500 cursor-not-allowed'
                      : 'border-white/20 hover:border-white/30 text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{focus.icon}</span>
                    <span className="font-medium text-sm">{focus.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Selected: {selectedFocus.length}/3
          </p>
        </div>

        {/* Personalization Preview */}
        {(selectedUserTypes.length > 0 || selectedFocus.length > 0) && (
          <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
            <div className="flex items-start space-x-2">
              <Zap size={16} className="text-green-400 mt-0.5" />
              <div>
                <p className="text-green-400 font-medium text-sm">Personalization Preview</p>
                <div className="text-green-300 text-xs mt-1 space-y-1">
                  {selectedUserTypes.includes('student') && (
                    <p>• Daily spending limits and budget alerts activated</p>
                  )}
                  {selectedUserTypes.includes('freelancer') && (
                    <p>• Irregular income tracking and cash flow analysis enabled</p>
                  )}
                  {selectedFocus.includes('save_more') && (
                    <p>• Savings goals dashboard and automated tips prioritized</p>
                  )}
                  {selectedFocus.includes('pay_off_debt') && (
                    <p>• Debt payoff strategies and EMI tracking activated</p>
                  )}
                  {experience === 'beginner' && (
                    <p>• Guided tutorials and simplified interface enabled</p>
                  )}
                  {experience === 'advanced' && (
                    <p>• Advanced analytics and investment tracking unlocked</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex space-x-3 pt-4">
          {canGoBack && (
            <Button type="button" variant="outline" onClick={onPrev} className="flex-1">
              Back
            </Button>
          )}
          <Button 
            type="submit" 
            className="flex-1"
            disabled={selectedUserTypes.length === 0}
          >
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
};