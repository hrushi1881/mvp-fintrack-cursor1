import React, { useState } from 'react';
import { Tag, Plus, Edit3, Trash2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useFinance } from '../../contexts/FinanceContext';
import { UserCategory } from '../../types';

interface CategoryFormData {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

export const CategoryManagement: React.FC = () => {
  const { userCategories, addUserCategory, updateUserCategory, deleteUserCategory } = useFinance();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<UserCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CategoryFormData>({
    defaultValues: {
      type: 'expense'
    }
  });

  const selectedType = watch('type');

  const handleAddCategory = async (data: CategoryFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      console.log('🔄 Adding user category:', data);
      
      await addUserCategory(data);
      console.log('✅ Category added successfully');
      
      setShowAddForm(false);
      reset();
      setSuccess('Category added successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('❌ Error adding category:', error);
      setError(error.message || 'Failed to add category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCategory = async (data: CategoryFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (editingCategory) {
        console.log('🔄 Updating user category:', editingCategory.id, data);
        await updateUserCategory(editingCategory.id, data);
        console.log('✅ Category updated successfully');
        
        setEditingCategory(null);
        setShowAddForm(false);
        reset();
        setSuccess('Category updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error: any) {
      console.error('❌ Error updating category:', error);
      setError(error.message || 'Failed to update category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      setIsSubmitting(true);
      setError(null);
      console.log('🔄 Deleting user category:', categoryId);
      
      await deleteUserCategory(categoryId);
      console.log('✅ Category deleted successfully');
      
      setSuccess('Category deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('❌ Error deleting category:', error);
      setError(error.message || 'Failed to delete category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = (category: UserCategory) => {
    setEditingCategory(category);
    setShowAddForm(true);
    reset({
      name: category.name,
      type: category.type,
      icon: category.icon || '',
      color: category.color || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setShowAddForm(false);
    reset();
    setError(null);
  };

  const incomeCategories = userCategories.filter(c => c.type === 'income');
  const expenseCategories = userCategories.filter(c => c.type === 'expense');

  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#06B6D4'
  ];

  const iconOptions = [
    '💰', '🏠', '🍔', '🚗', '🎬', '🛍️', '💊', '📚', 
    '✈️', '🎯', '💳', '📱', '⚡', '🎵', '🏋️', '🎨'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Manage Categories</h3>
          <p className="text-sm text-gray-400">Customize transaction categories for better organization</p>
        </div>
        
        <Button
          onClick={() => setShowAddForm(true)}
          size="sm"
          className="flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Add Category</span>
        </Button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-success-500/20 border border-success-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle size={18} className="text-success-400" />
            <p className="text-success-400 text-sm">{success}</p>
          </div>
        </div>
      )}

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
      {showAddForm && (
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h4 className="text-lg font-semibold text-white mb-4">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h4>
          
          <form onSubmit={handleSubmit(editingCategory ? handleUpdateCategory : handleAddCategory)} className="space-y-4">
            <Input
              label="Category Name"
              type="text"
              placeholder="e.g., Groceries, Freelance Work"
              {...register('name', { 
                required: 'Category name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' }
              })}
              error={errors.name?.message}
              className="bg-black/40 border-white/20 text-white"
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

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Icon (Optional)</label>
              <div className="grid grid-cols-8 gap-2">
                {iconOptions.map((icon) => (
                  <label key={icon} className="cursor-pointer">
                    <input
                      type="radio"
                      value={icon}
                      {...register('icon')}
                      className="sr-only"
                    />
                    <div className={`p-2 rounded-lg border-2 text-center transition-colors ${
                      watch('icon') === icon 
                        ? 'border-primary-500 bg-primary-500/20' 
                        : 'border-white/20 hover:border-white/30'
                    }`}>
                      <span className="text-lg">{icon}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Color (Optional)</label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((color) => (
                  <label key={color} className="cursor-pointer">
                    <input
                      type="radio"
                      value={color}
                      {...register('color')}
                      className="sr-only"
                    />
                    <div className={`w-8 h-8 rounded-lg border-2 transition-colors ${
                      watch('color') === color 
                        ? 'border-white scale-110' 
                        : 'border-white/20 hover:border-white/50'
                    }`} style={{ backgroundColor: color }}>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                loading={isSubmitting}
              >
                {editingCategory ? 'Update' : 'Add'} Category
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-6">
        {/* Income Categories */}
        <div>
          <h4 className="text-md font-semibold text-white mb-3 flex items-center">
            <TrendingUp size={18} className="mr-2 text-success-400" />
            Income Categories ({incomeCategories.length})
          </h4>
          
          {incomeCategories.length === 0 ? (
            <p className="text-gray-400 text-sm">No custom income categories yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {incomeCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/10">
                  <div className="flex items-center space-x-3">
                    {category.icon && <span className="text-lg">{category.icon}</span>}
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color || '#10B981' }}
                    />
                    <span className="font-medium text-white">{category.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <Edit3 size={14} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-1 hover:bg-error-500/20 rounded transition-colors"
                      disabled={isSubmitting}
                    >
                      <Trash2 size={14} className="text-error-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expense Categories */}
        <div>
          <h4 className="text-md font-semibold text-white mb-3 flex items-center">
            <TrendingDown size={18} className="mr-2 text-error-400" />
            Expense Categories ({expenseCategories.length})
          </h4>
          
          {expenseCategories.length === 0 ? (
            <p className="text-gray-400 text-sm">No custom expense categories yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {expenseCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/10">
                  <div className="flex items-center space-x-3">
                    {category.icon && <span className="text-lg">{category.icon}</span>}
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color || '#EF4444' }}
                    />
                    <span className="font-medium text-white">{category.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <Edit3 size={14} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-1 hover:bg-error-500/20 rounded transition-colors"
                      disabled={isSubmitting}
                    >
                      <Trash2 size={14} className="text-error-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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