import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Calculator, Tag, Calendar, AlertCircle } from 'lucide-react';
import { validateBudget, sanitizeFinancialData, toNumber } from '../../utils/validation';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Budget } from '../../types';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { useFinance } from '../../contexts/FinanceContext';

interface BudgetFormData {
  category: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
}

interface BudgetFormProps {
  initialData?: Budget;
  onSubmit: (data: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'spent'>) => Promise<void>;
  onCancel: () => void;
}

const periodOptions = [
  { value: 'weekly', label: 'Weekly', description: 'Reset every week' },
  { value: 'monthly', label: 'Monthly', description: 'Most common choice' },
  { value: 'yearly', label: 'Yearly', description: 'Annual planning' }
];

export const BudgetForm: React.FC<BudgetFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { currency } = useInternationalization();
  const { userCategories } = useFinance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<BudgetFormData>({
    defaultValues: initialData ? {
      category: initialData.category,
      amount: initialData.amount,
      period: initialData.period,
    } : {
      period: 'monthly',
    },
  });

  const selectedPeriod = watch('period');
  
  // Get expense categories (with fallback to default categories)
  const defaultExpenseCategories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other'];
  const userExpenseCategories = userCategories.filter(c => c.type === 'expense');
  const expenseCategories = userExpenseCategories.length > 0 
    ? userExpenseCategories.map(c => c.name)
    : defaultExpenseCategories;

  const handleFormSubmit = async (data: BudgetFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Sanitize and validate data
      const sanitizedData = sanitizeFinancialData(data, ['amount']);
      const validatedData = validateBudget({
        ...sanitizedData,
        amount: toNumber(sanitizedData.amount),
      });
      
      await onSubmit({
        ...validatedData,
        spent: initialData?.spent || 0,
      });
      
    } catch (error: any) {
      console.error('Error submitting budget:', error);
      setError(error.message || 'Failed to save budget. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
      
      {/* Header with Info */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 mb-6 border border-blue-500/30">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
          <Calculator size={20} className="mr-2 text-blue-400" />
          {initialData ? 'Update Budget' : 'Create New Budget'}
        </h3>
        <p className="text-gray-300 text-sm">
          Set spending limits for different categories to keep your finances on track.
        </p>
      </div>

      {/* Category Selection */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
          <Tag size={16} className="mr-2 text-yellow-400" />
          Category
        </label>
        <select
          {...register('category', { required: 'Category is required' })}
          className="block w-full rounded-xl border-white/20 bg-black/40 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
        >
          <option value="" className="bg-black/90">Select a category</option>
          {expenseCategories.map((category) => (
            <option key={category.id} value={category.name} className="bg-black/90">
              {category.name}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-sm text-error-400 mt-1">{errors.category.message}</p>
        )}
      </div>

      {/* Budget Amount */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <Input
          label="Budget Amount"
          type="number"
          step="0.01"
          icon={<CurrencyIcon currencyCode={currency.code} className="text-green-400" />}
          {...register('amount', {
            required: 'Budget amount is required',
            min: { value: 0.01, message: 'Amount must be greater than 0' },
          })}
          error={errors.amount?.message}
          className="bg-black/40 border-white/20 text-white"
          placeholder={`e.g., 500`}
        />
      </div>

      {/* Period Selection */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
          <Calendar size={16} className="mr-2 text-purple-400" />
          Budget Period
        </label>
        <div className="space-y-2">
          {periodOptions.map((option) => (
            <label key={option.value} className="cursor-pointer block">
              <input
                type="radio"
                value={option.value}
                {...register('period', { required: 'Period is required' })}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 transition-colors ${
                selectedPeriod === option.value 
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm opacity-80">{option.description}</p>
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
        {errors.period && (
          <p className="text-sm text-error-400 mt-1">{errors.period.message}</p>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
        <div className="flex items-center text-blue-400 mb-2">
          <Calculator size={16} className="mr-2" />
          <span className="font-medium">Budget Tracking</span>
        </div>
        <p className="text-sm text-blue-300">
          Your spending will be automatically tracked based on expense transactions in this category.
          The budget will reset at the beginning of each {selectedPeriod} period.
        </p>
      </div>

      {/* Actions */}
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
          className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
          loading={isSubmitting}
        >
          {initialData ? 'Update Budget' : 'Create Budget'}
        </Button>
      </div>
    </form>
  );
};