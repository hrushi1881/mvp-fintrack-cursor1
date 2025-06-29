import React from 'react';
import { Plus, Minus, Target, CreditCard } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';

interface QuickActionsProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddGoal: () => void;
  onAddLiability: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onAddIncome,
  onAddExpense,
  onAddGoal,
  onAddLiability,
}) => {
  const actions = [
    {
      label: 'Add Income',
      icon: Plus,
      color: 'success',
      onClick: onAddIncome,
    },
    {
      label: 'Add Expense',
      icon: Minus,
      color: 'error',
      onClick: onAddExpense,
    },
    {
      label: 'New Goal',
      icon: Target,
      color: 'primary',
      onClick: onAddGoal,
    },
    {
      label: 'Add Debt',
      icon: CreditCard,
      color: 'warning',
      onClick: onAddLiability,
    },
  ];

  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`flex flex-col items-center p-4 rounded-xl border-2 border-dashed transition-all duration-200 hover:scale-105 ${
              action.color === 'success' 
                ? 'border-success-300 hover:border-success-400 hover:bg-success-50' 
                : action.color === 'error'
                ? 'border-error-300 hover:border-error-400 hover:bg-error-50'
                : action.color === 'primary'
                ? 'border-primary-300 hover:border-primary-400 hover:bg-primary-50'
                : 'border-warning-300 hover:border-warning-400 hover:bg-warning-50'
            }`}
          >
            <action.icon 
              size={24} 
              className={`mb-2 ${
                action.color === 'success' 
                  ? 'text-success-500' 
                  : action.color === 'error'
                  ? 'text-error-500'
                  : action.color === 'primary'
                  ? 'text-primary-500'
                  : 'text-warning-500'
              }`}
            />
            <span className="text-sm font-medium text-gray-700">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </GlassCard>
  );
};