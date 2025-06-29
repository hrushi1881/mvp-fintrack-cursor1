import React from 'react';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Transaction } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onViewAll: () => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  onViewAll,
}) => {
  const { formatCurrency } = useInternationalization();
  const recentTransactions = transactions.slice(0, 5);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        <button
          onClick={onViewAll}
          className="text-primary-500 text-sm font-medium hover:text-primary-600"
        >
          View All
        </button>
      </div>
      
      <div className="space-y-3">
        {recentTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                transaction.type === 'income' 
                  ? 'bg-success-100' 
                  : 'bg-error-100'
              }`}>
                {transaction.type === 'income' ? (
                  <ArrowUpRight size={16} className="text-success-500" />
                ) : (
                  <ArrowDownLeft size={16} className="text-error-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {transaction.description}
                </p>
                <p className="text-xs text-gray-500">
                  {transaction.category} • {format(transaction.date, 'MMM dd')}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className={`text-sm font-semibold ${
                transaction.type === 'income' 
                  ? 'text-success-500' 
                  : 'text-error-500'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};