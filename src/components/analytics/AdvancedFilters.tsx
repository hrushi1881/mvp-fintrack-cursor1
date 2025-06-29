import React, { useState } from 'react';
import { Filter, Calendar, Tag, DollarSign, X } from 'lucide-react';
import { Button } from '../common/Button';

interface FilterOptions {
  dateRange: {
    start: string;
    end: string;
  };
  categories: string[];
  amountRange: {
    min: number;
    max: number;
  };
  transactionType: 'all' | 'income' | 'expense';
}

interface AdvancedFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableCategories: string[];
  isOpen: boolean;
  onToggle: () => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  availableCategories,
  isOpen,
  onToggle,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onToggle();
  };

  const handleResetFilters = () => {
    const resetFilters: FilterOptions = {
      dateRange: { start: '', end: '' },
      categories: [],
      amountRange: { min: 0, max: 0 },
      transactionType: 'all',
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const toggleCategory = (category: string) => {
    const newCategories = localFilters.categories.includes(category)
      ? localFilters.categories.filter(c => c !== category)
      : [...localFilters.categories, category];
    
    setLocalFilters(prev => ({
      ...prev,
      categories: newCategories
    }));
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        size="sm"
        className="flex items-center space-x-2"
      >
        <Filter size={16} />
        <span>Filters</span>
        {(filters.categories.length > 0 || filters.dateRange.start || filters.transactionType !== 'all') && (
          <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {filters.categories.length + (filters.dateRange.start ? 1 : 0) + (filters.transactionType !== 'all' ? 1 : 0)}
          </span>
        )}
      </Button>
    );
  }

  return (
    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Filter size={20} className="mr-2" />
          Advanced Filters
        </h3>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          <Calendar size={16} className="inline mr-2" />
          Date Range
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={localFilters.dateRange.start}
            onChange={(e) => setLocalFilters(prev => ({
              ...prev,
              dateRange: { ...prev.dateRange, start: e.target.value }
            }))}
            className="bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
          />
          <input
            type="date"
            value={localFilters.dateRange.end}
            onChange={(e) => setLocalFilters(prev => ({
              ...prev,
              dateRange: { ...prev.dateRange, end: e.target.value }
            }))}
            className="bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>
      </div>

      {/* Transaction Type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Transaction Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['all', 'income', 'expense'].map((type) => (
            <button
              key={type}
              onClick={() => setLocalFilters(prev => ({
                ...prev,
                transactionType: type as FilterOptions['transactionType']
              }))}
              className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                localFilters.transactionType === type
                  ? 'bg-primary-500 text-white'
                  : 'bg-black/20 text-gray-300 hover:bg-white/10'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          <Tag size={16} className="inline mr-2" />
          Categories
        </label>
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
          {availableCategories.map((category) => (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={`p-2 rounded-lg text-sm text-left transition-colors ${
                localFilters.categories.includes(category)
                  ? 'bg-primary-500 text-white'
                  : 'bg-black/20 text-gray-300 hover:bg-white/10'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Amount Range */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          <DollarSign size={16} className="inline mr-2" />
          Amount Range
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Min amount"
            value={localFilters.amountRange.min || ''}
            onChange={(e) => setLocalFilters(prev => ({
              ...prev,
              amountRange: { ...prev.amountRange, min: Number(e.target.value) || 0 }
            }))}
            className="bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
          />
          <input
            type="number"
            placeholder="Max amount"
            value={localFilters.amountRange.max || ''}
            onChange={(e) => setLocalFilters(prev => ({
              ...prev,
              amountRange: { ...prev.amountRange, max: Number(e.target.value) || 0 }
            }))}
            className="bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-3 pt-4">
        <Button
          onClick={handleResetFilters}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Reset
        </Button>
        <Button
          onClick={handleApplyFilters}
          size="sm"
          className="flex-1"
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
};