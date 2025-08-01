import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, Tag, Calendar, Repeat, Clock, AlertCircle, Plus, Minus, TrendingUp, TrendingDown } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { RecurringTransaction } from '../../types';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface RecurringTransactionFormData {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  monthOfYear?: number;
  maxOccurrences?: number;
}

interface RecurringTransactionFormProps {
  initialData?: RecurringTransaction;
  onSubmit: (data: Omit<RecurringTransaction, 'id' | 'userId' | 'createdAt' | 'nextOccurrenceDate' | 'currentOccurrences' | 'isActive'>) => void;
  onCancel: () => void;
}

const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Business', 'Rental Income', 'Other'];
const expenseCategories = ['Housing', 'Food', 'Transportation', 'Entertainment', 'Healthcare', 'Shopping', 'Bills', 'Insurance', 'Subscriptions', 'Other'];

const frequencyOptions = [
  { value: 'daily', label: 'Daily', description: 'Every day', icon: '📅', example: 'Coffee purchase' },
  { value: 'weekly', label: 'Weekly', description: 'Every week', icon: '📆', example: 'Grocery shopping' },
  { value: 'monthly', label: 'Monthly', description: 'Every month', icon: '🗓️', example: 'Rent, salary' },
  { value: 'yearly', label: 'Yearly', description: 'Every year', icon: '📊', example: 'Insurance premium' },
];

const weekDays = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const RecurringTransactionForm: React.FC<RecurringTransactionFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const { currency } = useInternationalization();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RecurringTransactionFormData>({
    defaultValues: initialData ? {
      type: initialData.type,
      amount: initialData.amount,
      category: initialData.category,
      description: initialData.description,
      frequency: initialData.frequency,
      startDate: initialData.startDate.toISOString().split('T')[0],
      endDate: initialData.endDate?.toISOString().split('T')[0],
      dayOfWeek: initialData.dayOfWeek,
      dayOfMonth: initialData.dayOfMonth,
      monthOfYear: initialData.monthOfYear,
      maxOccurrences: initialData.maxOccurrences,
    } : {
      type: 'expense',
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const type = watch('type');
  const frequency = watch('frequency');
  const amount = watch('amount');
  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const calculateNextOccurrence = (startDate: Date, frequency: string, dayOfWeek?: number, dayOfMonth?: number, monthOfYear?: number): Date => {
    const next = new Date(startDate);
    
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        if (dayOfWeek !== undefined) {
          const daysUntilTarget = (dayOfWeek - next.getDay() + 7) % 7;
          next.setDate(next.getDate() + (daysUntilTarget || 7));
        } else {
          next.setDate(next.getDate() + 7);
        }
        break;
      case 'monthly':
        if (dayOfMonth !== undefined) {
          next.setMonth(next.getMonth() + 1);
          next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
        } else {
          next.setMonth(next.getMonth() + 1);
        }
        break;
      case 'yearly':
        if (monthOfYear !== undefined) {
          next.setFullYear(next.getFullYear() + 1);
          next.setMonth(monthOfYear - 1);
          if (dayOfMonth !== undefined) {
            next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), monthOfYear, 0).getDate()));
          }
        } else {
          next.setFullYear(next.getFullYear() + 1);
        }
        break;
    }
    
    return next;
  };

  const handleFormSubmit = (data: RecurringTransactionFormData) => {
    try {
      console.log('🔄 RecurringTransactionForm submitting:', data);
    const startDate = new Date(data.startDate);
    const nextOccurrenceDate = calculateNextOccurrence(
      startDate, 
      data.frequency, 
      data.dayOfWeek, 
      data.dayOfMonth, 
      data.monthOfYear
    );

    const formattedData = {
      ...data,
      amount: Number(data.amount),
      startDate,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      nextOccurrenceDate,
      currentOccurrences: 0,
      isActive: true,
      lastProcessedDate: undefined,
    };
    
      console.log('🔄 Formatted data for submission:', formattedData);
    // Submit the data to parent component
    onSubmit(formattedData);
    } catch (error) {
      console.error("Error in form submission:", error);
      // Error will be handled by parent component
    }
  };

  const getPreviewText = () => {
    const freq = watch('frequency');
    const dayOfWeek = watch('dayOfWeek');
    const dayOfMonth = watch('dayOfMonth');
    const monthOfYear = watch('monthOfYear');
    
    switch (freq) {
      case 'daily':
        return 'Every day';
      case 'weekly':
        return dayOfWeek !== undefined ? `Every ${weekDays[dayOfWeek]}` : 'Every week';
      case 'monthly':
        return dayOfMonth ? `Every month on the ${dayOfMonth}${getOrdinalSuffix(dayOfMonth)}` : 'Every month';
      case 'yearly':
        if (monthOfYear && dayOfMonth) {
          return `Every year on ${months[monthOfYear - 1]} ${dayOfMonth}${getOrdinalSuffix(dayOfMonth)}`;
        } else if (monthOfYear) {
          return `Every year in ${months[monthOfYear - 1]}`;
        }
        return 'Every year';
      default:
        return '';
    }
  };

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const getEstimatedMonthlyImpact = () => {
    if (!amount || !frequency) return 0;
    
    const monthlyMultiplier = {
      daily: 30,
      weekly: 4.33,
      monthly: 1,
      yearly: 1/12
    };
    
    return amount * monthlyMultiplier[frequency as keyof typeof monthlyMultiplier];
  };

  const totalSteps = 4;

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                step < currentStep
                  ? 'bg-primary-500 text-white'
                  : step === currentStep
                  ? 'bg-primary-500/70 text-white ring-4 ring-primary-500/30'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
        <span className="text-sm text-gray-400">
          Step {currentStep} of {totalSteps}
        </span>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Step 1: Transaction Type */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">What type of transaction?</h3>
              <p className="text-sm text-gray-400">Choose whether this is money coming in or going out</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  value="income"
                  {...register('type')}
                  className="sr-only"
                />
                <div className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                  type === 'income' 
                    ? 'border-success-500 bg-success-500/20 shadow-lg transform scale-105' 
                    : 'border-white/20 hover:border-white/30 hover:shadow-md'
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      type === 'income' ? 'bg-success-500' : 'bg-gray-600'
                    }`}>
                      <TrendingUp size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold text-lg ${
                        type === 'income' ? 'text-success-400' : 'text-gray-300'
                      }`}>
                        Income
                      </h4>
                      <p className="text-sm text-gray-400">
                        Money you receive regularly (salary, freelance, investments)
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-black/30 rounded text-xs text-gray-400">Salary</span>
                        <span className="px-2 py-1 bg-black/30 rounded text-xs text-gray-400">Freelance</span>
                        <span className="px-2 py-1 bg-black/30 rounded text-xs text-gray-400">Rental</span>
                      </div>
                    </div>
                    {type === 'income' && (
                      <div className="text-success-400">
                        <Plus size={24} />
                      </div>
                    )}
                  </div>
                </div>
              </label>

              <label className="cursor-pointer">
                <input
                  type="radio"
                  value="expense"
                  {...register('type')}
                  className="sr-only"
                />
                <div className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                  type === 'expense' 
                    ? 'border-error-500 bg-error-500/20 shadow-lg transform scale-105' 
                    : 'border-white/20 hover:border-white/30 hover:shadow-md'
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      type === 'expense' ? 'bg-error-500' : 'bg-gray-600'
                    }`}>
                      <TrendingDown size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold text-lg ${
                        type === 'expense' ? 'text-error-400' : 'text-gray-300'
                      }`}>
                        Expense
                      </h4>
                      <p className="text-sm text-gray-400">
                        Money you spend regularly (rent, subscriptions, bills)
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-black/30 rounded text-xs text-gray-400">Rent</span>
                        <span className="px-2 py-1 bg-black/30 rounded text-xs text-gray-400">Subscriptions</span>
                        <span className="px-2 py-1 bg-black/30 rounded text-xs text-gray-400">Bills</span>
                      </div>
                    </div>
                    {type === 'expense' && (
                      <div className="text-error-400">
                        <Minus size={24} />
                      </div>
                    )}
                  </div>
                </div>
              </label>
            </div>

            <Button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
              disabled={!type}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Amount and Category */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Amount and Category</h3>
              <p className="text-sm text-gray-400">How much and what category?</p>
            </div>

            {/* Amount */}
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="relative">
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
                {amount && (
                  <div className="mt-2 text-sm text-gray-400">
                    Monthly impact: {type === 'income' ? '+' : '-'}<CurrencyIcon currencyCode={currency.code} size={14} className="inline mr-1" />{getEstimatedMonthlyImpact().toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            {/* Category */}
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                <Tag size={16} className="mr-2 text-yellow-400" />
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
                    <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      watch('category') === category
                        ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                        : 'border-white/20 hover:border-white/30 text-gray-300'
                    }`}>
                      <span className="text-sm font-medium">{category}</span>
                    </div>
                  </label>
                ))}
              </div>
              {errors.category && (
                <p className="text-sm text-error-400 mt-1">{errors.category.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <Input
                label="Description"
                type="text"
                icon={<FileText size={18} className="text-blue-400" />}
                {...register('description', { required: 'Description is required' })}
                error={errors.description?.message}
                className="bg-black/40 border-white/20 text-white"
                placeholder={`e.g., ${type === 'income' ? 'Monthly salary' : 'Netflix subscription'}`}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
                disabled={!watch('amount') || !watch('category') || !watch('description')}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Frequency */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">How often?</h3>
              <p className="text-sm text-gray-400">Choose how frequently this transaction occurs</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {frequencyOptions.map((option) => (
                <label key={option.value} className="cursor-pointer">
                  <input
                    type="radio"
                    value={option.value}
                    {...register('frequency', { required: 'Frequency is required' })}
                    className="sr-only"
                  />
                  <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    frequency === option.value 
                      ? 'border-primary-500 bg-primary-500/20 shadow-lg text-white' 
                      : 'border-white/20 hover:border-white/30 hover:shadow-md text-gray-300'
                  }`}>
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{option.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{option.label}</h4>
                          {frequency === option.value && amount && (
                            <span className={`text-sm font-medium ${
                              type === 'income' ? 'text-success-400' : 'text-error-400'
                            }`}>
                              {type === 'income' ? '+' : '-'}<CurrencyIcon currencyCode={currency.code} size={12} className="inline mr-1" />{(getEstimatedMonthlyImpact()).toFixed(0)}/mo
                            </span>
                          )}
                        </div>
                        <p className="text-sm opacity-80">{option.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Example: {option.example}</p>
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
                disabled={!frequency}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Schedule and Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Schedule & Review</h3>
              <p className="text-sm text-gray-400">When should this start and any special settings?</p>
            </div>

            {/* Start Date */}
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <Input
                label="Start Date"
                type="date"
                icon={<Calendar size={18} className="text-purple-400" />}
                {...register('startDate', { required: 'Start date is required' })}
                error={errors.startDate?.message}
                className="bg-black/40 border-white/20 text-white"
              />
            </div>

            {/* Advanced Options Toggle */}
            <div className="border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2 text-primary-400 hover:text-primary-300 text-sm font-medium"
              >
                <Clock size={16} />
                <span>Advanced Options</span>
                <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 bg-black/30 rounded-lg p-4 border border-white/10">
                  {/* Specific Day/Date Options */}
                  {frequency === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Day of Week (Optional)
                      </label>
                      <select
                        {...register('dayOfWeek')}
                        className="block w-full rounded-lg border-white/20 bg-black/40 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm py-3 px-4"
                      >
                        <option value="" className="bg-black/90">Same day as start date</option>
                        {weekDays.map((day, index) => (
                          <option key={index} value={index} className="bg-black/90">
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {frequency === 'monthly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Day of Month (Optional)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        {...register('dayOfMonth')}
                        placeholder="Same day as start date"
                        className="block w-full rounded-lg border-white/20 bg-black/40 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm py-3 px-4"
                      />
                    </div>
                  )}

                  {frequency === 'yearly' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Month (Optional)
                        </label>
                        <select
                          {...register('monthOfYear')}
                          className="block w-full rounded-lg border-white/20 bg-black/40 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm py-3 px-4"
                        >
                          <option value="" className="bg-black/90">Same month as start date</option>
                          {months.map((month, index) => (
                            <option key={index} value={index + 1} className="bg-black/90">
                              {month}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Day (Optional)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          {...register('dayOfMonth')}
                          placeholder="Same day as start"
                          className="block w-full rounded-lg border-white/20 bg-black/40 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm py-3 px-4"
                        />
                      </div>
                    </div>
                  )}

                  {/* End Date */}
                  <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                    <Input
                      label="End Date (Optional)"
                      type="date"
                      icon={<Calendar size={18} className="text-orange-400" />}
                      {...register('endDate')}
                      className="bg-black/40 border-white/20 text-white"
                    />
                  </div>

                  {/* Max Occurrences */}
                  <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                    <Input
                      label="Maximum Occurrences (Optional)"
                      type="number"
                      min="1"
                      icon={<Repeat size={18} className="text-green-400" />}
                      {...register('maxOccurrences')}
                      placeholder="Unlimited"
                      className="bg-black/40 border-white/20 text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
              <div className="flex items-start space-x-2">
                <AlertCircle size={16} className="text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-400 font-medium">Summary</p>
                  <div className="text-blue-300 space-y-1">
                    <p>
                      <strong>{type === 'income' ? 'Receive' : 'Pay'}</strong> <CurrencyIcon currencyCode={currency.code} size={14} className="inline mr-1 text-blue-300" />{watch('amount') || '0'} 
                      for <strong>{watch('category')}</strong> {getPreviewText().toLowerCase()}
                    </p>
                    <p>
                      Monthly impact: <strong>{type === 'income' ? '+' : '-'}<CurrencyIcon currencyCode={currency.code} size={14} className="inline mr-1 text-blue-300" />{getEstimatedMonthlyImpact().toFixed(2)}</strong>
                    </p>
                    {watch('endDate') && (
                      <p>Until: <strong>{new Date(watch('endDate')).toLocaleDateString()}</strong></p>
                    )}
                    {watch('maxOccurrences') && (
                      <p>Maximum: <strong>{watch('maxOccurrences')} times</strong></p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(3)}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Back
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
              >
                {initialData ? 'Update' : 'Create'} Recurring Transaction
              </Button>
            </div>
          </div>
        )}

        {/* Cancel button for all steps except the form submission */}
        {currentStep < 4 && (
          <div className="pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="w-full text-gray-400 hover:text-gray-300 hover:bg-white/5"
            >
              Cancel
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};