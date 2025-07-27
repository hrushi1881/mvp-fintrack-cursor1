import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Target, FileText, Calendar } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Goal } from '../../types';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface GoalFormData {
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
}

interface GoalFormProps {
  onSubmit: (data: Omit<Goal, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<GoalFormData>;
}

const goalCategories = ['Emergency', 'Travel', 'Education', 'Home', 'Investment', 'Other'];

export const GoalForm: React.FC<GoalFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  const { currency } = useInternationalization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<GoalFormData>({
    defaultValues: {
      currentAmount: initialData?.currentAmount || 0,
      title: initialData?.title || '',
      description: initialData?.description || '',
      targetAmount: initialData?.targetAmount || undefined,
      targetDate: initialData?.targetDate || '',
      category: initialData?.category || ''
    },
  });

  const handleFormSubmit = async (data: GoalFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Ensure numeric values are properly converted and validated
      const targetAmount = Number(data.targetAmount) || 0;
      const currentAmount = Number(data.currentAmount) || 0;
      
      if (targetAmount <= 0) {
        setError('Target amount must be greater than 0');
        return;
      }
      
      if (currentAmount < 0) {
        setError('Current amount cannot be negative');
        return;
      }
      
      if (currentAmount > targetAmount) {
        setError('Current amount cannot exceed target amount');
        return;
      }
      
      await onSubmit({
        ...data,
        targetAmount,
        currentAmount,
        targetDate: new Date(data.targetDate),
      });
      
    } catch (error: any) {
      console.error('Error submitting goal:', error);
      setError(error.message || 'Failed to save goal. Please try again.');
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
      <div className="bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-xl p-4 mb-6 border border-primary-500/30">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
          <Target size={20} className="mr-2 text-primary-400" />
          {initialData ? 'Edit Financial Goal' : 'New Financial Goal'}
        </h3>
        <p className="text-gray-300 text-sm">
          {initialData 
            ? 'Update your goal details to stay on track with your financial journey.'
            : 'Set clear targets for your financial journey. Track your progress and stay motivated!'}
        </p>
      </div>

      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <Input
          label="Goal Title"
          type="text"
          icon={<Target size={18} className="text-primary-400" />}
          {...register('title', { required: 'Goal title is required' })}
          error={errors.title?.message}
          className="bg-black/40 border-white/20 text-white"
          placeholder="e.g., Dream Vacation, New Car"
        />
      </div>

      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <Input
          label="Description"
          type="text"
          icon={<FileText size={18} className="text-blue-400" />}
          {...register('description', { required: 'Description is required' })}
          error={errors.description?.message}
          className="bg-black/40 border-white/20 text-white"
          placeholder="What are you saving for?"
        />
      </div>

      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <Input
          label="Target Amount"
          type="number"
          step="0.01"
          icon={<CurrencyIcon currencyCode={currency.code} className="text-green-400" />}
          {...register('targetAmount', {
            required: 'Target amount is required',
            min: { value: 1, message: 'Target amount must be greater than 0' },
          })}
          error={errors.targetAmount?.message}
          className="bg-black/40 border-white/20 text-white"
          placeholder={`e.g., 5000`}
        />
      </div>

      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <Input
          label="Current Amount"
          type="number"
          step="0.01"
          icon={<CurrencyIcon currencyCode={currency.code} className="text-yellow-400" />}
          {...register('currentAmount', {
            min: { value: 0, message: 'Current amount cannot be negative' },
          })}
          error={errors.currentAmount?.message}
          className="bg-black/40 border-white/20 text-white"
          placeholder="0"
          helpText="How much have you already saved towards this goal?"
        />
      </div>

      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Category
        </label>
        <select
          {...register('category', { required: 'Category is required' })}
          className="block w-full rounded-xl border-white/20 bg-black/40 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
        >
          <option value="" className="bg-black/90">Select a category</option>
          {goalCategories.map((category) => (
            <option key={category} value={category} className="bg-black/90">
              {category}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-sm text-error-400 mt-1">{errors.category.message}</p>
        )}
      </div>

      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <Input
          label="Target Date"
          type="date"
          icon={<Calendar size={18} className="text-purple-400" />}
          {...register('targetDate', { required: 'Target date is required' })}
          error={errors.targetDate?.message}
          className="bg-black/40 border-white/20 text-white"
        />
      </div>

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
          {initialData ? 'Update Goal' : 'Create Goal'}
        </Button>
      </div>
    </form>
  );
};