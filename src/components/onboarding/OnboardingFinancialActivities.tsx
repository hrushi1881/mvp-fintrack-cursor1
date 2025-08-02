import React from 'react';
import { ToggleLeft, ToggleRight, TrendingUp, CreditCard, Building, Wallet, PiggyBank, Calculator } from 'lucide-react';
import { Button } from '../common/Button';
import { useForm } from 'react-hook-form';

interface FinancialActivitiesData {
  hasInvestments: boolean;
  hasDebts: boolean;
  hasMultipleIncomes: boolean;
  hasMultipleAccounts: boolean;
  usesCreditCards: boolean;
  hasEmergencyFund: boolean;
  tracksExpenses: boolean;
  usesBudgets: boolean;
}

interface OnboardingFinancialActivitiesProps {
  onNext: (data: FinancialActivitiesData) => void;
  onPrev: () => void;
  initialData?: Partial<FinancialActivitiesData>;
  canGoBack?: boolean;
}

export const OnboardingFinancialActivities: React.FC<OnboardingFinancialActivitiesProps> = ({ 
  onNext, 
  onPrev, 
  initialData,
  canGoBack = true
}) => {
  const { register, handleSubmit, watch, setValue } = useForm<FinancialActivitiesData>({
    defaultValues: {
      hasInvestments: false,
      hasDebts: false,
      hasMultipleIncomes: false,
      hasMultipleAccounts: false,
      usesCreditCards: false,
      hasEmergencyFund: false,
      tracksExpenses: false,
      usesBudgets: false,
      ...initialData
    }
  });

  const formData = watch();

  const activityOptions = [
    {
      key: 'hasInvestments' as keyof FinancialActivitiesData,
      label: 'Do you invest?',
      description: 'Stocks, bonds, mutual funds, crypto, etc.',
      icon: TrendingUp,
      color: 'green',
      features: ['investment_tracking', 'portfolio_analysis', 'market_insights']
    },
    {
      key: 'hasDebts' as keyof FinancialActivitiesData,
      label: 'Do you have loans or debts?',
      description: 'Credit cards, student loans, mortgages, EMIs',
      icon: CreditCard,
      color: 'red',
      features: ['debt_tracking', 'payoff_strategies', 'emi_reminders']
    },
    {
      key: 'hasMultipleIncomes' as keyof FinancialActivitiesData,
      label: 'Multiple income sources?',
      description: 'Salary + freelance, business, side hustles',
      icon: Building,
      color: 'blue',
      features: ['income_categorization', 'cash_flow_analysis', 'tax_planning']
    },
    {
      key: 'hasMultipleAccounts' as keyof FinancialActivitiesData,
      label: 'Multiple bank accounts?',
      description: 'Checking, savings, different banks',
      icon: Wallet,
      color: 'purple',
      features: ['account_aggregation', 'transfer_tracking', 'balance_overview']
    },
    {
      key: 'usesCreditCards' as keyof FinancialActivitiesData,
      label: 'Do you use credit cards?',
      description: 'Regular credit card usage and payments',
      icon: CreditCard,
      color: 'orange',
      features: ['credit_utilization', 'payment_reminders', 'rewards_tracking']
    },
    {
      key: 'hasEmergencyFund' as keyof FinancialActivitiesData,
      label: 'Do you have an emergency fund?',
      description: '3-6 months of expenses saved',
      icon: PiggyBank,
      color: 'yellow',
      features: ['emergency_tracking', 'fund_optimization', 'safety_alerts']
    },
    {
      key: 'tracksExpenses' as keyof FinancialActivitiesData,
      label: 'Do you currently track expenses?',
      description: 'Using apps, spreadsheets, or manual methods',
      icon: Calculator,
      color: 'indigo',
      features: ['expense_import', 'category_suggestions', 'spending_insights']
    },
    {
      key: 'usesBudgets' as keyof FinancialActivitiesData,
      label: 'Do you use budgets?',
      description: 'Monthly spending limits or budget plans',
      icon: PiggyBank,
      color: 'pink',
      features: ['budget_optimization', 'spending_alerts', 'category_limits']
    },
  ];

  const toggleActivity = (key: keyof FinancialActivitiesData) => {
    setValue(key, !formData[key]);
  };

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      green: isActive ? 'border-green-500 bg-green-500/20' : 'border-white/20 hover:border-green-400/50',
      red: isActive ? 'border-red-500 bg-red-500/20' : 'border-white/20 hover:border-red-400/50',
      blue: isActive ? 'border-blue-500 bg-blue-500/20' : 'border-white/20 hover:border-blue-400/50',
      purple: isActive ? 'border-purple-500 bg-purple-500/20' : 'border-white/20 hover:border-purple-400/50',
      orange: isActive ? 'border-orange-500 bg-orange-500/20' : 'border-white/20 hover:border-orange-400/50',
      yellow: isActive ? 'border-yellow-500 bg-yellow-500/20' : 'border-white/20 hover:border-yellow-400/50',
      indigo: isActive ? 'border-indigo-500 bg-indigo-500/20' : 'border-white/20 hover:border-indigo-400/50',
      pink: isActive ? 'border-pink-500 bg-pink-500/20' : 'border-white/20 hover:border-pink-400/50',
    };
    return colors[color as keyof typeof colors];
  };

  const getActiveFeatures = () => {
    const activeFeatures = new Set<string>();
    
    activityOptions.forEach(option => {
      if (formData[option.key]) {
        option.features.forEach(feature => activeFeatures.add(feature));
      }
    });
    
    return Array.from(activeFeatures);
  };

  const onSubmit = (data: FinancialActivitiesData) => {
    console.log('🔄 Financial activities data:', data);
    onNext(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calculator size={32} className="text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Your financial activities</h2>
        <p className="text-gray-400">Help us show you the most relevant features</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Activity Toggles */}
        <div className="space-y-3">
          {activityOptions.map((option) => {
            const isActive = formData[option.key];
            const IconComponent = option.icon;
            
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => toggleActivity(option.key)}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${getColorClasses(option.color, isActive)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-left">
                    <IconComponent size={24} className={`${isActive ? 'opacity-100' : 'opacity-60'}`} />
                    <div>
                      <p className={`font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>
                        {option.label}
                      </p>
                      <p className={`text-sm ${isActive ? 'opacity-80' : 'opacity-60'}`}>
                        {option.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {isActive ? (
                      <ToggleRight size={32} className="text-primary-400" />
                    ) : (
                      <ToggleLeft size={32} className="text-gray-500" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Feature Preview */}
        {getActiveFeatures().length > 0 && (
          <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
            <div className="flex items-start space-x-2">
              <TrendingUp size={16} className="text-green-400 mt-0.5" />
              <div>
                <p className="text-green-400 font-medium text-sm">Features We'll Activate</p>
                <div className="text-green-300 text-xs mt-1 grid grid-cols-2 gap-1">
                  {getActiveFeatures().slice(0, 6).map((feature, index) => (
                    <p key={index}>• {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  ))}
                  {getActiveFeatures().length > 6 && (
                    <p>• +{getActiveFeatures().length - 6} more features</p>
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
          <Button type="submit" className="flex-1">
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
};