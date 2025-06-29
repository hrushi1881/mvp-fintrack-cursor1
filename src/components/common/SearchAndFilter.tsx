import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, Tag, DollarSign } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';

interface SearchAndFilterProps {
  onResults: (results: any[]) => void;
  placeholder?: string;
  showFilters?: boolean;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  onResults,
  placeholder = "Search transactions...",
  showFilters = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: { start: '', end: '' },
    category: '',
    minAmount: '',
    maxAmount: '',
    type: 'all' as 'all' | 'income' | 'expense',
  });

  const { searchTransactions, transactions } = useFinance();

  useEffect(() => {
    let results = searchTransactions(searchQuery);

    // Apply additional filters
    if (filters.dateRange.start) {
      results = results.filter(t => t.date >= new Date(filters.dateRange.start));
    }
    if (filters.dateRange.end) {
      results = results.filter(t => t.date <= new Date(filters.dateRange.end));
    }
    if (filters.category) {
      results = results.filter(t => t.category.toLowerCase().includes(filters.category.toLowerCase()));
    }
    if (filters.minAmount) {
      results = results.filter(t => t.amount >= Number(filters.minAmount));
    }
    if (filters.maxAmount) {
      results = results.filter(t => t.amount <= Number(filters.maxAmount));
    }
    if (filters.type !== 'all') {
      results = results.filter(t => t.type === filters.type);
    }

    onResults(results);
  }, [searchQuery, filters, searchTransactions, onResults]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      dateRange: { start: '', end: '' },
      category: '',
      minAmount: '',
      maxAmount: '',
      type: 'all',
    });
    setShowAdvancedFilters(false);
  };

  const hasActiveFilters = searchQuery || 
    filters.dateRange.start || 
    filters.dateRange.end || 
    filters.category || 
    filters.minAmount || 
    filters.maxAmount || 
    filters.type !== 'all';

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-12 py-3 bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500"
        />
        {showFilters && (
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
              hasActiveFilters ? 'text-primary-400' : 'text-gray-400'
            } hover:text-primary-300`}
          >
            <Filter size={18} />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
            )}
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Advanced Filters</h3>
            <button
              onClick={() => setShowAdvancedFilters(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                <Calendar size={12} className="inline mr-1" />
                From
              </label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="w-full bg-black/20 border border-white/20 rounded-lg px-2 py-1 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                To
              </label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="w-full bg-black/20 border border-white/20 rounded-lg px-2 py-1 text-white text-sm"
              />
            </div>
          </div>

          {/* Category and Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                <Tag size={12} className="inline mr-1" />
                Category
              </label>
              <input
                type="text"
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Food"
                className="w-full bg-black/20 border border-white/20 rounded-lg px-2 py-1 text-white text-sm placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full bg-black/20 border border-white/20 rounded-lg px-2 py-1 text-white text-sm"
              >
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
          </div>

          {/* Amount Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                <DollarSign size={12} className="inline mr-1" />
                Min Amount
              </label>
              <input
                type="number"
                value={filters.minAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                placeholder="0"
                className="w-full bg-black/20 border border-white/20 rounded-lg px-2 py-1 text-white text-sm placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Max Amount
              </label>
              <input
                type="number"
                value={filters.maxAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                placeholder="No limit"
                className="w-full bg-black/20 border border-white/20 rounded-lg px-2 py-1 text-white text-sm placeholder-gray-500"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full py-2 text-sm text-error-400 hover:text-error-300 font-medium"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};