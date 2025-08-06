import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, Calendar, TrendingUp, TrendingDown, Plus, Minus, Filter, X } from 'lucide-react';
import { format, isToday, isYesterday, startOfDay, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalizationContext } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../components/common/CurrencyIcon';

export const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const { transactions } = useFinance();
  const { formatCurrency, currency } = useInternationalizationContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expenses' | 'transfers'>('all');

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Apply type filter
    if (activeFilter === 'income') {
      filtered = filtered.filter(t => t.type === 'income');
    } else if (activeFilter === 'expenses') {
      filtered = filtered.filter(t => t.type === 'expense');
    } else if (activeFilter === 'transfers') {
      filtered = filtered.filter(t => t.category.toLowerCase().includes('transfer'));
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, activeFilter, searchQuery]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, typeof transactions> = {};
    
    filteredTransactions.forEach(transaction => {
      const date = startOfDay(transaction.date);
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
    });

    return Object.entries(groups).map(([dateKey, transactions]) => ({
      date: new Date(dateKey),
      transactions
    })).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredTransactions]);

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d');
  };

  const getCategoryIcon = (category: string, type: 'income' | 'expense') => {
    const iconMap: Record<string, string> = {
      // Income icons
      'salary': '💼',
      'freelance': '💻',
      'investment': '📈',
      'business': '🏢',
      'gift': '🎁',
      
      // Expense icons
      'food': '🍽️',
      'groceries': '🛒',
      'entertainment': '🎬',
      'dining': '🍽️',
      'transportation': '🚗',
      'utilities': '⚡',
      'bills': '📄',
      'shopping': '🛍️',
      'healthcare': '🏥',
      'education': '📚',
      'travel': '✈️',
      'housing': '🏠',
      'insurance': '🛡️',
      'subscriptions': '📱',
      
      // Default icons
      'income': '💰',
      'expense': '💸',
      'transfer': '🔄'
    };

    const key = category.toLowerCase();
    return iconMap[key] || (type === 'income' ? '💰' : '💸');
  };

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'income', label: 'Income' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'transfers', label: 'Transfers' }
  ];

  return (
    <div className="min-h-screen text-white pb-20">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md px-4 py-4 sticky top-0 z-30 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-300" />
            </button>
            <h1 className="text-xl font-semibold text-white">Transactions</h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions"
            className="block w-full pl-10 pr-4 py-3 bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X size={18} className="text-gray-400 hover:text-white" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-black/20 backdrop-blur-md rounded-xl p-1 border border-white/10">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setActiveFilter(option.id as any)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeFilter === option.id
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      {/* Transaction List */}
      <div className="px-4 py-6">
        {groupedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No transactions found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery ? 'Try adjusting your search terms' : 'Start by adding your first transaction'}
            </p>
            <button
              onClick={() => navigate('/add-transaction')}
              className="bg-primary-500 hover:bg-primary-600 text-white py-3 px-6 rounded-xl font-medium transition-colors"
            >
              <Plus size={18} className="mr-2 inline" />
              Add Transaction
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedTransactions.map(({ date, transactions: dayTransactions }) => (
              <div key={format(date, 'yyyy-MM-dd')}>
                {/* Date Header */}
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-white">{getDateLabel(date)}</h2>
                  {!isToday(date) && !isYesterday(date) && (
                    <p className="text-sm text-gray-400">{format(date, 'MMMM d, yyyy')}</p>
                  )}
                </div>

                {/* Transactions for this date */}
                <div className="space-y-3">
                  {dayTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-md rounded-xl border border-white/10 hover:bg-black/30 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        {/* Category Icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          transaction.type === 'income' 
                            ? 'bg-success-500/20' 
                            : 'bg-error-500/20'
                        }`}>
                          <span className="text-xl">
                            {getCategoryIcon(transaction.category, transaction.type)}
                          </span>
                        </div>

                        {/* Transaction Details */}
                        <div className="flex-1">
                          <h3 className="font-medium text-white text-base">
                            {transaction.description}
                          </h3>
                          <p className="text-sm text-gray-400 capitalize">
                            {transaction.category}
                          </p>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${
                          transaction.type === 'income' 
                            ? 'text-success-400' 
                            : 'text-error-400'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          <CurrencyIcon currencyCode={currency.code} size={16} className="inline mr-1" />
                          {transaction.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(transaction.date, 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};