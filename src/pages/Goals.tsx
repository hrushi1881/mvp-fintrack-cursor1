import React, { useState } from 'react';
import { Target, Calendar, Plus, ArrowUpDown, TrendingUp, Edit3, Trash2, AlertCircle } from 'lucide-react';
import { format, differenceInMonths } from 'date-fns';
import { toNumber, calculatePercentage, sanitizeFinancialData } from '../utils/validation';
import { TopNavigation } from '../components/layout/TopNavigation';
import { Modal } from '../components/common/Modal';
import { GoalForm } from '../components/forms/GoalForm';
import { GoalTransactionForm } from '../components/forms/GoalTransactionForm';
import { Button } from '../components/common/Button';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../components/common/CurrencyIcon';
import { Goal } from '../types';

export const Goals: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal, addTransaction } = useFinance();
  const { currency, formatCurrency } = useInternationalization();
  const [showModal, setShowModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find emergency fund goal
  const emergencyFund = goals.find(g => g.category.toLowerCase() === 'emergency');
  const emergencyFundBalance = emergencyFund ? (Number(emergencyFund.currentAmount) || 0) : 0;

  const handleAddGoal = async (goal: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Sanitize numeric fields to prevent NaN
      const sanitizedGoal = sanitizeFinancialData(goal, ['targetAmount', 'currentAmount']);
      
      await addGoal(sanitizedGoal);
      setShowModal(false);
    } catch (error: any) {
      console.error('Error adding goal:', error);
      setError(error.message || 'Failed to add goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditGoal = async (goal: Omit<Goal, 'id' | 'userId' | 'createdAt'>) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Sanitize numeric fields to prevent NaN
      const sanitizedGoal = sanitizeFinancialData(goal, ['targetAmount', 'currentAmount']);
      
      if (editingGoal) {
        await updateGoal(editingGoal.id, sanitizedGoal);
        setEditingGoal(null);
        setShowEditModal(false);
      }
    } catch (error: any) {
      console.error('Error updating goal:', error);
      setError(error.message || 'Failed to update goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoalToDelete(goalId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteGoal = async () => {
    try {
      setIsSubmitting(true);
      
      if (goalToDelete) {
        await deleteGoal(goalToDelete);
        setGoalToDelete(null);
        setShowDeleteConfirm(false);
      }
    } catch (error: any) {
      console.error('Error deleting goal:', error);
      setError(error.message || 'Failed to delete goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoalTransaction = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const goal = goals.find(g => g.id === selectedGoalId);
      if (!goal) return;

      const { amount, type, source, description, deductFromBalance } = data;
      const numericAmount = Number(amount) || 0;

      if (type === 'add') {
        // Add money to goal
        const currentAmount = Number(goal.currentAmount) || 0;
        const targetAmount = Number(goal.targetAmount) || 0;
        const newAmount = Math.min(currentAmount + numericAmount, targetAmount);
        
        await updateGoal(selectedGoalId!, {
          currentAmount: newAmount
        });

        if (source === 'emergency_fund' && emergencyFund) {
          // Deduct from emergency fund
          const emergencyCurrentAmount = Number(emergencyFund.currentAmount) || 0;
          await updateGoal(emergencyFund.id, {
            currentAmount: Math.max(0, emergencyCurrentAmount - numericAmount)
          });
          
          // Record as internal transfer
          await addTransaction({
            type: 'expense',
            amount: numericAmount,
            category: 'Internal Transfer',
            description: `${description} (from Emergency Fund)`,
            date: new Date(),
          });
        } else if (deductFromBalance) {
          // Record as savings/investment expense (money leaves account)
          await addTransaction({
            type: 'expense',
            amount: numericAmount,
            category: 'Savings',
            description: description,
            date: new Date(),
          });
        }
        // If deductFromBalance is false, we don't record any transaction
        // This is useful for tracking gifts, bonuses, or manual transfers
      } else {
        // Withdraw money from goal
        const currentAmount = Number(goal.currentAmount) || 0;
        const newAmount = Math.max(0, currentAmount - numericAmount);
        
        await updateGoal(selectedGoalId!, {
          currentAmount: newAmount
        });

        if (source === 'emergency_fund' && emergencyFund) {
          // Add to emergency fund
          const emergencyCurrentAmount = Number(emergencyFund.currentAmount) || 0;
          await updateGoal(emergencyFund.id, {
            currentAmount: emergencyCurrentAmount + numericAmount
          });
          
          // Record as internal transfer
          await addTransaction({
            type: 'income',
            amount: numericAmount,
            category: 'Internal Transfer',
            description: `${description} (to Emergency Fund)`,
            date: new Date(),
          });
        } else {
          // Record as income (money withdrawn to external account)
          await addTransaction({
            type: 'income',
            amount: numericAmount,
            category: 'Goal Withdrawal',
            description: description,
            date: new Date(),
          });
        }
      }

      setShowTransactionModal(false);
      setSelectedGoalId(null);
    } catch (error: any) {
      console.error('Error processing goal transaction:', error);
      setError(error.message || 'Failed to process transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  const getCategoryColor = (category: string) => {
    const colors = {
      'emergency': 'bg-red-500',
      'travel': 'bg-blue-500',
      'education': 'bg-purple-500',
      'home': 'bg-green-500',
      'investment': 'bg-yellow-500',
      'other': 'bg-gray-500'
    };
    return colors[category.toLowerCase() as keyof typeof colors] || 'bg-gray-500';
  };

  const getEstimatedCompletion = (goal: any) => {
    const remaining = (Number(goal.targetAmount) || 0) - (Number(goal.currentAmount) || 0);
    if (remaining <= 0) return 'Completed';
    
    const monthsToTarget = differenceInMonths(goal.targetDate, new Date());
    const monthlyNeeded = remaining / Math.max(monthsToTarget, 1);
    
    if (monthlyNeeded <= 500) {
      return `${monthsToTarget} months`;
    } else {
      const realisticMonths = Math.ceil(remaining / 500);
      return `${realisticMonths} months`;
    }
  };

  // Get goal status
  const getGoalStatus = (goal: any) => {
    const currentAmount = toNumber(goal.currentAmount);
    const targetAmount = toNumber(goal.targetAmount);
    const progress = calculatePercentage(currentAmount, targetAmount);
    const isCompleted = progress >= 100;
    const isEmergencyFund = goal.category.toLowerCase() === 'emergency';
    
    if (isCompleted) {
      return { status: 'completed', color: 'success', label: '🎉 Goal Completed!' };
    }
    
    if (isEmergencyFund && currentAmount > 0) {
      return { status: 'emergency_ready', color: 'warning', label: '💰 Emergency fund ready' };
    }
    
    if (progress >= 75) {
      return { status: 'almost_there', color: 'primary', label: '🎯 Almost there!' };
    }
    
    if (progress >= 50) {
      return { status: 'halfway', color: 'primary', label: '📈 Halfway there!' };
    }
    
    if (progress >= 25) {
      return { status: 'good_start', color: 'primary', label: '🌱 Good start!' };
    }
    
    return { status: 'just_started', color: 'gray', label: '🚀 Let\'s get started!' };
  };

  return (
    <div className="min-h-screen text-white pb-20">
      <TopNavigation 
        title="Goals" 
        showAdd 
        onAdd={() => setShowModal(true)}
      />
      
      <div className="px-4 py-4 sm:py-6">
        <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Track and achieve your financial goals</p>
        
        {/* Error Message */}
        {error && (
          <div className="bg-error-500/20 border border-error-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle size={18} className="text-error-400" />
              <p className="text-error-400 text-sm">{error}</p>
            </div>
          </div>
        )}
        
        {goals.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target size={24} className="text-primary-400 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No goals yet</h3>
            <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Set your first financial goal to start tracking progress</p>
            <Button onClick={() => setShowModal(true)}>
              <Plus size={18} className="mr-2 sm:w-5 sm:h-5" />
              Create Goal
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {goals.map((goal) => {
              const currentAmount = toNumber(goal.currentAmount);
              const targetAmount = toNumber(goal.targetAmount);
              const progress = calculatePercentage(currentAmount, targetAmount);
              const isCompleted = progress >= 100;
              const isEmergencyFund = goal.category.toLowerCase() === 'emergency';
              const goalStatus = getGoalStatus(goal);
              const estimatedCompletion = getEstimatedCompletion(goal);
              
              return (
                <div key={goal.id} className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 sm:mb-6">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${getCategoryColor(goal.category)} flex items-center justify-center`}>
                        <Target size={20} className="text-white sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm sm:text-base">{goal.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-400">{goal.category}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingGoal(goal);
                          setShowEditModal(true);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Edit Goal"
                      >
                        <Edit3 size={16} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-2 hover:bg-error-500/20 rounded-lg transition-colors"
                        title="Delete Goal"
                      >
                        <Trash2 size={16} className="text-error-400" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedGoalId(goal.id);
                          setShowTransactionModal(true);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <ArrowUpDown size={18} className="text-gray-400 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs sm:text-sm text-gray-400">Progress</span>
                      <span className="text-sm sm:text-lg font-semibold text-white">
                        <CurrencyIcon currencyCode={currency.code} size={16} className="inline mr-1" />
                        {currentAmount.toLocaleString()} / <CurrencyIcon currencyCode={currency.code} size={16} className="inline mr-1" />{targetAmount.toLocaleString()}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-green-500' : 
                          isEmergencyFund ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className={`font-medium ${
                        isCompleted ? 'text-green-400' : 
                        isEmergencyFund ? 'text-red-400' : 'text-blue-400'
                      }`}>
                        {progress.toFixed(1)}% complete
                      </span>
                      <span className="text-gray-400">
                        <CurrencyIcon currencyCode={currency.code} size={12} className="inline mr-1" />
                        {Math.max(0, targetAmount - currentAmount).toLocaleString()} remaining
                      </span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4 sm:mb-6">
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} className="text-gray-400 sm:w-4 sm:h-4" />
                      <div>
                        <p className="text-xs text-gray-400">Due Date</p>
                        <p className="text-xs sm:text-sm font-medium text-white">{format(goal.targetDate, 'MMM dd')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <TrendingUp size={14} className="text-gray-400 sm:w-4 sm:h-4" />
                      <div>
                        <p className="text-xs text-gray-400">Estimated Completion</p>
                        <p className="text-xs sm:text-sm font-medium text-white">{estimatedCompletion}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status/Action Section */}
                  {/* Status Badge */}
                  <div className={`text-center py-2 sm:py-3 rounded-xl border ${
                    goalStatus.status === 'completed' ? 'bg-success-500/20 border-success-500/30' :
                    goalStatus.status === 'emergency_ready' ? 'bg-warning-500/20 border-warning-500/30' :
                    goalStatus.color === 'primary' ? 'bg-primary-500/20 border-primary-500/30' :
                    'bg-gray-500/20 border-gray-500/30'
                  }`}>
                    <span className={`font-medium text-sm ${
                      goalStatus.status === 'completed' ? 'text-success-400' :
                      goalStatus.status === 'emergency_ready' ? 'text-warning-400' :
                      goalStatus.color === 'primary' ? 'text-primary-400' :
                      'text-gray-400'
                    }`}>
                      {goalStatus.label}
                    </span>
                  </div>

                  {/* Action Buttons - Only show if not completed */}
                  {!isCompleted && (
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedGoalId(goal.id);
                          setShowTransactionModal(true);
                        }}
                        className="flex-1 text-xs sm:text-sm border-white/20 hover:border-white/40"
                      >
                        +<CurrencyIcon currencyCode={currency.code} size={12} className="inline mx-1" />100
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedGoalId(goal.id);
                          setShowTransactionModal(true);
                        }}
                        className="flex-1 text-xs sm:text-sm"
                      >
                        Manage
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {/* Completed Goals Summary */}
        {goals.filter(g => calculatePercentage(toNumber(g.currentAmount), toNumber(g.targetAmount)) >= 100).length > 0 && (
          <div className="mt-6 bg-success-500/20 rounded-lg p-4 border border-success-500/30">
            <div className="flex items-start space-x-3">
              <CheckCircle size={18} className="text-success-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-success-400 mb-1">Achievements Unlocked!</h4>
                <p className="text-sm text-success-300">
                  You've completed {goals.filter(g => calculatePercentage(toNumber(g.currentAmount), toNumber(g.targetAmount)) >= 100).length} goal(s). 
                  Excellent work on reaching your financial milestones!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Goal Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setError(null);
        }}
        title="Create New Goal"
      >
        <GoalForm
          onSubmit={handleAddGoal}
          onCancel={() => {
            setShowModal(false);
            setError(null);
          }}
        />
      </Modal>

      {/* Edit Goal Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingGoal(null);
          setError(null);
        }}
        title="Edit Goal"
      >
        {editingGoal && (
          <GoalForm
            initialData={{
              title: editingGoal.title,
              description: editingGoal.description,
              targetAmount: editingGoal.targetAmount,
              currentAmount: editingGoal.currentAmount,
              targetDate: editingGoal.targetDate.toISOString().split('T')[0],
              category: editingGoal.category
            }}
            onSubmit={handleEditGoal}
            onCancel={() => {
              setShowEditModal(false);
              setEditingGoal(null);
              setError(null);
            }}
          />
        )}
      </Modal>

      {/* Goal Transaction Modal */}
      <Modal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setSelectedGoalId(null);
          setError(null);
        }}
        title={`Manage ${selectedGoal?.title || 'Goal'}`}
      >
        {selectedGoal && (
          <GoalTransactionForm
            goal={selectedGoal}
            emergencyFundBalance={emergencyFundBalance}
            onSubmit={handleGoalTransaction}
            onCancel={() => {
              setShowTransactionModal(false);
              setSelectedGoalId(null);
              setError(null);
            }}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setGoalToDelete(null);
          setError(null);
        }}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete this goal? This action cannot be undone.
          </p>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setGoalToDelete(null);
              }}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteGoal}
              className="flex-1 bg-error-500 hover:bg-error-600"
              loading={isSubmitting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};