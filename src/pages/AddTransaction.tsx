import React, { useState } from 'react';
import { ArrowLeft, Plus, Minus, FileText, Tag, Calendar, Target, CreditCard, CheckCircle, AlertCircle, Scissors } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { validateTransaction, sanitizeFinancialData, toNumber } from '../utils/validation';
import { PageNavigation } from '../components/layout/PageNavigation';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../components/common/CurrencyIcon';
import { SplitTransaction } from '../types';

interface TransactionFormData {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: string;
}

interface SplitFormData {
  category: string;
  amount: number;
  description: string;
}

export const AddTransaction: React.FC = () => {
  const navigate = useNavigate();
  const { currency } = useInternationalization();
  const { addTransaction, addSplitTransaction, userCategories } = useFinance();
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [isSplitTransaction, setIsSplitTransaction] = useState(false);
  const [splits, setSplits] = useState<SplitFormData[]>([{ category: '', amount: 0, description: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TransactionFormData>({
    defaultValues: {
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      category: '',
    },
  });

  const type = watch('type');
  const amount = watch('amount');
  const category = watch('category');
  
  // Get categories based on type (with fallback to default categories)
  const defaultCategories = {
    income: ['Salary', 'Freelance', 'Investment', 'Business', 'Other'],
    expense: ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other']
  };
  
  const userCategoriesForType = userCategories.filter(c => c.type === type);
  const availableCategories = userCategoriesForType.length > 0 
    ? userCategoriesForType.map(c => ({ id: c.id, name: c.name }))
    : defaultCategories[type].map(name => ({ id: name, name }));

  // Set default category when type changes
  React.useEffect(() => {
    if (availableCategories.length > 0 && !category) {
      setValue('category', availableCategories[0].name);
    }
  }, [type, availableCategories, category, setValue]);

  const handleFormSubmit = async (data: TransactionFormData) => {
    try {
      setIsSubmitting(true);
      setError(null); // Clear any previous errors
      setError(null);
      
      if (isSplitTransaction) {
        // Validate splits
        const totalSplitAmount = splits.reduce((sum, split) => sum + toNumber(split.amount), 0);
        const mainAmount = toNumber(data.amount);
        
        if (Math.abs(totalSplitAmount - mainAmount) > 0.01) { // Allow for small rounding differences
          setError(`Split amounts must equal the total amount (${mainAmount})`);
          setIsSubmitting(false);
          return;
        }

        // Format splits for submission
        const formattedSplits: SplitTransaction[] = splits.map(split => ({
          category: split.category,
          amount: toNumber(split.amount),
          description: split.description || data.description
        }));

        // Validate main transaction data
        const validatedData = validateTransaction({
          ...data,
          amount: mainAmount,
        });

        // Add split transaction
        await addSplitTransaction(
          {
            ...validatedData,
            date: new Date(data.date),
          },
          formattedSplits
        );
      } else {
        // Sanitize and validate data
        const sanitizedData = sanitizeFinancialData(data, ['amount']);
        const validatedData = validateTransaction({
          ...sanitizedData,
          amount: toNumber(sanitizedData.amount),
        });
        
        // Add regular transaction
        await addTransaction({
          ...validatedData,
          category: data.category || (data.type === 'income' ?
            (userCategories.find(c => c.type === 'income')?.name || 'Other') : 
            (userCategories.find(c => c.type === 'expense')?.name || 'Other')),
          date: new Date(data.date),
        });
      }

    } catch (error: any) {
      console.error('Error adding transaction:', error);
      setError(error.message || 'Failed to add transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
      
      // Only navigate if no error occurred
      if (!error) {
        navigate('/');
      }
    }
  };

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setTransactionType(newType);
    setValue('type', newType);
    
    // Reset splits if changing type
    if (isSplitTransaction) {
      setSplits([{ category: '', amount: 0, description: '' }]);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setValue('amount', amount);
    
    // If split transaction, update first split amount
    if (isSplitTransaction && splits.length > 0) {
      const newSplits = [...splits];
      newSplits[0].amount = amount;
      setSplits(newSplits);
    }
  };

  const addSplitRow = () => {
    setSplits([...splits, { category: '', amount: 0, description: '' }]);
  };

  const removeSplitRow = (index: number) => {
    if (splits.length > 1) {
      const newSplits = [...splits];
      newSplits.splice(index, 1);
      setSplits(newSplits);
    }
  };

  const updateSplitField = (index: number, field: keyof SplitFormData, value: string | number) => {
    const newSplits = [...splits];
    newSplits[index] = { 
      ...newSplits[index], 
      [field]: field === 'amount' ? toNumber(value) : value 
    };
    setSplits(newSplits);
  };

  const totalSplitAmount = splits.reduce((sum, split) => sum + toNumber(split.amount), 0);
  const splitAmountDifference = toNumber(amount) - totalSplitAmount;

  const quickAmounts = type === 'income' 
    ? [1000, 2500, 5000, 10000]
    : [25, 50, 100, 500];

  return (
    <div className="min-h-screen text-white pb-20">
      {/* Header with Navigation */}
      <header className="bg-black/20 backdrop-blur-md px-4 py-4 sm:py-6 sticky top-0 z-30 border-b border-white/10">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-400" />
          </button>
          <h1 className="text-lg sm:text-xl font-semibold text-white">Add Transaction</h1>
          <div className="w-10"></div>
        </div>
        <PageNavigation />
      </header>

      <div className="px-4 py-6">
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
          
          {/* Transaction Type Selection */}
          <div>
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
            
            {/* Current Selection Indicator */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">
                Selected: <span className={`font-semibold ${
                  type === 'income' ? 'text-success-400' : 'text-error-400'
                }`}>
                  {type === 'income' ? 'Income' : 'Expense'}
                </span>
              </p>
            </div>
          </div>

          {/* Split Transaction Toggle */}
          {type === 'expense' && (
            <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Scissors size={20} className="text-primary-400" />
                  <div>
                    <h3 className="font-medium text-white">Split Transaction</h3>
                    <p className="text-sm text-gray-400">Divide this expense into multiple categories</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isSplitTransaction}
                    onChange={() => setIsSplitTransaction(!isSplitTransaction)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>
          )}

          {/* Quick Amount Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Quick Amounts
            </label>
            <div className="grid grid-cols-4 gap-3">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(amount)}
                  className="text-sm backdrop-blur-sm border-white/20 hover:border-white/40 hover:bg-white/10"
                >
                  <CurrencyIcon currencyCode={currency.code} size={12} className="inline mr-1" />
                  {amount.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              icon={<CurrencyIcon currencyCode={currency.code} />}
              {...register('amount', {
                required: 'Amount is required',
                min: { value: 0.01, message: 'Amount must be greater than 0' },
              })}
              error={errors.amount?.message}
              className="bg-black/20 border-white/20 text-white text-lg"
            />
          </div>

          {/* Category Selection */}
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
              <Tag size={16} className="mr-2 text-yellow-400" />
              Category
            </label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="block w-full rounded-xl border-white/20 bg-black/40 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
            >
              <option value="" className="bg-black/90">Select a category</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.name} className="bg-black/90">
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-sm text-error-400 mt-1">{errors.category.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <Input
              label="Description"
              type="text"
              icon={<FileText size={18} className="text-gray-400" />}
              {...register('description', { required: 'Description is required' })}
              error={errors.description?.message}
              className="bg-black/20 border-white/20 text-white"
              placeholder={`e.g., ${type === 'income' ? 'Salary payment' : 'Grocery shopping'}`}
            />
          </div>

          {/* Date */}
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <Input
              label="Date"
              type="date"
              icon={<Calendar size={18} className="text-gray-400" />}
              {...register('date', { required: 'Date is required' })}
              error={errors.date?.message}
              className="bg-black/20 border-white/20 text-white"
            />
          </div>

          {/* Split Transaction Form */}
          {isSplitTransaction && amount > 0 && (
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-white flex items-center">
                  <Scissors size={18} className="mr-2 text-primary-400" />
                  Split Details
                </h3>
                <Button
                  type="button"
                  size="sm"
                  onClick={addSplitRow}
                >
                  <Plus size={14} className="mr-1" />
                  Add Split
                </Button>
              </div>

              {/* Split Rows */}
              <div className="space-y-4">
                {splits.map((split, index) => (
                  <div key={index} className="p-4 bg-black/30 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-white">Split #{index + 1}</h4>
                      {splits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSplitRow(index)}
                          className="p-1 hover:bg-error-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} className="text-error-400" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                      {/* Category */}
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Category
                        </label>
                        <select
                          value={split.category}
                          onChange={(e) => updateSplitField(index, 'category', e.target.value)}
                          className="block w-full rounded-lg border-white/20 bg-black/40 text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2 px-3 text-sm"
                        >
                          <option value="" className="bg-black/90">Select a category</option>
                          {availableCategories.map((category) => (
                            <option key={category.id} value={category.name} className="bg-black/90">
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Amount
                        </label>
                        <div className="relative">
                          <CurrencyIcon currencyCode={currency.code} size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="number"
                            step="0.01"
                            value={split.amount}
                            onChange={(e) => updateSplitField(index, 'amount', Number(e.target.value))}
                            className="block w-full pl-10 pr-3 py-2 bg-black/40 border border-white/20 rounded-lg text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Description (Optional) */}
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Description (Optional)
                      </label>
                      <input
                        type="text"
                        value={split.description}
                        onChange={(e) => updateSplitField(index, 'description', e.target.value)}
                        placeholder="Leave blank to use main description"
                        className="block w-full px-3 py-2 bg-black/40 border border-white/20 rounded-lg text-white text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Split Summary */}
              <div className={`mt-4 p-3 rounded-lg ${
                splitAmountDifference === 0 
                  ? 'bg-success-500/20 border border-success-500/30' 
                  : 'bg-warning-500/20 border border-warning-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {splitAmountDifference === 0 ? (
                      <CheckCircle size={16} className="text-success-400" />
                    ) : (
                      <AlertCircle size={16} className="text-warning-400" />
                    )}
                    <span className={`text-sm font-medium ${
                      splitAmountDifference === 0 ? 'text-success-400' : 'text-warning-400'
                    }`}>
                      Split Summary
                    </span>
                  </div>
                  <span className="text-sm text-gray-300">
                    {formatCurrency(totalSplitAmount)} / {formatCurrency(amount)}
                  </span>
                </div>
                
                {splitAmountDifference !== 0 && (
                  <p className="text-xs text-warning-300 mt-1">
                    {splitAmountDifference > 0 
                      ? `Remaining: ${formatCurrency(splitAmountDifference)}` 
                      : `Excess: ${formatCurrency(Math.abs(splitAmountDifference))}`}
                    . Split amounts must equal the total amount.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full py-4 text-lg font-semibold"
              disabled={(isSplitTransaction && splitAmountDifference !== 0) || isSubmitting}
              loading={isSubmitting}
            >
              Add {type === 'income' ? 'Income' : 'Expense'}
              {amount ? ` - ${currency.symbol}${Number(amount).toLocaleString()}` : ''}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  function formatCurrency(value: number): string {
    return `${currency.symbol}${value.toLocaleString()}`;
  }
};