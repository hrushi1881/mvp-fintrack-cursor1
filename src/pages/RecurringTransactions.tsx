import React, { useState } from 'react';
import { Repeat, Calendar, Plus, Edit3, Trash2, Play, Pause, AlertCircle, CheckCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { TopNavigation } from '../components/layout/TopNavigation';
import { Modal } from '../components/common/Modal';
import { RecurringTransactionForm } from '../components/forms/RecurringTransactionForm';
import { Button } from '../components/common/Button';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../components/common/CurrencyIcon';
import { RecurringTransaction } from '../types';

export const RecurringTransactions: React.FC = () => {
  const { 
    recurringTransactions, 
    addRecurringTransaction, 
    updateRecurringTransaction, 
    deleteRecurringTransaction,
    processRecurringTransactions 
  } = useFinance();
  const { currency, formatCurrency } = useInternationalization();
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTransaction = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      console.log('🔄 Adding recurring transaction:', data);
      
      await addRecurringTransaction(data);
      console.log('✅ Recurring transaction added successfully');
      
      setShowModal(false);
    } catch (error: any) {
      console.error('❌ Error adding recurring transaction:', error);
      setError(error.message || 'Failed to add recurring transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTransaction = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (editingTransaction) {
        console.log('🔄 Updating recurring transaction:', editingTransaction.id, data);
        await updateRecurringTransaction(editingTransaction.id, data);
        console.log('✅ Recurring transaction updated successfully');
        
        setEditingTransaction(null);
        setShowModal(false);
      }
    } catch (error: any) {
      console.error('❌ Error updating recurring transaction:', error);
      setError(error.message || 'Failed to update recurring transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    console.log('🔄 Toggling recurring transaction active state:', id, !isActive);
    
    updateRecurringTransaction(id, { isActive: !isActive })
      .then(() => {
        console.log('✅ Toggle completed successfully');
      })
      .catch((error) => {
        console.error('❌ Error toggling recurring transaction:', error);
        setError(error.message || 'Failed to toggle transaction status');
      });
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTransaction = () => {
    if (transactionToDelete) {
      console.log('🔄 Deleting recurring transaction:', transactionToDelete);
      
      deleteRecurringTransaction(transactionToDelete)
        .then(() => {
          console.log('✅ Delete completed successfully');
          setTransactionToDelete(null);
          setShowDeleteConfirm(false);
        })
        .catch((error) => {
          console.error('❌ Error deleting recurring transaction:', error);
          setError(error.message || 'Failed to delete transaction');
        });
    }
  };

  const handleProcessRecurring = async () => {
    try {
      setIsSubmitting(true);
      console.log('🔄 Processing recurring transactions...');
      
      await processRecurringTransactions();
      console.log('✅ Recurring transactions processed successfully');
    } catch (error: any) {
      console.error('❌ Error processing recurring transactions:', error);
      setError(error.message || 'Failed to process recurring transactions');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFrequencyIcon = (frequency: string) => {
    const icons = {
      daily: '📅',
      weekly: '📆',
      monthly: '🗓️',
      yearly: '📊'
    };
    return icons[frequency as keyof typeof icons] || '🔄';
  };

  const getNextOccurrenceText = (transaction: RecurringTransaction) => {
    const nextDate = new Date(transaction.nextOccurrenceDate);
    const now = new Date();
    const diffTime = nextDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;
    return format(nextDate, 'MMM dd, yyyy');
  };

  const getStatusColor = (transaction: RecurringTransaction) => {
    if (!transaction.isActive) return 'text-gray-400';
    
    const nextDate = new Date(transaction.nextOccurrenceDate);
    const now = new Date();
    const diffTime = nextDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-error-400';
    if (diffDays <= 1) return 'text-warning-400';
    return 'text-success-400';
  };

  const totalMonthlyImpact = recurringTransactions.reduce((sum, transaction) => {
    if (!transaction.isActive) return sum;
    
    let monthlyAmount = transaction.amount;
    switch (transaction.frequency) {
      case 'daily':
        monthlyAmount = transaction.amount * 30;
        break;
      case 'weekly':
        monthlyAmount = transaction.amount * 4.33;
        break;
      case 'yearly':
        monthlyAmount = transaction.amount / 12;
        break;
      default:
        monthlyAmount = transaction.amount;
    }
    
    return transaction.type === 'income' ? sum + monthlyAmount : sum - monthlyAmount;
  }, 0);

  return (
    <div className="min-h-screen text-white pb-20">
      <TopNavigation 
        title="Recurring Transactions" 
        showAdd 
        onAdd={() => setShowModal(true)}
      />
      
      <div className="px-4 py-4 sm:py-6">
        <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
          Set up automatic transactions for regular income and expenses
        </p>

        {/* Error Message */}
        {error && (
          <div className="bg-error-500/20 border border-error-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle size={18} className="text-error-400" />
              <p className="text-error-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {recurringTransactions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 text-center border border-white/10">
              <p className="text-xs sm:text-sm text-gray-400 mb-1">Active Transactions</p>
              <p className="text-lg sm:text-xl font-bold text-white">
                {recurringTransactions.filter(t => t.isActive).length}
              </p>
            </div>
            
            <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 text-center border border-white/10">
              <p className="text-xs sm:text-sm text-gray-400 mb-1">Monthly Impact</p>
              <p className={`text-lg sm:text-xl font-bold ${
                totalMonthlyImpact >= 0 ? 'text-success-400' : 'text-error-400'
              }`}>
                {totalMonthlyImpact >= 0 ? '+' : ''}{formatCurrency(totalMonthlyImpact)}
              </p>
            </div>
            
            <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 text-center border border-white/10">
              <Button
                onClick={handleProcessRecurring}
                size="sm"
                className="w-full"
                loading={isSubmitting}
              >
                <Clock size={16} className="mr-2" />
                Process Due
              </Button>
            </div>
          </div>
        )}

        {recurringTransactions.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Repeat size={24} className="text-primary-400 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No recurring transactions</h3>
            <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
              Set up automatic transactions for regular income and expenses
            </p>
            <Button onClick={() => setShowModal(true)}>
              <Plus size={18} className="mr-2 sm:w-5 sm:h-5" />
              Create Recurring Transaction
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {recurringTransactions.map((transaction) => (
              <div key={transaction.id} className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-success-500/20' : 'bg-error-500/20'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp size={20} className="text-success-400 sm:w-6 sm:h-6" />
                      ) : (
                        <TrendingDown size={20} className="text-error-400 sm:w-6 sm:h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm sm:text-base">
                        {transaction.description}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-400">
                        {transaction.category} • {getFrequencyIcon(transaction.frequency)} {transaction.frequency}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(transaction.id, transaction.isActive)}
                      className={`p-2 rounded-lg transition-colors ${
                        transaction.isActive 
                          ? 'hover:bg-warning-500/20 text-warning-400' 
                          : 'hover:bg-success-500/20 text-success-400'
                      }`}
                      title={transaction.isActive ? 'Pause' : 'Resume'}
                    >
                      {transaction.isActive ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingTransaction(transaction);
                        setShowModal(true);
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit3 size={16} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      className="p-2 hover:bg-error-500/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-error-400" />
                    </button>
                  </div>
                </div>

                {/* Amount and Status */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Amount</p>
                    <p className={`text-lg font-bold ${
                      transaction.type === 'income' ? 'text-success-400' : 'text-error-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      <CurrencyIcon currencyCode={currency.code} size={16} className="inline mr-1" />
                      {transaction.amount.toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Next Occurrence</p>
                    <p className={`text-sm font-medium ${getStatusColor(transaction)}`}>
                      {getNextOccurrenceText(transaction)}
                    </p>
                  </div>
                </div>

                {/* Status and Stats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      transaction.isActive 
                        ? 'bg-success-500/20 text-success-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {transaction.isActive ? 'Active' : 'Paused'}
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      Processed: {transaction.currentOccurrences} times
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Started</p>
                    <p className="text-sm text-white">{format(transaction.startDate, 'MMM dd, yyyy')}</p>
                  </div>
                </div>

                {/* End Date or Max Occurrences */}
                {(transaction.endDate || transaction.maxOccurrences) && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs">
                      {transaction.endDate && (
                        <span className="text-gray-400">
                          Ends: {format(transaction.endDate, 'MMM dd, yyyy')}
                        </span>
                      )}
                      {transaction.maxOccurrences && (
                        <span className="text-gray-400">
                          Limit: {transaction.currentOccurrences}/{transaction.maxOccurrences}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTransaction(null);
          setError(null);
        }}
        title={editingTransaction ? 'Edit Recurring Transaction' : 'Create Recurring Transaction'}
      >
        <RecurringTransactionForm
          initialData={editingTransaction || undefined}
          onSubmit={editingTransaction ? handleEditTransaction : handleAddTransaction}
          onCancel={() => {
            setShowModal(false);
            setEditingTransaction(null);
            setError(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setTransactionToDelete(null);
          setError(null);
        }}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete this recurring transaction? This action cannot be undone.
          </p>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setTransactionToDelete(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteTransaction}
              className="flex-1 bg-error-500 hover:bg-error-600"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};