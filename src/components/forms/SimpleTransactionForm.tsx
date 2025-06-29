import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, AlertCircle, Zap } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Transaction } from '../../types';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { useFinance } from '../../contexts/FinanceContext';

interface TransactionFormData {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
}

interface SimpleTransactionFormProps {
  onSubmit: (data: Omit<Transaction, 'id' | 'userId' | 'date'>) => Promise<void>;
  onCancel: () => void;
  initialType?: 'income' | 'expense';
}

const quickCategories = {
  income: ['Salary', 'Freelance', 'Investment', 'Other'],
  expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Other'],
};

export const SimpleTransactionForm: React.FC<SimpleTransactionFormProps> = ({
  onSubmit,
  onCancel,
  initialType = 'expense',
}) => {
  const { currency } = useInternationalization();
  const { userCategories } = useFinance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAiCategorizing, setIsAiCategorizing] = useState(false);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TransactionFormData>({
    defaultValues: {
      type: initialType,
    },
  });

  const type = watch('type');
  const description = watch('description');
  
  // Get available categories based on type
  const availableCategories = userCategories
    .filter(c => c.type === type)
    .map(c => c.name);
  
  // Use quick categories as fallback
  const categories = availableCategories.length > 0 
    ? availableCategories 
    : quickCategories[type];

  const handleFormSubmit = async (data: TransactionFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      await onSubmit({
        ...data,
        amount: Number(data.amount),
      });
      
      onCancel();
    } catch (error: any) {
      console.error('Error submitting transaction:', error);
      setError(error.message || 'Failed to save transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
        setValue('category', 'Transport');
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

  // Auto-categorize when description changes
  useEffect(() => {
    if (description && description.length > 5) {
      const debounceTimer = setTimeout(() => {
        handleAiCategorize();
      }, 500);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [description]);

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
        <h3 className="text-lg font-semibold text-white mb-2">Quick Transaction</h3>
        <p className="text-gray-300 text-sm">
          Add a simple transaction to your account in just a few seconds.
        </p>
      </div>

      {/* Type Selection */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Transaction Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="cursor-pointer">
            <input
              type="radio"
              value="income"
              {...register('type')}
              className="sr-only"
            />
            <div className={`p-4 rounded-xl border-2 text-center transition-colors ${type === 'income' 
              ? 'border-success-500 bg-success-500/20 text-success-400' 
              : 'border-white/20 hover:border-white/30 text-gray-300'
            }`}>
              Income
            </div>
          </label>
          <label className="cursor-pointer">
            <input
              type="radio"
              value="expense"
              {...register('type')}
              className="sr-only"
            />
            <div className={`p-4 rounded-xl border-2 text-center transition-colors ${type === 'expense' 
              ? 'border-error-500 bg-error-500/20 text-error-400' 
              : 'border-white/20 hover:border-white/30 text-gray-300'
            }`}>
              Expense
            </div>
          </label>
        </div>
      </div>

      {/* Amount */}
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
          className="bg-black/40 border-white/20 text-white"
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

      {/* Quick Category Selection */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Category
        </label>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((category) => (
            <label key={category} className="cursor-pointer">
              <input
                type="radio"
                value={category}
                {...register('category', { required: 'Category is required' })}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 text-center text-sm transition-colors ${
                watch('category') === category
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                {category}
              </div>
            </label>
          ))}
        </div>
        {errors.category && (
          <p className="text-sm text-error-400 mt-1">{errors.category.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-3 pt-4">
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
          Add {type === 'income' ? 'Income' : 'Expense'}
        </Button>
      </div>
    </form>
  );
};