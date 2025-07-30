import React, { useState } from 'react';
import { Repeat, Plus, Play, Pause, Edit3, Trash2, Calendar, DollarSign, Clock } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { TopNavigation } from '../components/layout/TopNavigation';
import { Modal } from '../components/common/Modal';
import { RecurringTransactionForm } from '../components/forms/RecurringTransactionForm';
import { Button } from '../components/common/Button';
import { useFinance } from '../contexts/FinanceContext';

export const RecurringTransactions: React.FC = () => {
  const queryClient = useQueryClient();
  const { 
    recurringTransactions, 
    addRecurringTransaction, 
    updateRecurringTransaction, 
    deleteRecurringTransaction 
  } = useFinance();
  
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);

  const handleAddRecurringTransaction = (data: any) => {
    try {
      await addRecurringTransaction(data);
      setShowModal(false);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
    } catch (error) {
      console.error('Error adding recurring transaction:', error);
    }
  };

  const handleEditRecurringTransaction = (data: any) => {
    try {
      if (editingTransaction) {
        await updateRecurringTransaction(editingTransaction, data);
        setEditingTransaction(null);
        setShowModal(false);
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      }
    } catch (error) {
      console.error('Error updating recurring transaction:', error);
    }
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    try {
      await updateRecurringTransaction(id, { isActive: !isActive });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
    } catch (error) {
      console.error('Error toggling recurring transaction:', error);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this recurring transaction?')) {
      try {
        await deleteRecurringTransaction(id);
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      } catch (error) {
        console.error('Error deleting recurring transaction:', error);
      }
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

  const getFrequencyText = (transaction: any) => {
    const { frequency, dayOfWeek, dayOfMonth, monthOfYear } = transaction;
    
    switch (frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        if (dayOfWeek !== undefined) {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return `Weekly on ${days[dayOfWeek]}`;
        }
        return 'Weekly';
      case 'monthly':
        if (dayOfMonth) {
          const suffix = dayOfMonth > 3 && dayOfMonth < 21 ? 'th' : 
                       dayOfMonth % 10 === 1 ? 'st' : 
                       dayOfMonth % 10 === 2 ? 'nd' : 
                       dayOfMonth % 10 === 3 ? 'rd' : 'th';
          return `Monthly on the ${dayOfMonth}${suffix}`;
        }
        return 'Monthly';
      case 'yearly':
        if (monthOfYear && dayOfMonth) {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `Yearly on ${months[monthOfYear - 1]} ${dayOfMonth}`;
        } else if (monthOfYear) {
          const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          return `Yearly in ${months[monthOfYear - 1]}`;
        }
        return 'Yearly';
      default:
        return frequency;
    }
  };

  const getNextOccurrences = (transaction: any, count: number = 3) => {
    const occurrences = [];
    let currentDate = new Date(transaction.nextOccurrenceDate);
    
    for (let i = 0; i < count; i++) {
      occurrences.push(new Date(currentDate));
      
      // Calculate next occurrence
      switch (transaction.frequency) {
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          if (transaction.dayOfMonth) {
            currentDate.setDate(Math.min(transaction.dayOfMonth, new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()));
          }
          break;
        case 'yearly':
          currentDate = addYears(currentDate, 1);
          break;
      }
    }
    
    return occurrences;
  };

  const activeTransactions = recurringTransactions.filter(t => t.isActive);
  const inactiveTransactions = recurringTransactions.filter(t => !t.isActive);

  const transactionToEdit = editingTransaction ? 
    recurringTransactions.find(t => t.id === editingTransaction) : null;

  return (
    <div className="min-h-screen text-white pb-20">
      <TopNavigation 
        title="Recurring Transactions" 
        showAdd 
        onAdd={() => setShowModal(true)}
      />
      
      <div className="px-4 py-4 sm:py-6">
        <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
          Automate your regular income and expenses
        </p>

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
          <div className="space-y-6">
            {/* Active Transactions */}
            {activeTransactions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Play size={20} className="mr-2 text-success-400" />
                  Active ({activeTransactions.length})
                </h3>
                <div className="space-y-4">
                  {activeTransactions.map((transaction) => {
                    const nextOccurrences = getNextOccurrences(transaction);
                    
                    return (
                      <div key={transaction.id} className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg ${
                              transaction.type === 'income' 
                                ? 'bg-success-500/20 text-success-400' 
                                : 'bg-error-500/20 text-error-400'
                            }`}>
                              {getFrequencyIcon(transaction.frequency)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-white text-sm sm:text-base">
                                {transaction.description}
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-400">
                                {transaction.category} • {getFrequencyText(transaction)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleToggleActive(transaction.id, transaction.isActive)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="Pause"
                            >
                              <Pause size={16} className="text-gray-400" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingTransaction(transaction.id);
                                setShowModal(true);
                              }}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit3 size={16} className="text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleDelete(transaction.id)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} className="text-error-400" />
                            </button>
                          </div>
                        </div>

                        {/* Amount and Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-xs text-gray-400 mb-1">Amount</p>
                            <p className={`font-semibold text-sm sm:text-base ${
                              transaction.type === 'income' ? 'text-success-400' : 'text-error-400'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-xs text-gray-400 mb-1">Next</p>
                            <p className="font-medium text-white text-xs sm:text-sm">
                              {format(transaction.nextOccurrenceDate, 'MMM dd')}
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-xs text-gray-400 mb-1">Occurrences</p>
                            <p className="font-medium text-white text-xs sm:text-sm">
                              {transaction.currentOccurrences}
                              {transaction.maxOccurrences && `/${transaction.maxOccurrences}`}
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-xs text-gray-400 mb-1">Status</p>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-500/20 text-success-400">
                              Active
                            </span>
                          </div>
                        </div>

                        {/* Next Occurrences Preview */}
                        <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-300 mb-2 flex items-center">
                            <Calendar size={12} className="mr-1" />
                            Next Occurrences
                          </p>
                          <div className="flex space-x-4 text-xs text-gray-400">
                            {nextOccurrences.map((date, index) => (
                              <span key={index}>
                                {format(date, 'MMM dd, yyyy')}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* End Date Warning */}
                        {transaction.endDate && new Date(transaction.endDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                          <div className="mt-3 bg-warning-500/20 border border-warning-500/30 rounded-lg p-3">
                            <p className="text-warning-400 text-xs font-medium">
                              ⚠️ Ending soon: {format(transaction.endDate, 'MMM dd, yyyy')}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inactive Transactions */}
            {inactiveTransactions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Pause size={20} className="mr-2 text-gray-400" />
                  Paused ({inactiveTransactions.length})
                </h3>
                <div className="space-y-4">
                  {inactiveTransactions.map((transaction) => (
                    <div key={transaction.id} className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 opacity-60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-500/20 flex items-center justify-center text-sm">
                            {getFrequencyIcon(transaction.frequency)}
                          </div>
                          <div>
                            <h4 className="font-medium text-white text-sm">
                              {transaction.description}
                            </h4>
                            <p className="text-xs text-gray-400">
                              {transaction.category} • ${transaction.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleActive(transaction.id, transaction.isActive)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Resume"
                          >
                            <Play size={16} className="text-success-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} className="text-error-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTransaction(null);
        }}
        title={editingTransaction ? 'Edit Recurring Transaction' : 'Create Recurring Transaction'}
      >
        <RecurringTransactionForm
          initialData={transactionToEdit}
          onSubmit={editingTransaction ? handleEditRecurringTransaction : handleAddRecurringTransaction}
          onCancel={() => {
            setShowModal(false);
            setEditingTransaction(null);
          }}
        />
      </Modal>
    </div>
  );
};