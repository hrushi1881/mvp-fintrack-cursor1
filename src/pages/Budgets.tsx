import React, { useState } from 'react';
import { PieChart, Calculator, TrendingUp, AlertTriangle, Plus, Edit3, Trash2 } from 'lucide-react';
import { TopNavigation } from '../components/layout/TopNavigation';
import { Modal } from '../components/common/Modal';
import { BudgetForm } from '../components/forms/BudgetForm';
import { Button } from '../components/common/Button';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../components/common/CurrencyIcon';
import { Budget } from '../types';

export const Budgets: React.FC = () => {
  const { budgets, addBudget, updateBudget, deleteBudget, transactions } = useFinance();
  const { currency } = useInternationalization();
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddBudget = async (budget: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await addBudget(budget);
      setShowModal(false);
    } catch (error: any) {
      console.error('Error adding budget:', error);
      setError(error.message || 'Failed to add budget. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBudget = async (budget: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (editingBudget) {
        await updateBudget(editingBudget, budget);
        setEditingBudget(null);
        setShowModal(false);
      }
    } catch (error: any) {
      console.error('Error updating budget:', error);
      setError(error.message || 'Failed to update budget. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBudget = (budgetId: string) => {
    setBudgetToDelete(budgetId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteBudget = async () => {
    try {
      setIsSubmitting(true);
      
      if (budgetToDelete) {
        await deleteBudget(budgetToDelete);
        setBudgetToDelete(null);
        setShowDeleteConfirm(false);
      }
    } catch (error: any) {
      console.error('Error deleting budget:', error);
      setError(error.message || 'Failed to delete budget. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBudgetStatus = (budget: any) => {
    const utilization = (budget.spent / budget.amount) * 100;
    if (utilization >= 100) return { status: 'over', color: 'red' };
    if (utilization >= 80) return { status: 'warning', color: 'yellow' };
    return { status: 'good', color: 'green' };
  };

  const getBudgetIcon = (category: string) => {
    const icons = {
      'Food': '🍽️',
      'Transportation': '🚗',
      'Entertainment': '🎬',
      'Shopping': '🛍️',
      'Bills': '📄',
      'Healthcare': '🏥',
      'Other': '📊'
    };
    return icons[category as keyof typeof icons] || '📊';
  };

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overallUtilization = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  const budgetToEdit = editingBudget ? budgets.find(b => b.id === editingBudget) : null;

  return (
    <div className="min-h-screen text-white pb-20">
      <TopNavigation 
        title="Budgets" 
        showAdd 
        onAdd={() => setShowModal(true)}
      />
      
      <div className="px-4 py-4 sm:py-6">
        <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Set spending limits and track your progress</p>

        {/* Error Message */}
        {error && (
          <div className="bg-error-500/20 border border-error-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle size={18} className="text-error-400" />
              <p className="text-error-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {budgets.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calculator size={24} className="text-primary-400 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No budgets set</h3>
            <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Create your first budget to start tracking spending</p>
            <Button onClick={() => setShowModal(true)}>
              <Plus size={18} className="mr-2 sm:w-5 sm:h-5" />
              Create Budget
            </Button>
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 sm:mb-6">
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10">
                <Calculator size={20} className="mx-auto text-primary-400 mb-2 sm:w-6 sm:h-6" />
                <p className="text-xs sm:text-sm text-gray-400">Total Budgeted</p>
                <p className="text-lg sm:text-xl font-bold text-white">
                  <CurrencyIcon currencyCode={currency.code} size={18} className="inline mr-1" />
                  {totalBudgeted.toLocaleString()}
                </p>
              </div>
              
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10">
                <TrendingUp size={20} className="mx-auto text-warning-400 mb-2 sm:w-6 sm:h-6" />
                <p className="text-xs sm:text-sm text-gray-400">Total Spent</p>
                <p className="text-lg sm:text-xl font-bold text-white">
                  <CurrencyIcon currencyCode={currency.code} size={18} className="inline mr-1" />
                  {totalSpent.toLocaleString()}
                </p>
              </div>
              
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10">
                <PieChart size={20} className={`mx-auto mb-2 sm:w-6 sm:h-6 ${
                  overallUtilization >= 100 ? 'text-error-400' :
                  overallUtilization >= 80 ? 'text-warning-400' : 'text-success-400'
                }`} />
                <p className="text-xs sm:text-sm text-gray-400">Overall Usage</p>
                <p className={`text-lg sm:text-xl font-bold ${
                  overallUtilization >= 100 ? 'text-error-400' :
                  overallUtilization >= 80 ? 'text-warning-400' : 'text-success-400'
                }`}>
                  {overallUtilization.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Budget List */}
            <div className="space-y-4">
              {budgets.map((budget) => {
                const utilization = (budget.spent / budget.amount) * 100;
                const { status, color } = getBudgetStatus(budget);
                const remaining = budget.amount - budget.spent;
                
                return (
                  <div key={budget.id} className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-xl sm:text-2xl">
                          {getBudgetIcon(budget.category)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-sm sm:text-base">{budget.category}</h3>
                          <p className="text-xs sm:text-sm text-gray-400 capitalize">{budget.period} budget</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {status === 'over' && (
                          <AlertTriangle size={18} className="text-red-400 sm:w-5 sm:h-5" />
                        )}
                        <button
                          onClick={() => {
                            setEditingBudget(budget.id);
                            setShowModal(true);
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Edit Budget"
                        >
                          <Edit3 size={14} className="text-gray-400 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBudget(budget.id)}
                          className="p-2 hover:bg-error-500/20 rounded-lg transition-colors"
                          title="Delete Budget"
                        >
                          <Trash2 size={14} className="text-error-400 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Amount Section */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs sm:text-sm text-gray-400">Spent</span>
                        <span className="text-sm sm:text-lg font-semibold text-white">
                          <CurrencyIcon currencyCode={currency.code} size={16} className="inline mr-1" />
                          {budget.spent.toLocaleString()} / <CurrencyIcon currencyCode={currency.code} size={16} className="inline mr-1" />{budget.amount.toLocaleString()}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-white/10 rounded-full h-3 mb-2">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            color === 'red' ? 'bg-red-500' :
                            color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className={`font-medium ${
                          color === 'red' ? 'text-red-400' :
                          color === 'yellow' ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {utilization.toFixed(1)}% used
                        </span>
                        <span className={`${remaining < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {remaining < 0 ? 'Over by ' : ''}<CurrencyIcon currencyCode={currency.code} size={12} className="inline mr-1" />{Math.abs(remaining).toLocaleString()} 
                          {remaining >= 0 ? ' remaining' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Status Message */}
                    <div className={`text-center py-2 sm:py-3 rounded-lg border ${
                      status === 'over' ? 'bg-red-500/20 border-red-500/30' :
                      status === 'warning' ? 'bg-yellow-500/20 border-yellow-500/30' :
                      'bg-green-500/20 border-green-500/30'
                    }`}>
                      <span className={`text-xs sm:text-sm font-medium ${
                        status === 'over' ? 'text-red-400' :
                        status === 'warning' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {status === 'over' ? '⚠️ Budget exceeded' :
                         status === 'warning' ? '⚡ Approaching limit' :
                         '✅ On track'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Budget Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingBudget(null);
          setError(null);
        }}
        title={editingBudget ? 'Edit Budget' : 'Create New Budget'}
      >
        <BudgetForm
          initialData={budgetToEdit}
          onSubmit={editingBudget ? handleEditBudget : handleAddBudget}
          onCancel={() => {
            setShowModal(false);
            setEditingBudget(null);
            setError(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setBudgetToDelete(null);
          setError(null);
        }}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete this budget? This action cannot be undone.
          </p>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setBudgetToDelete(null);
              }}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteBudget}
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