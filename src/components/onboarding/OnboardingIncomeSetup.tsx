import React from 'react';
import { DollarSign, Calendar, TrendingUp, Briefcase, Code, Building, Gift } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useForm } from 'react-hook-form';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface IncomeSource {
  type: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly' | 'irregular';
  description: string;
}

interface IncomeSetupData {
  incomeSources: IncomeSource[];
  totalMonthlyIncome: number;
  incomeStability: 'stable' | 'variable' | 'irregular';
}

interface OnboardingIncomeSetupProps {
  onNext: (data: IncomeSetupData) => void;
  onPrev: () => void;
  initialData?: Partial<IncomeSetupData>;
  canGoBack?: boolean;
}

export const OnboardingIncomeSetup: React.FC<OnboardingIncomeSetupProps> = ({ 
  onNext, 
  onPrev, 
  initialData,
  canGoBack = true
}) => {
  const { currency } = useInternationalization();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<IncomeSetupData>({
    defaultValues: {
      incomeSources: [{ type: 'salary', amount: 0, frequency: 'monthly', description: '' }],
      totalMonthlyIncome: 0,
      incomeStability: 'stable',
      ...initialData
    }
  });

  const incomeSources = watch('incomeSources') || [];
  const incomeStability = watch('incomeStability');

  const incomeTypeOptions = [
    { id: 'salary', label: 'Salary', icon: Briefcase, frequency: 'monthly', stability: 'stable' },
    { id: 'freelance', label: 'Freelance', icon: Code, frequency: 'irregular', stability: 'variable' },
    { id: 'business', label: 'Business', icon: Building, frequency: 'monthly', stability: 'variable' },
    { id: 'investment', label: 'Investment', icon: TrendingUp, frequency: 'monthly', stability: 'stable' },
    { id: 'rental', label: 'Rental Income', icon: Building, frequency: 'monthly', stability: 'stable' },
    { id: 'allowance', label: 'Allowance', icon: Gift, frequency: 'monthly', stability: 'stable' },
    { id: 'pension', label: 'Pension', icon: Calendar, frequency: 'monthly', stability: 'stable' },
    { id: 'other', label: 'Other', icon: DollarSign, frequency: 'monthly', stability: 'variable' },
  ];

  const addIncomeSource = () => {
    const newSource: IncomeSource = {
      type: 'salary',
      amount: 0,
      frequency: 'monthly',
      description: ''
    };
    setValue('incomeSources', [...incomeSources, newSource]);
  };

  const removeIncomeSource = (index: number) => {
    if (incomeSources.length > 1) {
      const newSources = incomeSources.filter((_, i) => i !== index);
      setValue('incomeSources', newSources);
    }
  };

  const updateIncomeSource = (index: number, field: keyof IncomeSource, value: any) => {
    const newSources = [...incomeSources];
    newSources[index] = { ...newSources[index], [field]: value };
    setValue('incomeSources', newSources);
    
    // Auto-calculate total monthly income
    calculateTotalMonthlyIncome(newSources);
  };

  const calculateTotalMonthlyIncome = (sources: IncomeSource[]) => {
    const total = sources.reduce((sum, source) => {
      let monthlyAmount = source.amount;
      
      switch (source.frequency) {
        case 'weekly':
          monthlyAmount = source.amount * 4.33;
          break;
        case 'yearly':
          monthlyAmount = source.amount / 12;
          break;
        case 'irregular':
          monthlyAmount = source.amount; // Assume user enters monthly average
          break;
        default:
          monthlyAmount = source.amount;
      }
      
      return sum + monthlyAmount;
    }, 0);
    
    setValue('totalMonthlyIncome', total);
    
    // Determine income stability
    const hasIrregular = sources.some(s => s.frequency === 'irregular' || s.type === 'freelance');
    const hasMultipleSources = sources.length > 1;
    
    if (hasIrregular) {
      setValue('incomeStability', 'irregular');
    } else if (hasMultipleSources) {
      setValue('incomeStability', 'variable');
    } else {
      setValue('incomeStability', 'stable');
    }
  };

  const onSubmit = (data: IncomeSetupData) => {
    console.log('🔄 Income setup data:', data);
    onNext(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign size={32} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Tell us about your income</h2>
        <p className="text-gray-400">This helps us create personalized budgets and insights</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Income Sources */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-300">
              Income Sources
            </label>
            <Button
              type="button"
              size="sm"
              onClick={addIncomeSource}
              className="text-xs"
            >
              + Add Source
            </Button>
          </div>
          
          <div className="space-y-4">
            {incomeSources.map((source, index) => (
              <div key={index} className="bg-black/30 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-white">Income Source #{index + 1}</h4>
                  {incomeSources.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIncomeSource(index)}
                      className="text-error-400 hover:text-error-300 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Type</label>
                    <select
                      value={source.type}
                      onChange={(e) => updateIncomeSource(index, 'type', e.target.value)}
                      className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    >
                      {incomeTypeOptions.map(option => (
                        <option key={option.id} value={option.id} className="bg-black/90">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Frequency</label>
                    <select
                      value={source.frequency}
                      onChange={(e) => updateIncomeSource(index, 'frequency', e.target.value)}
                      className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="weekly" className="bg-black/90">Weekly</option>
                      <option value="monthly" className="bg-black/90">Monthly</option>
                      <option value="yearly" className="bg-black/90">Yearly</option>
                      <option value="irregular" className="bg-black/90">Irregular</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Amount</label>
                    <div className="relative">
                      <CurrencyIcon currencyCode={currency.code} size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={source.amount}
                        onChange={(e) => updateIncomeSource(index, 'amount', Number(e.target.value))}
                        className="w-full pl-10 pr-3 py-2 bg-black/40 border border-white/20 rounded-lg text-white text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Description</label>
                    <input
                      type="text"
                      value={source.description}
                      onChange={(e) => updateIncomeSource(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded-lg text-white text-sm"
                      placeholder="e.g., Main job"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Monthly Income Display */}
        <div className="bg-primary-500/20 rounded-xl p-4 border border-primary-500/30">
          <div className="text-center">
            <p className="text-primary-400 font-medium mb-1">Estimated Monthly Income</p>
            <p className="text-2xl font-bold text-white">
              <CurrencyIcon currencyCode={currency.code} size={20} className="inline mr-2" />
              {watch('totalMonthlyIncome')?.toLocaleString() || '0'}
            </p>
            <p className="text-xs text-primary-300 mt-1">
              Income Stability: <span className="capitalize font-medium">{incomeStability}</span>
            </p>
          </div>
        </div>

        {/* Income Insights */}
        <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
          <div className="flex items-start space-x-2">
            <TrendingUp size={16} className="text-blue-400 mt-0.5" />
            <div>
              <p className="text-blue-400 font-medium text-sm">Smart Insights</p>
              <div className="text-blue-300 text-xs mt-1 space-y-1">
                {incomeStability === 'stable' && (
                  <p>• We'll set up monthly budgets and predictable savings goals</p>
                )}
                {incomeStability === 'variable' && (
                  <p>• We'll create flexible budgets that adapt to income changes</p>
                )}
                {incomeStability === 'irregular' && (
                  <p>• We'll focus on cash flow management and emergency fund building</p>
                )}
                <p>• Recommended emergency fund: {currency.symbol}{((watch('totalMonthlyIncome') || 0) * 3).toLocaleString()}</p>
                <p>• Suggested savings rate: {currency.symbol}{((watch('totalMonthlyIncome') || 0) * 0.2).toLocaleString()} (20%)</p>
              </div>
            </div>
          </div>
        </div>

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
            disabled={!incomeSources.some(s => s.amount > 0)}
          >
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
};