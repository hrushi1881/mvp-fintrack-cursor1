import React, { useState } from 'react';
import { CreditCard, Calendar, Percent, TrendingDown, Plus, Edit3, Trash2, BarChart3, Calculator, Info, AlertTriangle, ShoppingCart, CheckCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toNumber, calculatePercentage, formatCurrencySafe, validatePaymentAmount } from '../utils/validation';
import { TopNavigation } from '../components/layout/TopNavigation';
import { Modal } from '../components/common/Modal';
import { LiabilityForm } from '../components/forms/LiabilityForm';
import { PaymentForm } from '../components/forms/PaymentForm';
import { Button } from '../components/common/Button';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../components/common/CurrencyIcon';
import { Liability } from '../types';
import { DebtStrategyTool } from '../components/liabilities/DebtStrategyTool';

export const Liabilities: React.FC = () => {
  const { liabilities, addLiability, updateLiability, deleteLiability, addTransaction, transactions } = useFinance();
  const { currency, formatCurrency } = useInternationalization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLiability, setSelectedLiability] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [liabilityToDelete, setLiabilityToDelete] = useState<string | null>(null);
  const [showStrategyTool, setShowStrategyTool] = useState(false);

  const handleAddLiability = async (liability: any, addAsIncome: boolean) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Sanitize numeric fields to prevent NaN
      const sanitizedLiability = {
        ...liability,
        totalAmount: Number(liability.totalAmount) || 0,
        remainingAmount: Number(liability.remainingAmount) || 0,
        interestRate: Number(liability.interestRate) || 0,
        monthlyPayment: Number(liability.monthlyPayment) || 0,
      };
      
      // Validate business logic
      const totalAmt = sanitizedLiability.totalAmount;
      const remainingAmt = sanitizedLiability.remainingAmount;
      const monthlyPmt = sanitizedLiability.monthlyPayment;
      
      if (remainingAmt > totalAmt) {
        throw new Error("Remaining amount cannot exceed total amount");
      }
      
      if (monthlyPmt <= 0) {
        throw new Error("Monthly payment must be greater than zero");
      }
      
      // Add the liability first
      await addLiability(sanitizedLiability);
      
      // Handle different liability types
      if (sanitizedLiability.type === 'purchase') {
        // For purchases on credit, don't add any income transaction
        // The money was already spent when the purchase was made
        console.log('Purchase on credit added - no income transaction created');
      } else if (addAsIncome) {
        // For loans/credit where user receives cash, add income transaction
        await addTransaction({
          type: 'income',
          amount: sanitizedLiability.totalAmount,
          category: 'Loan',
          description: `Loan received: ${sanitizedLiability.name}`,
          date: new Date(),
        });
      }
      
      setShowModal(false);
      setError(null);
      // Show success message
      setTimeout(() => {
        alert('Liability added successfully!');
      }, 100);
    } catch (error: any) {
      console.error('Error adding liability:', error);
      setError(error.message || 'Failed to add liability');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLiability = async (liability: Omit<Liability, 'id' | 'userId' | 'createdAt'>, addAsIncome: boolean) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Sanitize numeric fields to prevent NaN
      const sanitizedLiability = {
        ...liability,
        totalAmount: Number(liability.totalAmount) || 0,
        remainingAmount: Number(liability.remainingAmount) || 0,
        interestRate: Number(liability.interestRate) || 0,
        monthlyPayment: Number(liability.monthlyPayment) || 0,
      };
      
      // Validate business logic
      const totalAmt = sanitizedLiability.totalAmount;
      const remainingAmt = sanitizedLiability.remainingAmount;
      const monthlyPmt = sanitizedLiability.monthlyPayment;
      
      if (remainingAmt > totalAmt) {
        throw new Error("Remaining amount cannot exceed total amount");
      }
      
      if (monthlyPmt <= 0) {
        throw new Error("Monthly payment must be greater than zero");
      }
      
      if (editingLiability) {
        await updateLiability(editingLiability.id, sanitizedLiability);
        setEditingLiability(null);
        setShowEditModal(false);
        setError(null);
        // Show success message
        setTimeout(() => {
          alert('Liability updated successfully!');
        }, 100);
      }
    } catch (error: any) {
      console.error('Error updating liability:', error);
      setError(error.message || 'Failed to update liability');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLiability = (liabilityId: string) => {
    setLiabilityToDelete(liabilityId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteLiability = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (liabilityToDelete) {
        // Find and delete any linked transactions
        const liability = liabilities.find(l => l.id === liabilityToDelete);
        if (liability && liability.linkedPurchaseId) {
          // Note: In a real app, you might want to unlink rather than delete the purchase
          console.log(`Unlinking purchase transaction: ${liability.linkedPurchaseId}`);
        }
        
        await deleteLiability(liabilityToDelete);
        setLiabilityToDelete(null);
        setShowDeleteConfirm(false);
        setError(null);
        // Show success message
        setTimeout(() => {
          alert('Liability deleted successfully!');
        }, 100);
      }
    } catch (error: any) {
      console.error('Error deleting liability:', error);
      setError(error.message || 'Failed to delete liability');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleMakePayment = async (paymentData: { amount: number; description: string; createTransaction: boolean }) => {
    const liability = liabilities.find(l => l.id === selectedLiability);
    if (!liability) return;

    try {
      setIsSubmitting(true);
      setError(null);
      
      const paymentAmount = Number(paymentData.amount) || 0;
      const currentRemaining = Number(liability.remainingAmount) || 0;
      
      // Handle overpayment
      const actualPayment = Math.min(paymentAmount, currentRemaining);
      if (paymentAmount > currentRemaining) {
        const confirmed = window.confirm(`Payment of ${formatCurrency(paymentAmount)} exceeds remaining balance of ${formatCurrency(currentRemaining)}. Adjust to full payoff amount?`);
        if (!confirmed) {
          setIsSubmitting(false);
          return;
        }
      }
      
      // Add payment as expense transaction if createTransaction is true
      if (paymentData.createTransaction) {
        await addTransaction({
          type: 'expense',
          amount: actualPayment,
          category: 'Debt Payment',
          description: paymentData.description || `Payment for ${liability.name}`,
          date: new Date(),
        });
      }

      // Update liability remaining amount
      await updateLiability(selectedLiability!, {
        remainingAmount: Math.max(0, currentRemaining - actualPayment)
      });

      // Show success message
      setTimeout(() => {
        alert(`Payment of ${formatCurrency(actualPayment)} processed successfully!`);
      }, 100);
      
      setShowPaymentModal(false);
      setSelectedLiability(null);
      setError(null);
    } catch (error: any) {
      console.error('Error making payment:', error);
      setError(error.message || 'Failed to process payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDebt = liabilities.reduce((sum, l) => sum + toNumber(l.remainingAmount), 0);
  const totalMonthlyPayments = liabilities.reduce((sum, l) => sum + toNumber(l.monthlyPayment), 0);

  const getTypeLabel = (type: string) => {
    const labels = {
      loan: 'Loan',
      credit_card: 'Credit Card',
      mortgage: 'Mortgage',
      purchase: 'Purchase',
      other: 'Other'
    };
    return labels[type as keyof typeof labels] || 'Other';
  };

  const getTypeColor = (type: string) => {
    const colors = {
      loan: 'bg-blue-500',
      credit_card: 'bg-red-500',
      mortgage: 'bg-green-500',
      purchase: 'bg-purple-500',
      other: 'bg-gray-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'credit_card':
        return CreditCard;
      case 'mortgage':
        return CurrencyIcon;
      case 'purchase':
        return ShoppingCart;
      default:
        return CreditCard;
    }
  };

  const getEstimatedPayoff = (liability: any) => {
    const remainingAmount = toNumber(liability.remainingAmount);
    const monthlyPayment = toNumber(liability.monthlyPayment);
    
    if (remainingAmount <= 0) return 'Paid Off';
    if (!monthlyPayment || monthlyPayment <= 0) return 'No Payment Set';
    
    const monthsRemaining = Math.ceil(remainingAmount / monthlyPayment);
    return `${monthsRemaining} month${monthsRemaining !== 1 ? 's' : ''}`;
  };

  const getAPRBadgeColor = (rate: number) => {
    if (rate >= 15) return 'bg-red-500';
    if (rate >= 8) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return differenceInDays(due, today);
  };

  // Get liability status
  const getLiabilityStatus = (liability: any) => {
    const remainingAmount = toNumber(liability.remainingAmount);
    const daysUntilDue = getDaysUntilDue(liability.due_date);
    
    if (remainingAmount <= 0) {
      return { status: 'paid_off', color: 'success', label: '✅ Paid Off' };
    }
    
    if (daysUntilDue < 0) {
      return { status: 'overdue', color: 'error', label: '⚠️ Overdue' };
    }
    
    if (daysUntilDue === 0) {
      return { status: 'due_today', color: 'error', label: '🚨 Due Today' };
    }
    
    if (daysUntilDue <= 7) {
      return { status: 'due_soon', color: 'warning', label: `⏰ Due in ${daysUntilDue} days` };
    }
    
    return { status: 'current', color: 'primary', label: '📅 Current' };
  };

  // Find linked purchase transaction for a liability

  const liabilityToEdit = editingLiability ? {
    name: editingLiability.name,
    type: editingLiability.type,
    totalAmount: editingLiability.totalAmount,
    remainingAmount: editingLiability.remainingAmount,
    interestRate: editingLiability.interestRate,
    monthlyPayment: editingLiability.monthlyPayment,
    due_date: editingLiability.due_date,
    start_date: editingLiability.start_date,
  } : null;

  return (
    <div className="min-h-screen text-white pb-20">
      <TopNavigation 
        title="Liabilities" 
        showAdd 
        onAdd={() => setShowModal(true)}
      />
      
      <div className="px-4 py-4 sm:py-6">
        <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Track and manage your debts and loans</p>

        {/* Error Message */}
        {error && (
          <div className="bg-error-500/20 border border-error-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={18} className="text-error-400" />
              <p className="text-error-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {liabilities.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 text-center border border-white/10">
              <p className="text-xs sm:text-sm text-gray-400 mb-1">Total Debt</p>
              <p className="text-lg sm:text-xl font-bold text-white">
                {formatCurrency(totalDebt)}
              </p>
            </div>
            
            <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 text-center border border-white/10">
              <p className="text-xs sm:text-sm text-gray-400 mb-1">Monthly Payments</p>
              <p className="text-lg sm:text-xl font-bold text-white">
                {formatCurrency(totalMonthlyPayments)}
              </p>
            </div>
          </div>
        )}

        {/* Debt Strategy Tool Button */}
        {liabilities.length > 0 && (
          <div className="mb-6">
            <Button 
              onClick={() => setShowStrategyTool(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
            >
              <Calculator size={18} className="mr-2" />
              Debt Repayment Strategy Tool
            </Button>
          </div>
        )}

        {liabilities.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-error-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard size={24} className="text-error-400 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No debts tracked</h3>
            <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Add your debts to track repayment progress</p>
            <Button onClick={() => setShowModal(true)}>
              <Plus size={18} className="mr-2 sm:w-5 sm:h-5" />
              Add Debt
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {liabilities.map((liability) => {
              const totalAmount = toNumber(liability.totalAmount);
              const remainingAmount = toNumber(liability.remainingAmount);
              const monthlyPayment = toNumber(liability.monthlyPayment);
              const interestRate = toNumber(liability.interestRate);
              
              const payoffProgress = calculatePercentage(totalAmount - remainingAmount, totalAmount);
              const estimatedPayoff = getEstimatedPayoff(liability);
              const TypeIcon = getTypeIcon(liability.type);
              const daysUntilDue = getDaysUntilDue(liability.due_date);
              const liabilityStatus = getLiabilityStatus(liability);
              
              return (
                <div key={liability.id} className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 sm:mb-6">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${getTypeColor(liability.type)} flex items-center justify-center`}>
                        {liability.type === 'mortgage' ? (
                          <CurrencyIcon currencyCode={currency.code} size={20} className="text-white sm:w-6 sm:h-6" />
                        ) : liability.type === 'purchase' ? (
                          <ShoppingCart size={20} className="text-white sm:w-6 sm:h-6" />
                        ) : (
                          <TypeIcon size={20} className="text-white sm:w-6 sm:h-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm sm:text-base">{liability.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-400">{getTypeLabel(liability.type)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {liability.interestRate > 0 && (
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium text-white ${getAPRBadgeColor(liability.interestRate)}`}>
                          {liability.interestRate}% APR
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setEditingLiability(liability);
                          setShowEditModal(true);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Edit Liability"
                      >
                        <Edit3 size={16} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteLiability(liability.id)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Delete Liability"
                      >
                        <Trash2 size={16} className="text-error-400" />
                      </button>
                    </div>
                  </div>

                  {/* Purchase Type Info */}
                  {liability.type === 'purchase' && (
                    <div className="mb-4 p-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
                      <div className="flex items-center space-x-2">
                        <ShoppingCart size={14} className="text-purple-400" />
                        <p className="text-xs text-purple-300">
                          Purchase on Credit - Pay down this debt to reduce your liability
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Amount Section */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs sm:text-sm text-gray-400">Paid Off</span>
                      <span className="text-sm sm:text-lg font-semibold text-white">
                        {formatCurrency(totalAmount - remainingAmount)} / {formatCurrency(totalAmount)}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${payoffProgress}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="font-medium text-orange-400">
                        {payoffProgress.toFixed(1)}% paid off
                      </span>
                      <span className="text-gray-400">
                        {formatCurrency(remainingAmount)} remaining
                      </span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4 sm:mb-6">
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} className="text-gray-400 sm:w-4 sm:h-4" />
                      <div>
                        <p className="text-xs text-gray-400">Due Date</p>
                        <div className="flex items-center">
                          <p className="text-xs sm:text-sm font-medium text-white">{format(liability.due_date, 'MMM dd')}</p>
                          {daysUntilDue <= 7 && daysUntilDue >= 0 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-warning-500/20 text-warning-400 text-xs rounded">
                              {daysUntilDue === 0 ? 'Today' : `${daysUntilDue}d`}
                            </span>
                          )}
                          {daysUntilDue < 0 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-error-500/20 text-error-400 text-xs rounded">
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Percent size={14} className="text-gray-400 sm:w-4 sm:h-4" />
                      <div>
                        <p className="text-xs text-gray-400">Monthly Payment</p>
                        <p className="text-xs sm:text-sm font-medium text-white">
                          {formatCurrency(monthlyPayment)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Estimated Payoff */}
                  <div className="text-center py-2 sm:py-3 bg-white/5 rounded-lg mb-4 border border-white/10">
                    <div className="flex items-center justify-center space-x-2">
                      <TrendingDown size={14} className="text-gray-400 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm text-gray-400">Estimated Payoff</span>
                    </div>
                    <p className="font-semibold text-white text-sm sm:text-base">{estimatedPayoff}</p>
                  </div>

                  {/* Status Badge */}
                  <div className={`text-center py-2 sm:py-3 rounded-xl border ${
                    liabilityStatus.status === 'paid_off' ? 'bg-success-500/20 border-success-500/30' :
                    liabilityStatus.status === 'overdue' ? 'bg-error-500/20 border-error-500/30' :
                    liabilityStatus.status === 'due_soon' ? 'bg-warning-500/20 border-warning-500/30' :
                    'bg-primary-500/20 border-primary-500/30'
                  }`}>
                    <span className={`font-medium text-sm ${
                      liabilityStatus.status === 'paid_off' ? 'text-success-400' :
                      liabilityStatus.status === 'overdue' ? 'text-error-400' :
                      liabilityStatus.status === 'due_soon' ? 'text-warning-400' :
                      'text-primary-400'
                    }`}>
                      {liabilityStatus.label}
                    </span>
                  </div>

                  {/* Action Button - Only show if not paid off */}
                  {remainingAmount > 0 && (
                    <Button
                      onClick={() => {
                        setSelectedLiability(liability.id);
                        setShowPaymentModal(true);
                      }}
                      className="w-full text-sm mt-3"
                      size="sm"
                    >
                      Make Payment
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Educational Info */}
        {liabilities.filter(l => toNumber(l.remainingAmount) > 0).length > 0 && (
          <div className="mt-6 bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
            <div className="flex items-start space-x-3">
              <Info size={18} className="text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-400 mb-1">Debt Management Tips</h4>
                <ul className="text-sm text-blue-300 space-y-1 list-disc list-inside">
                  <li>Focus on high-interest debt first (Avalanche method)</li>
                  <li>Or pay off smallest balances first for quick wins (Snowball method)</li>
                  <li>Consider making extra payments when possible</li>
                  <li>Set up automatic payments to avoid late fees</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* Paid Off Debts Summary */}
        {liabilities.filter(l => toNumber(l.remainingAmount) <= 0).length > 0 && (
          <div className="mt-6 bg-success-500/20 rounded-lg p-4 border border-success-500/30">
            <div className="flex items-start space-x-3">
              <CheckCircle size={18} className="text-success-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-success-400 mb-1">Congratulations!</h4>
                <p className="text-sm text-success-300">
                  You've paid off {liabilities.filter(l => toNumber(l.remainingAmount) <= 0).length} debt(s). 
                  Keep up the great work on your financial journey!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Liability Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Debt"
      >
        <LiabilityForm
          onSubmit={handleAddLiability}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

      {/* Edit Liability Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingLiability(null);
        }}
        title="Edit Debt"
      >
        {liabilityToEdit && (
          <LiabilityForm
            initialData={liabilityToEdit}
            onSubmit={handleEditLiability}
            onCancel={() => {
              setShowEditModal(false);
              setEditingLiability(null);
            }}
          />
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedLiability(null);
        }}
        title="Make Payment"
      >
        <PaymentForm
          liability={liabilities.find(l => l.id === selectedLiability)}
          onSubmit={handleMakePayment}
          onCancel={() => {
            setShowPaymentModal(false);
            setSelectedLiability(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setLiabilityToDelete(null);
        }}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete this debt? This action cannot be undone.
          </p>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setLiabilityToDelete(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteLiability}
              className="flex-1 bg-error-500 hover:bg-error-600"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Debt Strategy Tool Modal */}
      <Modal
        isOpen={showStrategyTool}
        onClose={() => setShowStrategyTool(false)}
        title="Debt Repayment Strategy"
      >
        <DebtStrategyTool onClose={() => setShowStrategyTool(false)} />
      </Modal>
    </div>
  );
};