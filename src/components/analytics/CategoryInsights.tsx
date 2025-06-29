import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
}

interface CategoryInsightsProps {
  incomeData: CategoryData[];
  expenseData: CategoryData[];
  previousPeriodData?: {
    income: CategoryData[];
    expenses: CategoryData[];
  };
}

export const CategoryInsights: React.FC<CategoryInsightsProps> = ({
  incomeData,
  expenseData,
  previousPeriodData,
}) => {
  const { formatCurrency } = useInternationalization();

  const getInsight = (current: CategoryData[], previous?: CategoryData[], type: 'income' | 'expense') => {
    if (!previous || previous.length === 0) return null;

    const insights = current.map(curr => {
      const prev = previous.find(p => p.category === curr.category);
      if (!prev) return null;

      const change = ((curr.amount - prev.amount) / prev.amount) * 100;
      const isSignificant = Math.abs(change) > 20;

      if (!isSignificant) return null;

      return {
        category: curr.category,
        change,
        amount: curr.amount,
        previousAmount: prev.amount,
        type: change > 0 ? 'increase' : 'decrease'
      };
    }).filter(Boolean);

    return insights;
  };

  const incomeInsights = getInsight(incomeData, previousPeriodData?.income, 'income');
  const expenseInsights = getInsight(expenseData, previousPeriodData?.expenses, 'expense');

  const getInsightIcon = (type: string, category: 'income' | 'expense') => {
    if (category === 'income') {
      return type === 'increase' ? (
        <CheckCircle size={16} className="text-success-500" />
      ) : (
        <AlertTriangle size={16} className="text-warning-500" />
      );
    } else {
      return type === 'increase' ? (
        <AlertTriangle size={16} className="text-error-500" />
      ) : (
        <CheckCircle size={16} className="text-success-500" />
      );
    }
  };

  const getInsightColor = (type: string, category: 'income' | 'expense') => {
    if (category === 'income') {
      return type === 'increase' ? 'text-success-400' : 'text-warning-400';
    } else {
      return type === 'increase' ? 'text-error-400' : 'text-success-400';
    }
  };

  const allInsights = [
    ...(incomeInsights || []).map(i => ({ ...i, category_type: 'income' as const })),
    ...(expenseInsights || []).map(i => ({ ...i, category_type: 'expense' as const }))
  ];

  if (allInsights.length === 0) {
    return (
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Category Insights</h3>
        <div className="text-center py-8">
          <CheckCircle size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No significant changes detected</p>
          <p className="text-sm text-gray-500 mt-2">Your spending patterns are stable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-4">Category Insights</h3>
      <div className="space-y-3">
        {allInsights.slice(0, 5).map((insight, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
            <div className="flex items-center space-x-3">
              {getInsightIcon(insight.type, insight.category_type)}
              <div>
                <p className="font-medium text-white text-sm">{insight.category}</p>
                <p className="text-xs text-gray-400 capitalize">
                  {insight.category_type} • {insight.type}d by {Math.abs(insight.change).toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-semibold text-sm ${getInsightColor(insight.type, insight.category_type)}`}>
                {insight.type === 'increase' ? '+' : '-'}{formatCurrency(Math.abs(insight.amount - insight.previousAmount))}
              </p>
              <p className="text-xs text-gray-500">
                {formatCurrency(insight.amount)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {allInsights.length > 5 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            +{allInsights.length - 5} more insights available
          </p>
        </div>
      )}
    </div>
  );
};