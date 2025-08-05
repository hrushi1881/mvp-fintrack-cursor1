import React from 'react';
import { useForm } from 'react-hook-form';
import { Briefcase, DollarSign, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface IncomeSourceFormData {
  name: string;
  type: 'salary' | 'freelance' | 'business' | 'investment' | 'rental' | 'other';
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  isActive: boolean;
  reliability: 'high' | 'medium' | 'low';
  nextExpected?: string;
}

interface IncomeSourceFormProps {
  initialData?: any;
  onSubmit: (data: IncomeSourceFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const IncomeSourceForm: React.FC<IncomeSourceFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const { currency } = useInternationalization();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<IncomeSourceFormData>({
    defaultValues: initialData || {
      type: 'salary',
      frequency: 'monthly',
      isActive: true,
      reliability: 'high'
    }
  });

  const selectedType = watch('type');
  const selectedFrequency = watch('frequency');

  const typeOptions = [
    { value: 'salary', label: 'Salary', icon: '💼', description: 'Regular employment income' },
    { value: 'freelance', label: 'Freelance', icon: '💻', description: 'Project-based work' },
    { value: 'business', label: 'Business', icon: '🏢', description: 'Business revenue' },
    { value: 'investment', label: 'Investment', icon: '📈', description: 'Dividends, interest' },
    { value: 'rental', label: 'Rental', icon: '🏠', description: 'Property rental income' },
    { value: 'other', label: 'Other', icon: '💰', description: 'Other income sources' }
  ];

  const frequencyOptions = [
    { value: 'weekly', label: 'Weekly', description: 'Every week' },
    { value: 'monthly', label: 'Monthly', description: 'Every month' },
    { value: 'yearly', label: 'Yearly', description: 'Once per year' }
  ];

  const reliabilityOptions = [
    { value: 'high', label: 'High', description: 'Very predictable', color: 'success' },
    { value: 'medium', label: 'Medium', description: 'Somewhat predictable', color: 'warning' },
    { value: 'low', label: 'Low', description: 'Unpredictable', color: 'error' }
  ];

  const handleFormSubmit = async (data: IncomeSourceFormData) => {
    await onSubmit({
      ...data,
      amount: Number(data.amount),
      nextExpected: data.nextExpected ? new Date(data.nextExpected) : undefined
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Income Source Name */}
      <Input
        label="Income Source Name"
        type="text"
        placeholder="e.g., Main Job, Freelance Client"
        icon={<Briefcase size={18} className="text-blue-400" />}
        {...register('name', { required: 'Name is required' })}
        error={errors.name?.message}
        className="bg-black/20 border-white/20 text-white"
      />

      {/* Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Income Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {typeOptions.map((option) => (
            <label key={option.value} className="cursor-pointer">
              <input
                type="radio"
                value={option.value}
                {...register('type', { required: 'Type is required' })}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 transition-colors ${
                selectedType === option.value
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <div className="text-center">
                  <div className="text-xl mb-1">{option.icon}</div>
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs opacity-80">{option.description}</p>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Amount and Frequency */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Amount"
          type="number"
          step="0.01"
          placeholder="5000"
          icon={<CurrencyIcon currencyCode={currency.code} className="text-success-400" />}
          {...register('amount', {
            required: 'Amount is required',
            min: { value: 0.01, message: 'Amount must be greater than 0' }
          })}
          error={errors.amount?.message}
          className="bg-black/20 border-white/20 text-white"
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Frequency
          </label>
          <select
            {...register('frequency', { required: 'Frequency is required' })}
            className="block w-full rounded-xl border-white/20 bg-black/20 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
          >
            {frequencyOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-black/90">
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reliability */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Reliability
        </label>
        <div className="grid grid-cols-3 gap-3">
          {reliabilityOptions.map((option) => (
            <label key={option.value} className="cursor-pointer">
              <input
                type="radio"
                value={option.value}
                {...register('reliability', { required: 'Reliability is required' })}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                watch('reliability') === option.value
                  ? `border-${option.color}-500 bg-${option.color}-500/20 text-${option.color}-400`
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <p className="font-medium text-sm">{option.label}</p>
                <p className="text-xs opacity-80">{option.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Next Expected Date */}
      <Input
        label="Next Expected Date (Optional)"
        type="date"
        icon={<Calendar size={18} className="text-purple-400" />}
        {...register('nextExpected')}
        className="bg-black/20 border-white/20 text-white"
      />

      {/* Active Status */}
      <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/10">
        <div>
          <p className="font-medium text-white">Active Source</p>
          <p className="text-sm text-gray-400">Include in income calculations</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            {...register('isActive')}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
        </label>
      </div>

      {/* Actions */}
      <div className="flex space-x-3 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1"
          loading={isSubmitting}
        >
          {initialData ? 'Update' : 'Add'} Income Source
        </Button>
      </div>
    </form>
  );
};