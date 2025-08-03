import React, { useState, useMemo } from 'react';
import { ArrowLeft, Edit3, Trash2, Search, Filter, Calendar, Tag, TrendingUp, TrendingDown, Plus, Minus, Eye, EyeOff, CheckSquare, Square, Scissors } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../components/common/Modal';
import { TransactionForm } from '../components/forms/TransactionForm';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { CollapsibleHeader } from '../components/layout/CollapsibleHeader';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../components/common/CurrencyIcon';
import { Transaction } from '../types';
import { useSupabaseQuery, usePaginatedQuery } from '../hooks/useSupabaseQuery';

interface TransactionFilters {
  search: string;
  type: 'all' | 'income' | 'expense';
  category: string;
  dateRange: {
    start: string;
    end: string;
  };
  amountRange: {
    min: string;
    max: string;
  };
}

export const TransactionHistory: React.FC = () => {
  const navigate = useNavigate();
  const { addTransaction, deleteTransaction, updateTransaction, stats, userCategories, getSplitTransactions, getTransactionsPaginated, searchTransactions } = useFinance();
  const { formatCurrency, currency } = useInternationalization();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;
  
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    type: 'all',
    category: '',
    dateRange: { start: '', end: '' },
    amountRange: { min: '', max: '' }
  });

  // Use paginated query for transactions
  const {
    data: paginatedData,
    isLoading,
    error,
    page,
    setPage,
    hasNextPage,
    hasPreviousPage
  } = usePaginatedQuery(
    ['transactions'],
    (page, pageSize) => getTransactionsPaginated(page, pageSize, filters),
    pageSize
  );

  const transactions = paginatedData?.data || [];
  const totalCount = paginatedData?.count || 0;

  // Search query for filtered results
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['search-transactions', filters],
    queryFn: () => {
      if (hasActiveFilters) {
        return searchTransactions('', filters);
      }
      return Promise.resolve([]);
    },
    enabled: hasActiveFilters
  });

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    const transactionsToFilter = hasActiveFilters ? (searchResults || []) : transactions;
    
    return transactionsToFilter.filter(transaction => {
      // Skip child transactions (they'll be shown with their parent)
      if (transaction.parentTransactionId) return false;
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!transaction.description.toLowerCase().includes(searchLower) &&
            !transaction.category.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Type filter
      if (filters.type !== 'all' && transaction.type !== filters.type) {
        return false;
      }

      // Category filter
      if (filters.category && transaction.category !== filters.category) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const transactionDate = transaction.date;
        const start = filters.dateRange.start ? parseISO(filters.dateRange.start) : new Date(0);
        const end = filters.dateRange.end ? parseISO(filters.dateRange.end) : new Date();
        
        if (!isWithinInterval(transactionDate, { start, end })) {
          return false;
        }
      }

      // Amount range filter
      if (filters.amountRange.min && transaction.amount < parseFloat(filters.amountRange.min)) {
        return false;
      }
      if (filters.amountRange.max && transaction.amount > parseFloat(filters.amountRange.max)) {
        return false;
      }

      return true;
    });
  }, [transactions, searchResults, filters, hasActiveFilters]);

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = new Set(userCategories.map(c => c.name));
    return Array.from(uniqueCategories).sort();
  }, [userCategories]);
  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    
    filteredTransactions.forEach(transaction => {
      const dateKey = format(transaction.date, 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
    });

    // Sort dates in descending order
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    
    return sortedDates.map(date => ({
      date,
      transactions: groups[date].sort((a, b) => b.date.getTime() - a.date.getTime())
    }));
  }, [filteredTransactions]);

  // Calculate daily totals
  const getDayTotals = (dayTransactions: Transaction[]) => {
    const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, net: income - expenses };
  };

  // Calculate filtered totals
  const filteredTotals = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, net: income - expenses };
  }, [filteredTransactions]);

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  const handleUpdateTransaction = async (updatedData: Omit<Transaction, 'id' | 'userId'>) => {
    if (!editingTransaction) return;

    // Update the transaction using the new updateTransaction method
    await updateTransaction(editingTransaction.id, {
      ...updatedData,
      amount: Number(updatedData.amount),
    });
    
    setShowEditModal(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (transactionToDelete) {
      await deleteTransaction(transactionToDelete);
      setTransactionToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTransactions.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedTransactions.size} transactions?`)) {
      for (const transactionId of selectedTransactions) {
        await deleteTransaction(transactionId);
      }
      setSelectedTransactions(new Set());
      setBulkEditMode(false);
    }
  };

  const handleBulkCategoryUpdate = async (newCategory: string) => {
    if (selectedTransactions.size === 0 || !newCategory) return;
    
    if (confirm(`Update category to "${newCategory}" for ${selectedTransactions.size} transactions?`)) {
      for (const transactionId of selectedTransactions) {
        await updateTransaction(transactionId, { category: newCategory });
      }
      setSelectedTransactions(new Set());
      setBulkEditMode(false);
    }
  };

  const toggleTransactionSelection = (transactionId: string) => {
    const newSelection = new Set(selectedTransactions);
    if (newSelection.has(transactionId)) {
      newSelection.delete(transactionId);
    } else {
      newSelection.add(transactionId);
    }
    setSelectedTransactions(newSelection);
  };

  const toggleTransactionExpanded = (transactionId: string) => {
    const newExpanded = new Set(expandedTransactions);
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setExpandedTransactions(newExpanded);
  };

  const selectAllVisible = () => {
    const allVisible = new Set(filteredTransactions.map(t => t.id));
    setSelectedTransactions(allVisible);
  };

  const clearSelection = () => {
    setSelectedTransactions(new Set());
    setBulkEditMode(false);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      category: '',
      dateRange: { start: '', end: '' },
      amountRange: { min: '', max: '' }
    });
  };

  const hasActiveFilters = filters.search || filters.type !== 'all' || filters.category || 
                          filters.dateRange.start || filters.dateRange.end || 
                          filters.amountRange.min || filters.amountRange.max;

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [filters, setPage]);

  return (
    <div className="min-h-screen text-white pb-20">
      {/* Collapsible Header */}
      <CollapsibleHeader>
        <div className="px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-400" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Transaction History</h1>
                <p className="text-xs sm:text-sm text-gray-400">
                  {filteredTransactions.length} of {transactions.filter(t => !t.parentTransactionId).length} transactions
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setBulkEditMode(!bulkEditMode)}
                className={`p-2 rounded-xl transition-colors ${
                  bulkEditMode ? 'bg-primary-500/20 text-primary-400' : 'hover:bg-white/10 text-gray-400'
                }`}
                title="Bulk Edit Mode"
              >
                {bulkEditMode ? <CheckSquare size={18} /> : <Square size={18} />}
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-xl transition-colors relative ${
                  hasActiveFilters ? 'bg-primary-500/20 text-primary-400' : 'hover:bg-white/10 text-gray-400'
                }`}
              >
                <Filter size={18} />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
                )}
              </button>
              
              {selectedTransactions.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="p-2 rounded-xl hover:bg-error-500/20 text-error-400 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 text-center border border-white/10">
              <p className="text-xs text-gray-400 mb-1">Income</p>
              <p className="text-sm sm:text-base font-bold text-success-400">
                +{formatCurrency(filteredTotals.income)}
              </p>
            </div>
            <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 text-center border border-white/10">
              <p className="text-xs text-gray-400 mb-1">Expenses</p>
              <p className="text-sm sm:text-base font-bold text-error-400">
                -{formatCurrency(filteredTotals.expenses)}
              </p>
            </div>
            <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 text-center border border-white/10">
              <p className="text-xs text-gray-400 mb-1">Net</p>
              <p className={`text-sm sm:text-base font-bold ${
                filteredTotals.net >= 0 ? 'text-success-400' : 'text-error-400'
              }`}>
                {isLoading ? 'Loading...' : `${filteredTransactions.length} of ${totalCount} transactions`}
              </p>
            </div>
          </div>
        </div>
      </CollapsibleHeader>

      {/* Main Content with top padding to account for fixed header */}
      <div className="pt-40 sm:pt-44 px-4 py-4 space-y-4">
        {/* Filters */}
        {showFilters && (
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-error-400 hover:text-error-300"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search description or category..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm"
              />
            </div>

            {/* Type and Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="all">All</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                  className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                  className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </div>

            {/* Amount Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Min Amount</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={filters.amountRange.min}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    amountRange: { ...prev.amountRange, min: e.target.value }
                  }))}
                  className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Max Amount</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="No limit"
                  value={filters.amountRange.max}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    amountRange: { ...prev.amountRange, max: e.target.value }
                  }))}
                  className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedTransactions.size > 0 && (
          <div className="bg-primary-500/20 backdrop-blur-md rounded-xl p-4 border border-primary-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-primary-400 text-sm font-medium">
                {selectedTransactions.size} transaction{selectedTransactions.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={selectAllVisible}
                  className="text-xs text-primary-400 hover:text-primary-300"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="text-xs text-gray-400 hover:text-gray-300"
                >
                  Clear
                </button>
              </div>
            </div>
            
            {/* Bulk Edit Options */}
            <div className="flex flex-wrap gap-2">
              <select
                onChange={(e) => e.target.value && handleBulkCategoryUpdate(e.target.value)}
                className="bg-black/20 border border-white/20 rounded-lg px-3 py-1 text-white text-sm"
                defaultValue=""
              >
                <option value="">Change Category...</option>
                {userCategories
                  .filter(c => c.type === 'expense')
                  .map(category => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))
                }
              </select>
              
              <Button
                onClick={handleBulkDelete}
                size="sm"
                className="bg-error-500 hover:bg-error-600"
              >
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Transaction Groups */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading transactions...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-error-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-error-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Error Loading Transactions</h3>
            <p className="text-gray-400 mb-4">Failed to load transaction data</p>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        ) : groupedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No transactions found</h3>
            <p className="text-gray-400 mb-4">
              {hasActiveFilters ? 'Try adjusting your filters' : 'Start by adding your first transaction'}
            </p>
            {hasActiveFilters && (
              <Button onClick={resetFilters} variant="outline" size="sm">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (

          <div className="space-y-4">
            {groupedTransactions.map(({ date, transactions: dayTransactions }) => {
              const dayTotals = getDayTotals(dayTransactions);
              const dateObj = parseISO(date);
              
              return (
                <div key={date} className="bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
                  {/* Date Header */}
                  <div className="bg-black/30 px-4 py-3 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">
                          {format(dateObj, 'EEEE, MMMM d, yyyy')}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {dayTransactions.length} transaction{dayTransactions.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-3 text-sm">
                          {dayTotals.income > 0 && (
                            <span className="text-success-400">+{formatCurrency(dayTotals.income)}</span>
                          )}
                          {dayTotals.expenses > 0 && (
                            <span className="text-error-400">-{formatCurrency(dayTotals.expenses)}</span>
                          )}
                        </div>
                        <p className={`text-xs font-medium ${
                          dayTotals.net >= 0 ? 'text-success-400' : 'text-error-400'
                        }`}>
                          Net: {dayTotals.net >= 0 ? '+' : ''}{formatCurrency(dayTotals.net)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Transactions */}
                  <div className="divide-y divide-white/10">
                    {dayTransactions.map((transaction) => {
                      // Check if this is a split transaction
                      const splitTransactions = getSplitTransactions(transaction.id);
                      const isSplitTransaction = splitTransactions.length > 0;
                      const isExpanded = expandedTransactions.has(transaction.id);
                      
                      return (
                        <React.Fragment key={transaction.id}>
                          <div
                            className={`p-4 hover:bg-white/5 transition-colors ${
                              selectedTransactions.has(transaction.id) ? 'bg-primary-500/10' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              {/* Selection Checkbox - Only show in bulk edit mode */}
                              {bulkEditMode && (
                                <button
                                  onClick={() => toggleTransactionSelection(transaction.id)}
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                    selectedTransactions.has(transaction.id)
                                      ? 'bg-primary-500 border-primary-500'
                                      : 'border-gray-400 hover:border-gray-300'
                                  }`}
                                >
                                  {selectedTransactions.has(transaction.id) && (
                                    <div className="w-2 h-2 bg-white rounded-sm"></div>
                                  )}
                                </button>
                              )}

                              {/* Transaction Icon */}
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                transaction.type === 'income' 
                                  ? 'bg-success-500/20' 
                                  : transaction.category === 'Split Transaction'
                                  ? 'bg-blue-500/20'
                                  : 'bg-error-500/20'
                              }`}>
                                {transaction.category === 'Split Transaction' ? (
                                  <Scissors size={18} className="text-blue-400" />
                                ) : transaction.type === 'income' ? (
                                  <TrendingUp size={18} className="text-success-400" />
                                ) : (
                                  <TrendingDown size={18} className="text-error-400" />
                                )}
                              </div>

                              {/* Transaction Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white truncate">
                                      {transaction.description}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-300">
                                        {transaction.category}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {format(transaction.date, 'h:mm a')}
                                      </span>
                                      {transaction.recurringTransactionId && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                                          Auto
                                        </span>
                                      )}
                                      {isSplitTransaction && (
                                        <button
                                          onClick={() => toggleTransactionExpanded(transaction.id)}
                                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300"
                                        >
                                          {isExpanded ? <EyeOff size={10} className="mr-1" /> : <Eye size={10} className="mr-1" />}
                                          Split ({splitTransactions.length})
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-3 ml-3">
                                    <div className="text-right">
                                      <p className={`font-semibold ${
                                        transaction.type === 'income' 
                                          ? 'text-success-400' 
                                          : 'text-error-400'
                                      }`}>
                                        {transaction.type === 'income' ? '+' : '-'}
                                        {formatCurrency(transaction.amount)}
                                      </p>
                                    </div>
                                    
                                    {/* Action Buttons - Hide in bulk edit mode */}
                                    {!bulkEditMode && transaction.category !== 'Split Transaction' && (
                                      <div className="flex items-center space-x-1">
                                        <button
                                          onClick={() => handleEditTransaction(transaction)}
                                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                          title="Edit"
                                        >
                                          <Edit3 size={14} className="text-gray-400" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteTransaction(transaction.id)}
                                          className="p-1.5 hover:bg-error-500/20 rounded-lg transition-colors"
                                          title="Delete"
                                        >
                                          <Trash2 size={14} className="text-error-400" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Split Transaction Details */}
                          {isSplitTransaction && isExpanded && (
                            <div className="bg-black/30 px-4 py-3 border-t border-white/10">
                              <p className="text-xs font-medium text-gray-400 mb-2">Split Details:</p>
                              <div className="space-y-2 pl-12">
                                {splitTransactions.map((split, index) => (
                                  <div key={split.id} className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500">{index + 1}.</span>
                                      <span className="text-sm text-white">{split.description}</span>
                                      <span className="text-xs text-gray-400">({split.category})</span>
                                    </div>
                                    <span className="text-sm font-medium text-error-400">
                                      -{formatCurrency(split.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {!hasActiveFilters && totalCount > pageSize && (
            <div className="flex items-center justify-between mt-6 p-4 bg-black/20 backdrop-blur-md rounded-xl border border-white/10">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={!hasPreviousPage || isLoading}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-400">
                  Page {page + 1} of {Math.ceil(totalCount / pageSize)}
                </span>
                <Button
                  onClick={() => setPage(page + 1)}
                  disabled={!hasNextPage || isLoading}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
              
              <div className="text-xs text-gray-500">
                Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
              </div>
            </div>
          )}
        )}

      {/* Edit Transaction Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTransaction(null);
        }}
        title="Edit Transaction"
      >
        {editingTransaction && (
          <TransactionForm
            onSubmit={handleUpdateTransaction}
            onCancel={() => {
              setShowEditModal(false);
              setEditingTransaction(null);
            }}
            initialType={editingTransaction.type}
            initialData={editingTransaction}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setTransactionToDelete(null);
        }}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete this transaction? This action cannot be undone.
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
              onClick={confirmDelete}
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