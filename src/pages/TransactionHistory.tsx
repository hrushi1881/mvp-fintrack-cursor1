import React, { useState, useMemo } from 'react';
import { ArrowLeft, Edit3, Trash2, Search, Filter, Calendar, TrendingUp, TrendingDown, Plus, Minus, Eye, EyeOff, CheckSquare, Square } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { PageNavigation } from '../components/layout/PageNavigation';
import { SearchAndFilter } from '../components/common/SearchAndFilter';
import { Modal } from '../components/common/Modal';
import { TransactionForm } from '../components/forms/TransactionForm';
import { Button } from '../components/common/Button';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { Transaction } from '../types';

export const TransactionHistory: React.FC = () => {
  const { transactions, updateTransaction, deleteTransaction } = useFinance();
  const { formatCurrency, currency } = useInternationalization();
  const [searchResults, setSearchResults] = useState(transactions);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });

  // Apply filters and sorting
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = showSearch ? searchResults : transactions;

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Apply date range filter
    filtered = filtered.filter(t => 
      isWithinInterval(t.date, { start: dateRange.start, end: dateRange.end })
    );

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchResults, showSearch, filterType, dateRange, sortBy, sortOrder]);

  // Pagination
  const totalCount = filteredAndSortedTransactions.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedTransactions = filteredAndSortedTransactions.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  const hasActiveFilters = filterType !== 'all' || showSearch;

  const handleEditTransaction = async (data: any) => {
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, {
          ...data,
          date: new Date(data.date),
        });
        setShowEditModal(false);
        setEditingTransaction(null);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTransaction = async () => {
    try {
      if (transactionToDelete) {
        await deleteTransaction(transactionToDelete);
        setTransactionToDelete(null);
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const toggleTransactionSelection = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const selectAllTransactions = () => {
    if (selectedTransactions.length === paginatedTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(paginatedTransactions.map(t => t.id));
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedTransactions.map(id => deleteTransaction(id)));
      setSelectedTransactions([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error deleting transactions:', error);
    }
  };

  // Calculate summary stats for current view
  const summaryStats = useMemo(() => {
    const income = filteredAndSortedTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredAndSortedTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { income, expenses, net: income - expenses };
  }, [filteredAndSortedTransactions]);

  return (
    <div className="min-h-screen text-white pb-20">
      {/* Header with Navigation */}
      <header className="bg-black/20 backdrop-blur-md px-4 py-4 sm:py-6 sticky top-0 z-30 border-b border-white/10">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Transaction History</h1>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-xl transition-colors ${
                showSearch ? 'bg-primary-500 text-white' : 'hover:bg-white/10 text-gray-300'
              }`}
            >
              <Search size={18} />
            </button>
            
            <button 
              onClick={() => setShowBulkActions(!showBulkActions)}
              className={`p-2 rounded-xl transition-colors ${
                showBulkActions ? 'bg-primary-500 text-white' : 'hover:bg-white/10 text-gray-300'
              }`}
            >
              {showBulkActions ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <PageNavigation />
      </header>
      
      <div className="px-4 py-6">
        {/* Search and Filters */}
        {showSearch && (
          <div className="mb-6">
            <SearchAndFilter
              onResults={setSearchResults}
              placeholder="Search transactions..."
            />
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
            className="bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="all">All Types</option>
            <option value="income">Income Only</option>
            <option value="expense">Expenses Only</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'category')}
            className="bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="category">Sort by Category</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm hover:bg-white/10"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 text-center border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Income</p>
            <p className="text-lg font-bold text-success-400">
              +{formatCurrency(summaryStats.income)}
            </p>
          </div>
          
          <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 text-center border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Expenses</p>
            <p className="text-lg font-bold text-error-400">
              -{formatCurrency(summaryStats.expenses)}
            </p>
          </div>
          
          <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 text-center border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Net</p>
            <p className={`text-lg font-bold ${
              summaryStats.net >= 0 ? 'text-success-400' : 'text-error-400'
            }`}>
              {summaryStats.net >= 0 ? '+' : ''}{formatCurrency(summaryStats.net)}
            </p>
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={selectAllTransactions}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {selectedTransactions.length === paginatedTransactions.length ? (
                    <CheckSquare size={18} className="text-primary-400" />
                  ) : (
                    <Square size={18} className="text-gray-400" />
                  )}
                </button>
                <span className="text-sm text-gray-300">
                  {selectedTransactions.length} selected
                </span>
              </div>
              
              {selectedTransactions.length > 0 && (
                <Button
                  onClick={handleBulkDelete}
                  size="sm"
                  className="bg-error-500 hover:bg-error-600"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete Selected
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Transaction List */}
        {paginatedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No transactions found</h3>
            <p className="text-gray-400">
              {hasActiveFilters ? 'Try adjusting your filters' : 'Start by adding your first transaction'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`flex items-center justify-between p-4 bg-black/20 backdrop-blur-md rounded-xl hover:bg-black/30 transition-colors border border-white/10 ${
                  selectedTransactions.includes(transaction.id) ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                {showBulkActions && (
                  <button
                    onClick={() => toggleTransactionSelection(transaction.id)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors mr-3"
                  >
                    {selectedTransactions.includes(transaction.id) ? (
                      <CheckSquare size={18} className="text-primary-400" />
                    ) : (
                      <Square size={18} className="text-gray-400" />
                    )}
                  </button>
                )}
                
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`p-2 rounded-lg ${
                    transaction.type === 'income' 
                      ? 'bg-success-500/20' 
                      : 'bg-error-500/20'
                  }`}>
                    {transaction.type === 'income' ? (
                      <TrendingUp size={16} className="text-success-400" />
                    ) : (
                      <TrendingDown size={16} className="text-error-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-gray-400">
                      {transaction.category} • {format(transaction.date, 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'income' 
                        ? 'text-success-400' 
                        : 'text-error-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(transaction.date, 'h:mm a')}
                    </p>
                  </div>
                  
                  {!showBulkActions && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingTransaction(transaction);
                          setShowEditModal(true);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Edit3 size={14} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="p-2 hover:bg-error-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} className="text-error-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!hasActiveFilters && totalCount > pageSize && (
          <div className="flex items-center justify-between mt-6 p-4 bg-black/20 backdrop-blur-md rounded-xl border border-white/10">
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                size="sm"
                variant="outline"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-300">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                size="sm"
                variant="outline"
              >
                Next
              </Button>
            </div>
            
            <div className="text-sm text-gray-400">
              Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalCount)} of {totalCount}
            </div>
          </div>
        )}
      </div>

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
            initialData={editingTransaction}
            onSubmit={handleEditTransaction}
            onCancel={() => {
              setShowEditModal(false);
              setEditingTransaction(null);
            }}
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
              onClick={confirmDeleteTransaction}
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