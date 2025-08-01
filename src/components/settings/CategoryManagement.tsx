import React, { useState } from 'react';
import { Tag, Plus, Edit3, Trash2, Check, X, AlertCircle, Info, Minus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useFinance } from '../../contexts/FinanceContext';
import { UserCategory } from '../../types';

interface CategoryFormData {
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

export const CategoryManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { userCategories, addUserCategory, updateUserCategory, deleteUserCategory } = useFinance();
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CategoryFormData>({
    defaultValues: {
      name: '',
      type: 'expense',
      icon: '📊',
      color: '#6B7280'
    }
  });

  const selectedType = watch('type');

  // Default icons and colors
  const defaultIcons = ['💰', '💵', '🏠', '🍔', '🚗', '🎬', '🏥', '🛍️', '📄', '📱', '✈️', '🎓', '🎁', '💼', '📈', '🏦', '🧾', '🔧', '📚', '🎯', '👤', '🎈', '🎇', '🎉', '💍', '🎰', '🎥', '📈', '🥨', '🍛', '🚅', '🚗'];

  const defaultColors = [
    '#EF4444', // red
    '#F97316', // orange
    '#F59E0B', // amber
    '#10B981', // emerald
    '#06B6D4', // cyan
    '#3B82F6', // blue
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#6B7280', // gray
  ];

 const handleAddCategory = async (data: CategoryFormData) => {
  try {
    setError(null);
    await addUserCategory(data);
    setShowAddForm(false);
    reset();
    queryClient.invalidateQueries({ queryKey: ['user-categories'] });
  } catch (error: any) {
    setError(error.message || 'Failed to add category');
  }
};

 // Invalidate related queries
queryClient.invalidateQueries({ queryKey: ['user-categories'] }); 
} catch (error: any) {
  setError(error.message || 'Failed to add category');
}


  const handleUpdateCategory = async (data: CategoryFormData) => {
    if (!editingCategoryId) return;
    
    try {
      setError(null);
      await updateUserCategory(editingCategoryId, data);
      setEditingCategoryId(null);
      reset();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['user-categories'] });
    } catch (error: any) {
      setError(error.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      setError(null);
      await deleteUserCategory(id);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['user-categories'] });
    } catch (error: any) {
      setError(error.message || 'Failed to delete category');
    }
  };

  const startEditing = (category: UserCategory) => {
    setEditingCategoryId(category.id);
    setValue('name', category.name);
    setValue('type', category.type);
    setValue('icon', category.icon || '📊');
    setValue('color', category.color || '#6B7280');
    setShowAddForm(false);
  };

  const cancelEditing = () => {
    setEditingCategoryId(null);
    reset();
  };

  const incomeCategories = userCategories.filter(c => c.type === 'income');
  const expenseCategories = userCategories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Tag size={20} className="mr-2 text-primary-400" />
          Custom Categories
        </h3>
        {!showAddForm && !editingCategoryId && (
          <Button 
            onClick={() => setShowAddForm(true)}
            size="sm"
          >
            <Plus size={16} className="mr-2" />
            Add Category
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error-500/20 border border-error-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle size={18} className="text-error-400" />
            <p className="text-error-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingCategoryId) && (
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <h4 className="font-medium text-white mb-4">
            {editingCategoryId ? 'Edit Category' : 'Add New Category'}
          </h4>
          
          <form onSubmit={handleSubmit(editingCategoryId ? handleUpdateCategory : handleAddCategory)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Category Name"
                {...register('name', { required: 'Name is required' })}
                error={errors.name?.message}
                className="bg-black/40 border-white/20 text-white"
                placeholder="e.g., Groceries"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      value="income"
                      {...register('type', { required: 'Type is required' })}
                      className="sr-only"
                    />
                    <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      selectedType === 'income' 
                        ? 'border-success-500 bg-success-500/20 text-success-400' 
                        : 'border-white/20 hover:border-white/30 text-gray-300'
                    }`}>
                      Income
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      value="expense"
                      {...register('type', { required: 'Type is required' })}
                      className="sr-only"
                    />
                    <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      selectedType === 'expense' 
                        ? 'border-error-500 bg-error-500/20 text-error-400' 
                        : 'border-white/20 hover:border-white/30 text-gray-300'
                    }`}>
                      Expense
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
              <div className="grid grid-cols-5 gap-2">
                {defaultIcons.map((icon) => (
                  <label key={icon} className="cursor-pointer">
                    <input
                      type="radio"
                      value={icon}
                      {...register('icon')}
                      className="sr-only"
                    />
                    <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      watch('icon') === icon
                        ? 'border-primary-500 bg-primary-500/20'
                        : 'border-white/20 hover:border-white/30'
                    }`}>
                      <span className="text-xl">{icon}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
              <div className="grid grid-cols-5 gap-2">
                {defaultColors.map((color) => (
                  <label key={color} className="cursor-pointer">
                    <input
                      type="radio"
                      value={color}
                      {...register('color')}
                      className="sr-only"
                    />
                    <div className={`h-10 rounded-lg border-2 transition-colors ${
                      watch('color') === color
                        ? 'border-white scale-110'
                        : 'border-transparent hover:border-white/50'
                    }`} style={{ backgroundColor: color }}>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-black/20 p-3 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Preview:</p>
              <div className="flex items-center space-x-3 p-2 bg-black/30 rounded-lg">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" 
                  style={{ backgroundColor: watch('color') }}>
                  {watch('icon')}
                </div>
                <span className="font-medium text-white">{watch('name') || 'Category Name'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCategoryId(null);
                  reset();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
              >
                {editingCategoryId ? 'Update' : 'Add'} Category
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-4">
        {/* Income Categories */}
        <div>
          <h4 className="text-sm font-medium text-success-400 mb-2 flex items-center">
            <Plus size={16} className="mr-2" />
            Income Categories ({incomeCategories.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {incomeCategories.map((category) => (
              <div 
                key={category.id}
                className="flex items-center justify-between p-3 bg-black/20 backdrop-blur-md rounded-lg border border-white/10"
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                    style={{ backgroundColor: category.color || '#6B7280' }}
                  >
                    {category.icon || '📊'}
                  </div>
                  <span className="font-medium text-white">{category.name}</span>
                </div>
                
                {editingCategoryId !== category.id && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEditing(category)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit3 size={14} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-1.5 hover:bg-error-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} className="text-error-400" />
                    </button>
                  </div>
                )}
                
                {editingCategoryId === category.id && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSubmit(handleUpdateCategory)()}
                      className="p-1.5 hover:bg-success-500/20 rounded-lg transition-colors"
                    >
                      <Check size={14} className="text-success-400" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="p-1.5 hover:bg-error-500/20 rounded-lg transition-colors"
                    >
                      <X size={14} className="text-error-400" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Expense Categories */}
        <div>
          <h4 className="text-sm font-medium text-error-400 mb-2 flex items-center">
            <Minus size={16} className="mr-2" />
            Expense Categories ({expenseCategories.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {expenseCategories.map((category) => (
              <div 
                key={category.id}
                className="flex items-center justify-between p-3 bg-black/20 backdrop-blur-md rounded-lg border border-white/10"
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                    style={{ backgroundColor: category.color || '#6B7280' }}
                  >
                    {category.icon || '📊'}
                  </div>
                  <span className="font-medium text-white">{category.name}</span>
                </div>
                
                {editingCategoryId !== category.id && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEditing(category)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit3 size={14} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-1.5 hover:bg-error-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} className="text-error-400" />
                    </button>
                  </div>
                )}
                
                {editingCategoryId === category.id && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSubmit(handleUpdateCategory)()}
                      className="p-1.5 hover:bg-success-500/20 rounded-lg transition-colors"
                    >
                      <Check size={14} className="text-success-400" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="p-1.5 hover:bg-error-500/20 rounded-lg transition-colors"
                    >
                      <X size={14} className="text-error-400" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
        <div className="flex items-start space-x-3">
          <Info size={18} className="text-blue-400 mt-0.5" />
          <div>
            <p className="text-blue-400 font-medium mb-1">About Custom Categories</p>
            <p className="text-sm text-blue-300">
              Custom categories help you organize your finances in a way that makes sense for your specific needs. 
              Categories you create here will be available when adding transactions and creating budgets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

