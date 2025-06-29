import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { Transaction } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface RecentActivityProps {
  transactions: Transaction[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ transactions }) => {
  const [showAll, setShowAll] = useState(false);
  const { formatCurrency } = useInternationalization();
  const displayTransactions = showAll ? transactions : transactions.slice(0, 3);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        {transactions.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center text-primary-500 text-sm font-medium hover:text-primary-600"
          >
            {showAll ? (
              <>
                Show Less <ChevronUp size={16} className="ml-1" />
              </>
            ) : (
              <>
                Show All <ChevronDown size={16} className="ml-1" />
              </>
            )}
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {displayTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-white/50 transition-colors"
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
                <p className="font-medium text-gray-900">
                  {transaction.description}
                </p>
                <p className="text-sm text-gray-500">
                  {transaction.category}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className={`font-semibold ${
                transaction.type === 'income' 
                  ? 'text-success-500' 
                  : 'text-error-500'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </p>
              <p className="text-xs text-gray-500">
                {format(transaction.date, 'MMM dd')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};