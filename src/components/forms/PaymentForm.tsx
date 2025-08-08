import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, Calculator, Info, AlertTriangle } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Liability } from '../../types';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface PaymentFormData {
  amount: number;
  description: string;
  createTransaction: boolean;
}

interface PaymentFormProps {
  liability?: Liability;
  onSubmit: (data: PaymentFormData) => void;
  onCancel: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ liability, onSubmit, onCancel }) => {
  const { currency, formatCurrency } = useInternationalization();
  const [paymentImpact, setPaymentImpact] = useState<{
    newBalance: number;
    percentagePaid: number;
  } | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PaymentFormData>({
    defaultValues: {
      description: liability ? `Payment for ${liability.name}` : '',
      amount: liability?.monthlyPayment || 0,
      createTransaction: true,
    },
  });

  const watchedAmount = watch('amount');
  const createTransaction = watch('createTransaction');

  // Calculate payment impact when amount changes
  React.useEffect(() => {
    if (liability && watchedAmount) {
      const paymentAmount = Number(watchedAmount) || 0;
      const remainingAmount = Number(liability.remainingAmount) || 0;
      const totalAmount = Number(liability.totalAmount) || 0;
      
      if (paymentAmount > 0 && !isNaN(paymentAmount)) {
        const newBalance = Math.max(0, remainingAmount - paymentAmount);
      const percentagePaid = totalAmount > 0 ? ((totalAmount - newBalance) / totalAmount) * 100 : 0;
      setPaymentImpact({ newBalance, percentagePaid });
      } else {
        setPaymentImpact(null);
      }
    } else {
      setPaymentImpact(null);
    }
  }, [watchedAmount, liability]);

  const handleFormSubmit = (data: PaymentFormData) => {
    try {
      setIsSubmitting(true);
      
      const amount = Number(data.amount) || 0;
      const remainingAmount = Number(liability?.remainingAmount) || 0;
      
      if (amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }
      
      // Handle overpayment with user confirmation
      if (amount > remainingAmount && remainingAmount > 0) {
        const confirmed = window.confirm(`Payment of ${formatCurrency(amount)} exceeds remaining balance of ${formatCurrency(remainingAmount)}. Adjust to full payoff amount?`);
        if (!confirmed) {
          setIsSubmitting(false);
          return;
        }
        // Adjust amount to remaining balance
        data.amount = remainingAmount;
      }
      
      onSubmit({
        amount: Number(amount) || 0,
        description: data.description || `Payment for ${liability?.name}`,
        createTransaction: data.createTransaction,
      });
    } catch (error: any) {
      console.error('Error processing payment:', error);
      setIsSubmitting(false);
    } finally {
      // Don't reset here as parent handles it
    }
  };

  const handleQuickAmount = (amount: number) => {
    setValue('amount', amount);
  };

  if (!liability) return null;

  // Safe access to liability properties with defaults
  const remainingAmount = Number(liability.remainingAmount) || 0;
  const monthlyPayment = Number(liability.monthlyPayment) || 0;
  const totalAmount = Number(liability.totalAmount) || 0;

  return (
    <div className="space-y-6">
      {/* Header with Info */}
      <div className="bg-gradient-to-r from-warning-500/20 to-error-500/20 rounded-xl p-4 mb-6 border border-warning-500/30">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
          <CurrencyIcon currencyCode={currency.code} size={20} className="mr-2 text-warning-400" />
          Make a Payment
        </h3>
        <p className="text-gray-300 text-sm">
          Record a payment towards your {liability.type?.replace('_', ' ') || 'liability'} and reduce your debt.
        </p>
      </div>

      {/* Liability Info */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <h4 className="font-semibold text-white mb-3">{liability.name || 'Unnamed Liability'}</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-black/20 p-3 rounded-lg">
            <span className="text-gray-400">Remaining:</span>
            <span className="font-medium ml-2 text-white">
              <CurrencyIcon currencyCode={currency.code} size={14} className="inline mr-1" />
              {remainingAmount.toLocaleString()}
            </span>
          </div>
          <div className="bg-black/20 p-3 rounded-lg">
            <span className="text-gray-400">Monthly:</span>
            <span className="font-medium ml-2 text-white">
              <CurrencyIcon currencyCode={currency.code} size={14} className="inline mr-1" />
              {monthlyPayment.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Quick Amount Buttons */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Quick Amounts
          </label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAmount(monthlyPayment)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Monthly
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAmount(monthlyPayment * 2)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              2x Monthly
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAmount(Math.min(remainingAmount, 1000))}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <CurrencyIcon currencyCode={currency.code} size={12} className="inline mr-1" />
              1,000
            </Button>
          </div>
        </div>

        {/* Payment Amount */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <Input
            label="Payment Amount"
            type="number"
            step="0.01"
            icon={<CurrencyIcon currencyCode={currency.code} className="text-success-400" />}
            {...register('amount', {
              required: 'Payment amount is required',
              min: { value: 0.01, message: 'Amount must be greater than 0' },
              max: { 
                value: remainingAmount, 
                message: 'Payment cannot exceed remaining balance' 
              },
            })}
            error={errors.amount?.message}
            className="bg-black/40 border-white/20 text-white"
            placeholder={`e.g., ${monthlyPayment}`}
          />
        </div>

        {/* Create Transaction Toggle */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-white">Create Transaction</label>
              <p className="text-xs text-gray-400 mt-1">
                Record this payment as an expense transaction
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                {...register('createTransaction')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>

        {/* Description */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <Input
            label="Description (Optional)"
            type="text"
            icon={<FileText size={18} className="text-blue-400" />}
            {...register('description')}
            error={errors.description?.message}
            className="bg-black/40 border-white/20 text-white"
            placeholder="e.g., Monthly payment"
          />
        </div>

        {/* Payment Impact Preview */}
        {paymentImpact && watchedAmount && !isNaN(Number(watchedAmount)) && Number(watchedAmount) > 0 && (
          <div className="bg-success-500/20 rounded-lg p-4 border border-success-500/30">
            <div className="flex items-center text-success-400 mb-2">
              <Calculator size={16} className="mr-2" />
              <span className="font-medium">Payment Impact</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">New Balance:</span>
                <span className="font-medium text-white">
                  {formatCurrency(paymentImpact.newBalance || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Paid Off:</span>
                <span className="font-medium text-success-400">
                  {(paymentImpact.percentagePaid || 0).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-1">
                <div
                  className="bg-success-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(paymentImpact.percentagePaid || 0, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Important Notice */}
        <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
          <div className="flex items-center text-blue-400 mb-2">
            <Info size={16} className="mr-2" />
            <span className="font-medium">Payment Impact</span>
          </div>
          <p className="text-sm text-blue-300">
            {createTransaction 
              ? "This payment will be recorded as a debt payment expense in your transactions. Your account balance will be reduced by the payment amount."
              : "This payment will only update the debt balance without creating a transaction. Use this if you've already recorded the payment separately."}
          </p>
        </div>

        {/* Warning for large payments */}
        {Number(watchedAmount) > monthlyPayment * 3 && monthlyPayment > 0 && (
          <div className="bg-warning-500/20 rounded-lg p-4 border border-warning-500/30">
            <div className="flex items-start space-x-2">
              <AlertTriangle size={16} className="text-warning-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-warning-400 font-medium">Large Payment</p>
                <p className="text-warning-300">
                  This payment is significantly larger than your regular monthly payment. 
                  Please confirm this is intentional.
                </p>
              </div>
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
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-1 bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700"
          >
            Make Payment
          </Button>
        </div>
      </form>
    </div>
  );
};