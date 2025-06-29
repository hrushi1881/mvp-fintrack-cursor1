import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CreditCard, Percent, Calendar, Wallet, ShoppingCart, Info, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Liability, Transaction } from '../../types';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { useFinance } from '../../contexts/FinanceContext';

interface LiabilityFormData {
  name: string;
  type: 'loan' | 'credit_card' | 'mortgage' | 'purchase' | 'other';
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment: number;
  due_date: string;
  start_date: string;
  linkedPurchaseId?: string;
}

interface LiabilityFormProps {
  onSubmit: (data: Omit<Liability, 'id' | 'userId' | 'createdAt'>, addAsIncome: boolean) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<LiabilityFormData>;
}

export const LiabilityForm: React.FC<LiabilityFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const { currency } = useInternationalization();
  const { transactions } = useFinance();
  const [addAsIncome, setAddAsIncome] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<LiabilityFormData>({
    defaultValues: initialData || {
      type: 'loan',
      totalAmount: 0,
      remainingAmount: 0,
      interestRate: 0,
      monthlyPayment: 0,
      due_date: new Date().toISOString().split('T')[0],
      start_date: new Date().toISOString().split('T')[0]
    }
  });

  const selectedType = watch('type');
  const totalAmount = watch('totalAmount');
  const interestRate = watch('interestRate');
  const monthlyPayment = watch('monthlyPayment');
  const linkedPurchaseId = watch('linkedPurchaseId');

  // Load recent transactions for purchase linking
  useEffect(() => {
    if (selectedType === 'purchase') {
      // Get recent expense transactions
      const recent = transactions
        .filter(t => t.type === 'expense')
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 10);
      setRecentTransactions(recent);
    }
  }, [selectedType, transactions]);

  const handleFormSubmit = async (data: LiabilityFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // For purchase type, addAsIncome should always be false
      const effectiveAddAsIncome = selectedType === 'purchase' ? false : addAsIncome;
      
      await onSubmit({
        ...data,
        totalAmount: Number(data.totalAmount) || 0,
        remainingAmount: Number(data.remainingAmount) || 0,
        interestRate: Number(data.interestRate) || 0,
        monthlyPayment: Number(data.monthlyPayment) || 0,
        due_date: new Date(data.due_date),
        start_date: new Date(data.start_date),
        linkedPurchaseId: data.linkedPurchaseId || undefined,
      }, effectiveAddAsIncome);
      
      onCancel();
    } catch (error: any) {
      console.error('Error submitting liability:', error);
      setError(error.message || 'Failed to save liability. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      loan: '💰',
      credit_card: '💳',
      mortgage: '🏠',
      purchase: '🛍️',
      other: '📝'
    };
    return icons[type as keyof typeof icons] || '💳';
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
      <div className="bg-gradient-to-r from-warning-500/20 to-error-500/20 rounded-xl p-4 mb-6 border border-warning-500/30">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
          <CreditCard size={20} className="mr-2 text-warning-400" />
          {initialData ? 'Edit Debt' : 'Add New Debt'}
        </h3>
        <p className="text-gray-300 text-sm">
          Track your loans, credit cards, and other debts to manage your financial obligations.
        </p>
      </div>

      {/* Debt Acquisition Type - Only for new liabilities and non-purchase types */}
      {!initialData && selectedType !== 'purchase' && (
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            How did you acquire this debt?
          </label>
          
          <div className="grid grid-cols-1 gap-3">
            <label className="cursor-pointer">
              <input
                type="radio"
                checked={addAsIncome}
                onChange={() => setAddAsIncome(true)}
                className="sr-only"
              />
              <div className={`p-4 rounded-xl border-2 transition-colors ${
                addAsIncome 
                  ? 'border-success-500 bg-success-500/20 text-success-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <div className="flex items-center space-x-3">
                  <Wallet size={20} className={addAsIncome ? 'text-success-400' : 'text-gray-400'} />
                  <div>
                    <p className="font-medium">Cash Loan</p>
                    <p className="text-sm opacity-80">
                      I received money directly (loan, credit) - add funds to my account
                    </p>
                  </div>
                </div>
              </div>
            </label>

            <label className="cursor-pointer">
              <input
                type="radio"
                checked={!addAsIncome}
                onChange={() => setAddAsIncome(false)}
                className="sr-only"
              />
              <div className={`p-4 rounded-xl border-2 transition-colors ${
                !addAsIncome 
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <div className="flex items-center space-x-3">
                  <ShoppingCart size={20} className={!addAsIncome ? 'text-primary-400' : 'text-gray-400'} />
                  <div>
                    <p className="font-medium">Purchase on Credit</p>
                    <p className="text-sm opacity-80">
                      I bought something with financing - just track the debt
                    </p>
                  </div>
                </div>
              </div>
            </label>
          </div>

          {/* Info Box */}
          <div className={`p-3 rounded-lg border mt-3 ${
            addAsIncome 
              ? 'bg-success-500/20 border-success-500/30 text-success-400' 
              : 'bg-primary-500/20 border-primary-500/30 text-primary-400'
          }`}>
            <div className="flex items-center">
              <Info size={16} className="mr-2" />
              <span className="text-sm font-medium">
                {addAsIncome 
                  ? 'The loan amount will be added to your account as income'
                  : 'Only the debt will be tracked - no income will be added'
                }
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Liability Name */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <Input
          label="Liability Name"
          type="text"
          icon={<CreditCard size={18} className="text-warning-400" />}
          {...register('name', { required: 'Name is required' })}
          error={errors.name?.message}
          className="bg-black/40 border-white/20 text-white"
          placeholder="e.g., Car Loan, Credit Card"
        />
      </div>

      {/* Liability Type */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {['loan', 'credit_card', 'mortgage', 'purchase', 'other'].map((type) => (
            <label key={type} className="cursor-pointer">
              <input
                type="radio"
                value={type}
                {...register('type', { required: 'Type is required' })}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                selectedType === type
                  ? 'border-warning-500 bg-warning-500/20 text-warning-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <div className="text-xl mb-1">{getTypeIcon(type)}</div>
                <p className="font-medium capitalize">{type.replace('_', ' ')}</p>
              </div>
            </label>
          ))}
        </div>
        {errors.type && (
          <p className="text-sm text-error-400 mt-1">{errors.type.message}</p>
        )}
      </div>

      {/* Start Date */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <Input
          label="Start Date"
          type="date"
          icon={<Clock size={18} className="text-blue-400" />}
          {...register('start_date', { required: 'Start date is required' })}
          error={errors.start_date?.message}
          className="bg-black/40 border-white/20 text-white"
          helpText="When did you take on this debt?"
        />
      </div>

      {/* Link to Purchase Transaction - Only for purchase type */}
      {selectedType === 'purchase' && (
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Link to Purchase Transaction (Optional)
          </label>
          
          {recentTransactions.length > 0 ? (
            <div className="space-y-2">
              <select
                {...register('linkedPurchaseId')}
                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Select a transaction</option>
                {recentTransactions.map(transaction => (
                  <option key={transaction.id} value={transaction.id}>
                    {transaction.description} - {currency.symbol}{transaction.amount.toLocaleString()} ({new Date(transaction.date).toLocaleDateString()})
                  </option>
                ))}
              </select>
              
              <p className="text-xs text-gray-400">
                Linking to a purchase transaction helps track what this debt was used for.
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              No recent expense transactions found. Add a transaction first or leave this empty.
            </p>
          )}
        </div>
      )}

      {/* Amount Fields */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20 space-y-4">
        <Input
          label="Total Amount"
          type="number"
          step="0.01"
          icon={<CurrencyIcon currencyCode={currency.code} className="text-error-400" />}
          {...register('totalAmount', {
            required: 'Total amount is required',
            min: { value: 0.01, message: 'Amount must be greater than 0' },
          })}
          error={errors.totalAmount?.message}
          className="bg-black/40 border-white/20 text-white"
          placeholder="e.g., 10000"
          helpText="The original amount of the debt"
        />

        <Input
          label="Remaining Amount"
          type="number"
          step="0.01"
          icon={<CurrencyIcon currencyCode={currency.code} className="text-orange-400" />}
          {...register('remainingAmount', {
            required: 'Remaining amount is required',
            min: { value: 0, message: 'Amount cannot be negative' },
            validate: value => !totalAmount || Number(value) <= Number(totalAmount) || 'Cannot exceed total amount'
          })}
          error={errors.remainingAmount?.message}
          className="bg-black/40 border-white/20 text-white"
          placeholder="e.g., 8500"
          helpText="The current balance you still owe"
        />
      </div>

      {/* Payment Details */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20 space-y-4">
        <Input
          label="Interest Rate (%)"
          type="number"
          step="0.01"
          icon={<Percent size={18} className="text-purple-400" />}
          {...register('interestRate', {
            required: 'Interest rate is required',
            min: { value: 0, message: 'Interest rate cannot be negative' },
          })}
          error={errors.interestRate?.message}
          className="bg-black/40 border-white/20 text-white"
          placeholder="e.g., 5.25"
        />

        <Input
          label="Monthly Payment"
          type="number"
          step="0.01"
          icon={<CurrencyIcon currencyCode={currency.code} className="text-blue-400" />}
          {...register('monthlyPayment', {
            required: 'Monthly payment is required',
            min: { value: 0.01, message: 'Payment must be greater than 0' },
          })}
          error={errors.monthlyPayment?.message}
          className="bg-black/40 border-white/20 text-white"
          placeholder="e.g., 350"
        />
      </div>

      {/* Due Date */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <Input
          label="Next Due Date"
          type="date"
          icon={<Calendar size={18} className="text-green-400" />}
          {...register('due_date', { required: 'Due date is required' })}
          error={errors.due_date?.message}
          className="bg-black/40 border-white/20 text-white"
          helpText="When is your next payment due?"
        />
      </div>

      {/* Payment Summary */}
      {totalAmount && interestRate && monthlyPayment && Number(monthlyPayment) > 0 && (
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center">
            <ShieldCheck size={16} className="mr-2 text-blue-400" />
            Payment Summary
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-black/20 p-3 rounded-lg">
              <p className="text-gray-400 mb-1">Total Interest</p>
              <p className="text-error-400 font-medium">
                ~{currency.symbol}{((Number(totalAmount) * Number(interestRate) / 100) * (Number(totalAmount) / Number(monthlyPayment) / 12)).toFixed(2)}
              </p>
            </div>
            <div className="bg-black/20 p-3 rounded-lg">
              <p className="text-gray-400 mb-1">Est. Payoff</p>
              <p className="text-primary-400 font-medium">
                ~{Math.ceil(Number(totalAmount) / Number(monthlyPayment))} months
              </p>
            </div>
          </div>
        </div>
      )}

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
          className="flex-1 bg-gradient-to-r from-warning-500 to-warning-600 hover:from-warning-600 hover:to-warning-700"
          loading={isSubmitting}
        >
          {initialData ? 'Update' : 'Add'} Liability
        </Button>
      </div>
    </form>
  );
};