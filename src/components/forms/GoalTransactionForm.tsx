import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, PiggyBank, AlertTriangle, Plus, Minus, ToggleLeft, ToggleRight } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Goal } from '../../types';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface GoalTransactionFormData {
  amount: number;
  description: string;
  source: 'manual' | 'emergency_fund';
  deductFromBalance: boolean;
}

interface GoalTransactionFormProps {
  goal: Goal;
  onSubmit: (data: GoalTransactionFormData & { type: 'add' | 'withdraw' }) => Promise<void>;
  onCancel: () => void;
  emergencyFundBalance: number;
}

export const GoalTransactionForm: React.FC<GoalTransactionFormProps> = ({ 
  goal, 
  onSubmit, 
  onCancel,
  emergencyFundBalance 
}) => {
  const { currency } = useInternationalization();
  const [transactionType, setTransactionType] = useState<'add' | 'withdraw'>('add');
  const [deductFromBalance, setDeductFromBalance] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<GoalTransactionFormData>({
    defaultValues: {
      source: 'manual',
      description: transactionType === 'add' 
        ? `Added to ${goal.title}` 
        : `Withdrawn from ${goal.title}`,
      deductFromBalance: true,
      amount: 0,
    },
  });

  const watchedAmount = watch('amount');
  const watchedSource = watch('source');

  // Update description when transaction type changes
  useEffect(() => {
    setValue('description', transactionType === 'add' 
      ? `Added to ${goal.title}` 
      : `Withdrawn from ${goal.title}`);
  }, [transactionType, goal.title, setValue]);

  const handleFormSubmit = async (data: GoalTransactionFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      await onSubmit({
        ...data,
        amount: Number(data.amount),
        type: transactionType,
        deductFromBalance,
      });
      
    } catch (error: any) {
      console.error('Error processing goal transaction:', error);
      setError(error.message || 'Failed to process transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setValue('amount', amount);
  };

  const maxWithdrawAmount = transactionType === 'withdraw' ? goal.currentAmount : Infinity;
  const maxEmergencyAmount = watchedSource === 'emergency_fund' ? emergencyFundBalance : Infinity;
  const effectiveMaxAmount = Math.min(maxWithdrawAmount, maxEmergencyAmount);

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-error-500/20 border border-error-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={18} className="text-error-400" />
            <p className="text-error-400 text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {/* Goal Info */}
      <div className="bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-xl p-4 border border-primary-500/30">
        <h4 className="font-semibold text-white mb-3 flex items-center">
          <PiggyBank size={18} className="mr-2 text-primary-400" />
          {goal.title}
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-black/30 p-3 rounded-lg">
            <span className="text-gray-400">Current:</span>
            <span className="font-medium ml-2 text-white">
              <CurrencyIcon currencyCode={currency.code} size={14} className="inline mr-1" />
              {goal.currentAmount.toLocaleString()}
            </span>
          </div>
          <div className="bg-black/30 p-3 rounded-lg">
            <span className="text-gray-400">Target:</span>
            <span className="font-medium ml-2 text-white">
              <CurrencyIcon currencyCode={currency.code} size={14} className="inline mr-1" />
              {goal.targetAmount.toLocaleString()}
            </span>
          </div>
        </div>
        {emergencyFundBalance > 0 && (
          <div className="mt-3 p-3 bg-black/30 rounded-lg border border-white/10">
            <span className="text-gray-400 text-sm">Emergency Fund Available:</span>
            <span className="font-medium ml-2 text-sm text-success-400">
              <CurrencyIcon currencyCode={currency.code} size={14} className="inline mr-1" />
              {emergencyFundBalance.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Transaction Type Selection */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Transaction Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="cursor-pointer">
              <input
                type="radio"
                checked={transactionType === 'add'}
                onChange={() => {
                  setTransactionType('add');
                  setValue('description', `Added to ${goal.title}`);
                }}
                className="sr-only"
              />
              <div className={`p-4 rounded-xl border-2 text-center transition-colors ${
                transactionType === 'add' 
                  ? 'border-success-500 bg-success-500/20 text-success-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <Plus size={20} className="mx-auto mb-2" />
                <span className="font-medium">Add Money</span>
              </div>
            </label>
            <label className="cursor-pointer">
              <input
                type="radio"
                checked={transactionType === 'withdraw'}
                onChange={() => {
                  setTransactionType('withdraw');
                  setValue('description', `Withdrawn from ${goal.title}`);
                }}
                className="sr-only"
              />
              <div className={`p-4 rounded-xl border-2 text-center transition-colors ${
                transactionType === 'withdraw' 
                  ? 'border-warning-500 bg-warning-500/20 text-warning-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <Minus size={20} className="mx-auto mb-2" />
                <span className="font-medium">Withdraw</span>
              </div>
            </label>
          </div>
        </div>

        {/* Balance Deduction Toggle - Only show for Add Money */}
        {transactionType === 'add' && (
          <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-white mb-1">Deduct from Balance</h4>
                <p className="text-sm text-blue-300">
                  {deductFromBalance 
                    ? 'This transaction will be recorded as an expense (money leaves your account)'
                    : 'This transaction will not affect your account balance (tracking only)'
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeductFromBalance(!deductFromBalance)}
                className="ml-4 flex-shrink-0"
              >
                {deductFromBalance ? (
                  <ToggleRight size={32} className="text-blue-400" />
                ) : (
                  <ToggleLeft size={32} className="text-gray-500" />
                )}
              </button>
            </div>
            
            {/* Additional Info */}
            <div className="mt-3 p-3 bg-black/30 rounded-lg border border-white/10">
              <div className="flex items-start space-x-2">
                <div className={`w-2 h-2 rounded-full mt-2 ${deductFromBalance ? 'bg-error-400' : 'bg-success-400'}`} />
                <div className="text-sm">
                  <p className="font-medium text-white">
                    {deductFromBalance ? 'Money will be deducted' : 'No money deducted'}
                  </p>
                  <p className="text-gray-400">
                    {deductFromBalance 
                      ? 'The amount will be recorded as a "Savings" expense in your transactions'
                      : 'Only the goal balance will increase - useful for tracking gifts, bonuses, or manual transfers'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Source Selection */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            {transactionType === 'add' ? 'Money Source' : 'Where to send money'}
          </label>
          <div className="space-y-2">
            <label className="cursor-pointer">
              <input
                type="radio"
                value="manual"
                {...register('source')}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 transition-colors ${
                watchedSource === 'manual' 
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <div className="flex items-center space-x-3">
                  <CurrencyIcon 
                    currencyCode={currency.code} 
                    size={18} 
                    className={watchedSource === 'manual' ? 'text-primary-400' : 'text-gray-400'} 
                  />
                  <div>
                    <p className="font-medium">
                      Manual Transaction
                    </p>
                    <p className="text-sm opacity-80">
                      {transactionType === 'add' ? 'Add from external source' : 'Withdraw to external account'}
                    </p>
                  </div>
                </div>
              </div>
            </label>

            {emergencyFundBalance > 0 && (
              <label className="cursor-pointer">
                <input
                  type="radio"
                  value="emergency_fund"
                  {...register('source')}
                  className="sr-only"
                />
                <div className={`p-3 rounded-lg border-2 transition-colors ${
                  watchedSource === 'emergency_fund' 
                    ? 'border-error-500 bg-error-500/20 text-error-400' 
                    : 'border-white/20 hover:border-white/30 text-gray-300'
                }`}>
                  <div className="flex items-center space-x-3">
                    <AlertTriangle size={18} className={watchedSource === 'emergency_fund' ? 'text-error-400' : 'text-gray-400'} />
                    <div>
                      <p className="font-medium">
                        Emergency Fund
                      </p>
                      <p className="text-sm opacity-80">
                        {transactionType === 'add' 
                          ? `Use emergency fund (${emergencyFundBalance.toLocaleString()} available)` 
                          : `Move to emergency fund`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Quick Amounts
          </label>
          <div className="grid grid-cols-4 gap-2">
            {transactionType === 'add' ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(100)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <CurrencyIcon currencyCode={currency.code} size={12} className="inline mr-1" />
                  100
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(500)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <CurrencyIcon currencyCode={currency.code} size={12} className="inline mr-1" />
                  500
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(1000)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <CurrencyIcon currencyCode={currency.code} size={12} className="inline mr-1" />
                  1K
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(5000)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <CurrencyIcon currencyCode={currency.code} size={12} className="inline mr-1" />
                  5K
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(Math.min(100, goal.currentAmount))}
                  disabled={goal.currentAmount < 100}
                  className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
                >
                  <CurrencyIcon currencyCode={currency.code} size={12} className="inline mr-1" />
                  100
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(Math.min(500, goal.currentAmount))}
                  disabled={goal.currentAmount < 500}
                  className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
                >
                  <CurrencyIcon currencyCode={currency.code} size={12} className="inline mr-1" />
                  500
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(Math.min(1000, goal.currentAmount))}
                  disabled={goal.currentAmount < 1000}
                  className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
                >
                  <CurrencyIcon currencyCode={currency.code} size={12} className="inline mr-1" />
                  1K
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(goal.currentAmount)}
                  disabled={goal.currentAmount === 0}
                  className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
                >
                  All
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Amount Input */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            icon={<CurrencyIcon currencyCode={currency.code} className={transactionType === 'add' ? 'text-success-400' : 'text-warning-400'} />}
            {...register('amount', {
              required: 'Amount is required',
              min: { value: 0.01, message: 'Amount must be greater than 0' },
              max: transactionType === 'withdraw' 
                ? { value: effectiveMaxAmount, message: `Cannot exceed available amount (${currency.symbol}${effectiveMaxAmount.toLocaleString()})` }
                : undefined,
            })}
            error={errors.amount?.message}
            className="bg-black/40 border-white/20 text-white"
            placeholder={`e.g., 100`}
          />
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
            placeholder={`e.g., ${transactionType === 'add' ? 'Monthly contribution' : 'Emergency withdrawal'}`}
          />
        </div>

        {/* Transaction Preview */}
        {watchedAmount > 0 && (
          <div className={`rounded-lg p-4 border ${
            transactionType === 'add' 
              ? 'bg-success-500/20 border-success-500/30' 
              : 'bg-warning-500/20 border-warning-500/30'
          }`}>
            <div className={`flex items-center mb-2 ${
              transactionType === 'add' ? 'text-success-400' : 'text-warning-400'
            }`}>
              <PiggyBank size={16} className="mr-2" />
              <span className="font-medium">Transaction Preview</span>
            </div>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-gray-300">Goal Balance:</span>
                <span className="ml-2 text-white">
                  <CurrencyIcon currencyCode={currency.code} size={12} className="inline mr-1" />
                  {goal.currentAmount.toLocaleString()} → <CurrencyIcon currencyCode={currency.code} size={12} className="inline mr-1" />
                  {transactionType === 'add' 
                    ? (goal.currentAmount + watchedAmount).toLocaleString()
                    : (goal.currentAmount - watchedAmount).toLocaleString()
                  }
                </span>
              </p>
              {watchedSource === 'emergency_fund' && (
                <p>
                  <span className="text-gray-300">Emergency Fund:</span>
                  <span className="ml-2 text-white">
                    <CurrencyIcon currencyCode={currency.code} size={12} className="inline mr-1" />
                    {emergencyFundBalance.toLocaleString()} → <CurrencyIcon currencyCode={currency.code} size={12} className="inline mr-1" />
                    {transactionType === 'add' 
                      ? (emergencyFundBalance - watchedAmount).toLocaleString()
                      : (emergencyFundBalance + watchedAmount).toLocaleString()
                    }
                  </span>
                </p>
              )}
              {transactionType === 'add' && (
                <p>
                  <span className="text-gray-300">Account Balance Impact:</span>
                  <span className={`ml-2 font-medium ${deductFromBalance ? 'text-error-400' : 'text-success-400'}`}>
                    {deductFromBalance ? 
                      <>-<CurrencyIcon currencyCode={currency.code} size={12} className="inline mx-1 text-error-400" />{watchedAmount.toLocaleString()}</> : 
                      'No change'
                    }
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

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
              transactionType === 'add'
                ? 'bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700'
                : 'bg-gradient-to-r from-warning-500 to-warning-600 hover:from-warning-600 hover:to-warning-700'
            }`}
            loading={isSubmitting}
          >
            {transactionType === 'add' ? 'Add Money' : 'Withdraw Money'}
          </Button>
        </div>
      </form>
    </div>
  );
};