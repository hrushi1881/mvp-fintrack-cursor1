import React, { useState } from 'react';
import { Plus, Edit3, Trash2, TrendingUp, Briefcase, DollarSign, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { IncomeSourceForm } from '../forms/IncomeSourceForm';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface IncomeSource {
  id: string;
  name: string;
  type: 'salary' | 'freelance' | 'business' | 'investment' | 'rental' | 'other';
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  isActive: boolean;
  lastReceived?: Date;
  nextExpected?: Date;
  reliability: 'high' | 'medium' | 'low';
}

export const MultipleIncomeManager: React.FC = () => {
  const { incomeSources, addIncomeSource, updateIncomeSource, deleteIncomeSource } = useFinance();
  const { formatCurrency, currency } = useInternationalization();
  const [showModal, setShowModal] = useState(false);
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSource = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await addIncomeSource(data);
      setShowModal(false);
    } catch (error: any) {
      console.error('Error adding income source:', error);
      setError(error.message || 'Failed to add income source');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSource = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (editingSource) {
        await updateIncomeSource(editingSource.id, data);
        setEditingSource(null);
        setShowModal(false);
      }
    } catch (error: any) {
      console.error('Error updating income source:', error);
      setError(error.message || 'Failed to update income source');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSource = (sourceId: string) => {
    setSourceToDelete(sourceId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSource = async () => {
    try {
      setIsSubmitting(true);
      
      if (sourceToDelete) {
        await deleteIncomeSource(sourceToDelete);
        setSourceToDelete(null);
        setShowDeleteConfirm(false);
      }
    } catch (error: any) {
      console.error('Error deleting income source:', error);
      setError(error.message || 'Failed to delete income source');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      salary: Briefcase,
      freelance: TrendingUp,
      business: DollarSign,
      investment: TrendingUp,
      rental: DollarSign,
      other: DollarSign
    };
    return icons[type as keyof typeof icons] || DollarSign;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      salary: 'bg-blue-500',
      freelance: 'bg-purple-500',
      business: 'bg-green-500',
      investment: 'bg-yellow-500',
      rental: 'bg-orange-500',
      other: 'bg-gray-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case 'high': return 'text-success-400 bg-success-500/20';
      case 'medium': return 'text-warning-400 bg-warning-500/20';
      case 'low': return 'text-error-400 bg-error-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const totalMonthlyIncome = incomeSources.reduce((sum, source) => {
    if (!source.isActive) return sum;
    
    let monthlyAmount = source.amount;
    switch (source.frequency) {
      case 'weekly':
        monthlyAmount = source.amount * 4.33;
        break;
      case 'yearly':
        monthlyAmount = source.amount / 12;
        break;
    }
    return sum + monthlyAmount;
  }, 0);

  const activeSources = incomeSources.filter(s => s.isActive);
  const inactiveSources = incomeSources.filter(s => !s.isActive);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center">
            <TrendingUp size={20} className="mr-2 text-success-400" />
            Income Sources
          </h3>
          <p className="text-sm text-gray-400">
            Total Monthly: {formatCurrency(totalMonthlyIncome)} from {activeSources.length} source{activeSources.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          size="sm"
          className="flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Add Source</span>
        </Button>
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

      {/* Active Income Sources */}
      {activeSources.length > 0 ? (
        <div className="space-y-3">
          {activeSources.map((source) => {
            const TypeIcon = getTypeIcon(source.type);
            
            return (
              <div key={source.id} className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg ${getTypeColor(source.type)} flex items-center justify-center`}>
                      <TypeIcon size={20} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{source.name}</h4>
                      <p className="text-xs text-gray-400 capitalize">{source.type} • {source.frequency}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${getReliabilityColor(source.reliability)}`}>
                      {source.reliability}
                    </span>
                    <button
                      onClick={() => {
                        setEditingSource(source);
                        setShowModal(true);
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit3 size={14} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteSource(source.id)}
                      className="p-2 hover:bg-error-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} className="text-error-400" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Amount</p>
                    <p className="font-semibold text-success-400">
                      <CurrencyIcon currencyCode={currency.code} size={14} className="inline mr-1" />
                      {source.amount.toLocaleString()}/{source.frequency}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Monthly Equivalent</p>
                    <p className="font-semibold text-white">
                      <CurrencyIcon currencyCode={currency.code} size={14} className="inline mr-1" />
                      {(source.frequency === 'weekly' ? source.amount * 4.33 :
                        source.frequency === 'yearly' ? source.amount / 12 :
                        source.amount).toLocaleString()}
                    </p>
                  </div>
                </div>

                {source.nextExpected && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <Calendar size={12} />
                      <span>Next expected: {format(source.nextExpected, 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 bg-black/20 backdrop-blur-md rounded-xl border border-white/10">
          <TrendingUp size={48} className="mx-auto text-gray-600 mb-4" />
          <h4 className="text-lg font-semibold text-white mb-2">No Income Sources</h4>
          <p className="text-gray-400 mb-4">Add your income sources to track your earnings</p>
          <Button onClick={() => setShowModal(true)}>
            <Plus size={18} className="mr-2" />
            Add First Income Source
          </Button>
        </div>
      )}

      {/* Inactive Sources */}
      {inactiveSources.length > 0 && (
        <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
          <h4 className="font-medium text-white mb-3 text-sm">Inactive Sources ({inactiveSources.length})</h4>
          <div className="space-y-2">
            {inactiveSources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg opacity-60">
                <span className="text-gray-400 text-sm">{source.name}</span>
                <span className="text-gray-500 text-xs">{formatCurrency(source.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingSource(null);
          setError(null);
        }}
        title={editingSource ? 'Edit Income Source' : 'Add Income Source'}
      >
        <IncomeSourceForm
          initialData={editingSource}
          onSubmit={editingSource ? handleEditSource : handleAddSource}
          onCancel={() => {
            setShowModal(false);
            setEditingSource(null);
            setError(null);
          }}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSourceToDelete(null);
        }}
        title="Delete Income Source"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete this income source? This action cannot be undone.
          </p>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setSourceToDelete(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteSource}
              className="flex-1 bg-error-500 hover:bg-error-600"
              loading={isSubmitting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};