import React from 'react';
import { Plus, TrendingUp, Target, Calendar, PieChart, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsProps {
  onAddTransaction?: () => void;
  onAddGoal?: () => void;
  onAddBudget?: () => void;
  onAddLiability?: () => void;
  compact?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onAddTransaction,
  onAddGoal,
  onAddBudget,
  onAddLiability,
  compact = false,
}) => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Add Transaction',
      icon: Plus,
      color: 'primary',
      onClick: onAddTransaction || (() => navigate('/add-transaction')),
    },
    {
      label: 'View Analytics',
      icon: TrendingUp,
      color: 'success',
      onClick: () => navigate('/analytics'),
    },
    {
      label: 'Set Goal',
      icon: Target,
      color: 'warning',
      onClick: onAddGoal,
    },
    {
      label: 'View Calendar',
      icon: Calendar,
      color: 'info',
      onClick: () => navigate('/calendar'),
    },
    {
      label: 'Manage Budget',
      icon: PieChart,
      color: 'purple',
      onClick: onAddBudget || (() => navigate('/budgets')),
    },
    {
      label: 'Track Debt',
      icon: CreditCard,
      color: 'error',
      onClick: onAddLiability || (() => navigate('/liabilities')),
    },
  ];

  const displayActions = compact ? actions.slice(0, 4) : actions;

  return (
    <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'} gap-3`}>
      {displayActions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className={`flex flex-col items-center p-3 sm:p-4 rounded-xl border-2 border-dashed transition-all duration-200 hover:scale-105 backdrop-blur-sm ${
            action.color === 'primary' 
              ? 'border-primary-500/30 hover:border-primary-500/50 hover:bg-primary-500/5' 
              : action.color === 'success'
              ? 'border-success-500/30 hover:border-success-500/50 hover:bg-success-500/5'
              : action.color === 'warning'
              ? 'border-warning-500/30 hover:border-warning-500/50 hover:bg-warning-500/5'
              : action.color === 'error'
              ? 'border-error-500/30 hover:border-error-500/50 hover:bg-error-500/5'
              : action.color === 'info'
              ? 'border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/5'
              : 'border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/5'
          }`}
        >
          <action.icon 
            size={compact ? 18 : 20} 
            className={`mb-2 ${
              action.color === 'primary' 
                ? 'text-primary-400' 
                : action.color === 'success'
                ? 'text-success-400'
                : action.color === 'warning'
                ? 'text-warning-400'
                : action.color === 'error'
                ? 'text-error-400'
                : action.color === 'info'
                ? 'text-blue-400'
                : 'text-purple-400'
            } sm:w-6 sm:h-6`}
          />
          <span className="text-xs sm:text-sm font-medium text-gray-300 text-center">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
};