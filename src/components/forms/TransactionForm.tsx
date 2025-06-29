import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, Tag, Calendar, Target, CreditCard, CheckCircle, AlertCircle, Plus, Minus, Zap } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Transaction, UserCategory } from '../../types';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface TransactionFormData {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface TransactionFormProps {
  onSubmit: (data: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  onCancel: () => void;
  initialType?: 'income' | 'expense';
  initialData?: Transaction;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  onCancel,
  initialType = 'expense',
  initialData,
}) => {
  const { goals, liabilities, updateGoal, updateLiability, userCategories } = useFinance();
  const { currency } = useInternationalization();
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [selectedLiability, setSelectedLiability] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAiCategorizing, setIsAiCategorizing] = useState(false);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TransactionFormData>({
    defaultValues: initialData ? {
      type: initialData.type,
      amount: initialData.amount,
      category: initialData.category,
      description: initialData.description,
      date: initialData.date.toISOString().split('T')[0],
    } : {
      type: initialType,
      date: new Date().toISOString().split('T')[0],
    },
  });

  const type = watch('type');
  const amount = watch('amount');
  const category = watch('category');
  const description = watch('description');
  
  // Get available categories based on type
  const availableCategories = userCategories.filter(c => c.type === type);

  // Set default category when type changes
  useEffect(() => {
    if (availableCategories.length > 0 && !category) {
      setValue('category', availableCategories[0].name);
    }
  }, [type, availableCategories, category, setValue]);

  const handleFormSubmit = async (data: TransactionFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Submit the main transaction
      await onSubmit({
        ...data,
        amount: Number(data.amount) || 0,
        date: new Date(data.date),
      });

      // Handle goal payment (only for new transactions, not edits)
      if (!initialData && selectedGoal && type === 'expense') {
        const goal = goals.find(g => g.id === selectedGoal);
        if (goal) {
          const newAmount = Math.min(
            (Number(goal.currentAmount) || 0) + (Number(data.amount) || 0), 
            (Number(goal.targetAmount) || 0)
          );
          await updateGoal(selectedGoal, { currentAmount: newAmount });
        }
      }

      // Handle liability payment (only for new transactions, not edits)
      if (!initialData && selectedLiability && type === 'expense') {
        const liability = liabilities.find(l => l.id === selectedLiability);
        if (liability) {
          const newAmount = Math.max(
            (Number(liability.remainingAmount) || 0) - (Number(data.amount) || 0), 
            0
          );
          await updateLiability(selectedLiability, { remainingAmount: newAmount });
        }
      }

      // Success - close the form
      onCancel();
    } catch (error: any) {
      console.error('Error submitting transaction:', error);
      setError(error.message || 'Failed to save transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setValue('type', newType);
    // Clear goal/liability selection when switching types
    setSelectedGoal('');
    setSelectedLiability('');
    // Clear category when switching types
    setValue('category', '');
  };

  const handleAiCategorize = async () => {
    if (!description) return;
    
    setIsAiCategorizing(true);
    try {
      // Simulate AI categorization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Determine transaction type and category based on description
      const lowerDescription = description.toLowerCase();
      
      // Simple keyword matching for demo purposes
      if (lowerDescription.includes('salary') || 
          lowerDescription.includes('income') || 
          lowerDescription.includes('payment received')) {
        setValue('type', 'income');
        setValue('category', 'Salary');
      } else if (lowerDescription.includes('freelance') || 
                lowerDescription.includes('client') || 
                lowerDescription.includes('project')) {
        setValue('type', 'income');
        setValue('category', 'Freelance');
      } else if (lowerDescription.includes('food') || 
                lowerDescription.includes('restaurant') || 
                lowerDescription.includes('grocery')) {
        setValue('type', 'expense');
        setValue('category', 'Food');
      } else if (lowerDescription.includes('transport') || 
                lowerDescription.includes('uber') || 
                lowerDescription.includes('gas') ||
                lowerDescription.includes('taxi')) {
        setValue('type', 'expense');
        setValue('category', 'Transportation');
      } else if (lowerDescription.includes('shopping') || 
                lowerDescription.includes('amazon') || 
                lowerDescription.includes('store')) {
        setValue('type', 'expense');
        setValue('category', 'Shopping');
      } else if (lowerDescription.includes('bill') || 
                lowerDescription.includes('utility') || 
                lowerDescription.includes('subscription')) {
        setValue('type', 'expense');
        setValue('category', 'Bills');
      }
    } catch (error) {
      console.error('Error categorizing transaction:', error);
    } finally {
      setIsAiCategorizing(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-error-500/20 border border-error-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle size={18} className="text-error-400" />
              <p className="text-error-400 text-sm">{error}</p>
            </div>
          </div>
        )}
        
        {/* Transaction Type Selection - Enhanced Design */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <label className="block text-sm font-medium text-gray-300 mb-4">
            What type of transaction is this?
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`relative p-6 rounded-2xl border-3 text-center transition-all duration-300 backdrop-blur-sm ${
                type === 'income' 
                  ? 'border-success-500 bg-success-500/20 text-success-400 shadow-xl shadow-success-500/25 scale-105 ring-4 ring-success-500/30' 
                  : 'border-white/20 hover:border-white/30 bg-black/20 text-gray-300 hover:bg-black/30 hover:scale-102'
              }`}
            >
              {/* Large Selection Indicator */}
              {type === 'income' && (
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-success-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle size={20} className="text-white" />
                </div>
              )}
              
              {/* Icon */}
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                type === 'income' ? 'bg-success-500 shadow-lg' : 'bg-gray-600'
              }`}>
                <Plus size={32} className="text-white" />
              </div>
              
              {/* Text */}
              <div>
                <p className={`font-bold text-xl mb-2 ${type === 'income' ? 'text-success-400' : 'text-gray-300'}`}>
                  Income
                </p>
                <p className={`text-sm ${type === 'income' ? 'text-success-300' : 'text-gray-400'}`}>
                  Money you receive
                </p>
                <p className={`text-xs mt-2 ${type === 'income' ? 'text-success-200' : 'text-gray-500'}`}>
                  Salary, freelance, gifts
                </p>
              </div>
              
              {/* Glow Effect */}
              {type === 'income' && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-success-500/10 to-success-400/10 pointer-events-none animate-pulse"></div>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`relative p-6 rounded-2xl border-3 text-center transition-all duration-300 backdrop-blur-sm ${
                type === 'expense' 
                  ? 'border-error-500 bg-error-500/20 text-error-400 shadow-xl shadow-error-500/25 scale-105 ring-4 ring-error-500/30' 
                  : 'border-white/20 hover:border-white/30 bg-black/20 text-gray-300 hover:bg-black/30 hover:scale-102'
              }`}
            >
              {/* Large Selection Indicator */}
              {type === 'expense' && (
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-error-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle size={20} className="text-white" />
                </div>
              )}
              
              {/* Icon */}
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                type === 'expense' ? 'bg-error-500 shadow-lg' : 'bg-gray-600'
              }`}>
                <Minus size={32} className="text-white" />
              </div>
              
              {/* Text */}
              <div>
                <p className={`font-bold text-xl mb-2 ${type === 'expense' ? 'text-error-400' : 'text-gray-300'}`}>
                  Expense
                </p>
                <p className={`text-sm ${type === 'expense' ? 'text-error-300' : 'text-gray-400'}`}>
                  Money you spend
                </p>
                <p className={`text-xs mt-2 ${type === 'expense' ? 'text-error-200' : 'text-gray-500'}`}>
                  Bills, food, shopping
                </p>
              </div>
              
              {/* Glow Effect */}
              {type === 'expense' && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-error-500/10 to-error-400/10 pointer-events-none animate-pulse"></div>
              )}
            </button>
          </div>
        </div>

        {/* Goal/Liability Payment Tags - Only show for new expense transactions */}
        {!initialData && type === 'expense' && (availableGoals.length > 0 || availableLiabilities.length > 0) && (
          <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-white flex items-center">
                <Tag size={18} className="mr-2 text-primary-400" />
                Payment Tags
              </h3>
              <p className="text-xs text-gray-400">
                Tag this expense as a payment towards a goal or debt (optional)
              </p>
            </div>

            <div className="space-y-6">
              {/* Goal Payments */}
              {availableGoals.length > 0 && (
                <div>
                  <div className="flex items-center mb-3">
                    <Target size={16} className="mr-2 text-primary-400" />
                    <h4 className="font-medium text-white">Pay towards Goal</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {availableGoals.slice(0, 3).map((goal) => (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => setSelectedGoal(selectedGoal === goal.id ? '' : goal.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          selectedGoal === goal.id
                            ? 'border-primary-500 bg-primary-500/10' 
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                selectedGoal === goal.id ? 'bg-primary-500' : 'bg-gray-600'
                              }`}>
                                <Target size={18} className="text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-base">{goal.title}</p>
                                <p className="text-sm opacity-80">
                                  <CurrencyIcon currencyCode={currency.code} size={14} className="inline mr-1" />
                                  {(Number(goal.currentAmount) || 0).toLocaleString()} / {(Number(goal.targetAmount) || 0).toLocaleString()}
                                </p>
                                <div className="w-32 bg-white/20 rounded-full h-2 mt-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      selectedGoal === goal.id ? 'bg-primary-400' : 'bg-gray-500'
                                    }`}
                                    style={{ width: `${Math.min(((Number(goal.currentAmount) || 0) / (Number(goal.targetAmount) || 1)) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          {selectedGoal === goal.id && (
                            <div className="ml-3">
                              <CheckCircle size={24} className="text-primary-400" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Liability Payments */}
              {availableLiabilities.length > 0 && (
                <div>
                  <div className="flex items-center mb-3">
                    <CreditCard size={16} className="mr-2 text-warning-400" />
                    <h4 className="font-medium text-white">Pay towards Debt</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {availableLiabilities.slice(0, 3).map((liability) => (
                      <button
                        key={liability.id}
                        type="button"
                        onClick={() => setSelectedLiability(selectedLiability === liability.id ? '' : liability.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          selectedLiability === liability.id
                            ? 'border-warning-500 bg-warning-500/20 text-warning-400 shadow-lg scale-102'
                            : 'border-white/20 hover:border-white/30 text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                selectedLiability === liability.id ? 'bg-warning-500' : 'bg-gray-600'
                              }`}>
                                <CreditCard size={18} className="text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-base">{liability.name}</p>
                                <p className="text-sm opacity-80">
                                  <CurrencyIcon currencyCode={currency.code} size={14} className="inline mr-1" />
                                  {(Number(liability.remainingAmount) || 0).toLocaleString()} remaining
                                </p>
                                <p className="text-xs opacity-60">
                                  Monthly: <CurrencyIcon currencyCode={currency.code} size={12} className="inline mr-1" />
                                  {(Number(liability.monthlyPayment) || 0).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          {selectedLiability === liability.id && (
                            <div className="ml-3">
                              <CheckCircle size={24} className="text-warning-400" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Preview */}
              {(selectedGoal || selectedLiability) && amount && (
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle size={20} className="text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-blue-400 font-semibold mb-1">Payment Preview</p>
                      <p className="text-blue-300 text-sm">
                        <CurrencyIcon currencyCode={currency.code} size={14} className="inline mr-1 text-blue-300" />
                        {(Number(amount) || 0).toLocaleString()} will be applied to{' '}
                        <span className="font-semibold">
                          {selectedGoal && goals.find(g => g.id === selectedGoal)?.title}
                          {selectedLiability && liabilities.find(l => l.id === selectedLiability)?.name}
                        </span>
                      </p>
                      <p className="text-blue-200 text-xs mt-1">
                        This will automatically update your {selectedGoal ? 'goal progress' : 'debt balance'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            icon={<CurrencyIcon currencyCode={currency.code} className={type === 'income' ? 'text-success-400' : 'text-error-400'} />}
            {...register('amount', {
              required: 'Amount is required',
              min: { value: 0.01, message: 'Amount must be greater than 0' },
            })}
            error={errors.amount?.message}
            className="bg-black/40 border-white/20 text-white text-lg"
            placeholder={`e.g., 100`}
          />
        </div>

        {/* Description with AI categorization */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              Description
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAiCategorize}
              className="text-xs border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              loading={isAiCategorizing}
              disabled={!description || description.length < 3}
            >
              <Zap size={12} className="mr-1" />
              AI Categorize
            </Button>
          </div>
          <Input
            type="text"
            icon={<FileText size={18} className="text-blue-400" />}
            {...register('description', { required: 'Description is required' })}
            error={errors.description?.message}
            className="bg-black/40 border-white/20 text-white"
            placeholder={`e.g., ${type === 'income' ? 'Salary payment' : 'Grocery shopping'}`}
          />
          {isAiCategorizing && (
            <p className="text-xs text-primary-400 mt-1 flex items-center">
              <span className="animate-pulse mr-1">✨</span> AI is analyzing your description...
            </p>
          )}
        </div>

        {/* Category Selection */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <label className="block text-sm font-medium text-gray-300 mb-4 flex items-center">
            <Tag size={16} className="mr-2 text-yellow-400" />
            Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {availableCategories.map((category) => (
              <label key={category.id} className="cursor-pointer">
                <input
                  type="radio"
                  value={category.name}
                  {...register('category', { required: 'Category is required' })}
                  className="sr-only"
                />
                <div className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                  watch('category') === category.name
                    ? 'border-primary-500 bg-primary-500/20 text-primary-400 shadow-lg scale-105'
                    : 'border-white/20 hover:border-white/30 text-gray-300 hover:bg-white/5'
                }`}>
                  {category.icon && <div className="text-xl mb-2">{category.icon}</div>}
                  <span className="font-medium">{category.name}</span>
                </div>
              </label>
            ))}
          </div>
          {errors.category && (
            <p className="text-sm text-error-400 mt-3">{errors.category.message}</p>
          )}
        </div>

        {/* Date */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <Input
            label="Date"
            type="date"
            icon={<Calendar size={18} className="text-purple-400" />}
            {...register('date', { required: 'Date is required' })}
            error={errors.date?.message}
            className="bg-black/40 border-white/20 text-white"
          />
        </div>

        {/* Submit Button */}
        <div className="flex space-x-4 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            className="flex-1 border-white/20 text-white hover:bg-white/10"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className={`flex-1 ${
              type === 'income' 
                ? 'bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700' 
                : 'bg-gradient-to-r from-error-500 to-error-600 hover:from-error-600 hover:to-error-700'
            }`}
            loading={isSubmitting}
          >
            {initialData ? 'Update' : 'Add'} {type === 'income' ? 'Income' : 'Expense'}
          </Button>
        </div>
      </form>
    </div>
  );
};

// Filter goals that are not yet complete
const availableGoals = goals => goals.filter(g => (Number(g.currentAmount) || 0) < (Number(g.targetAmount) || 0));

// Filter liabilities that still have a balance
const availableLiabilities = liabilities => liabilities.filter(l => (Number(l.remainingAmount) || 0) > 0);