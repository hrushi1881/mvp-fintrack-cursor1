import React, { useState } from 'react';
import { TrendingDown, Calendar, Clock, AlertTriangle, CheckCircle, Target, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface SpendingPattern {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  frequency: number;
  avgAmount: number;
  peakDay: string;
  peakTime: string;
}

interface SpendingPatternAnalysisProps {
  data: SpendingPattern[];
  timeRange: { start: Date; end: Date; label: string };
}

export const SpendingPatternAnalysis: React.FC<SpendingPatternAnalysisProps> = ({
  data,
  timeRange
}) => {
  const { formatCurrency } = useInternationalization();
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'category' | 'time' | 'frequency'>('category');

  // Generate insights based on spending patterns
  const generateInsights = () => {
    const insights = [];
    
    // Find highest spending category
    const topCategory = data[0];
    if (topCategory && topCategory.percentage > 40) {
      insights.push({
        type: 'warning',
        title: `High ${topCategory.category} Spending`,
        description: `${topCategory.category} represents ${topCategory.percentage.toFixed(1)}% of your expenses. Consider if this aligns with your priorities.`,
        action: 'Review and optimize this category'
      });
    }

    // Find categories with upward trends
    const trendingUp = data.filter(d => d.trend === 'up');
    if (trendingUp.length > 0) {
      insights.push({
        type: 'info',
        title: 'Increasing Spending Categories',
        description: `${trendingUp.map(d => d.category).join(', ')} showing upward spending trends.`,
        action: 'Monitor these categories closely'
      });
    }

    // Find frequent small transactions
    const frequentSmall = data.filter(d => d.frequency > 10 && d.avgAmount < 50);
    if (frequentSmall.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Frequent Small Purchases',
        description: `You make frequent small purchases in ${frequentSmall[0].category}. These add up over time.`,
        action: 'Consider setting daily limits for these categories'
      });
    }

    return insights;
  };

  const insights = generateInsights();

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={16} className="text-warning-400" />;
      case 'opportunity': return <Zap size={16} className="text-primary-400" />;
      case 'positive': return <CheckCircle size={16} className="text-success-400" />;
      default: return <Target size={16} className="text-blue-400" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-warning-500/20 border-warning-500/30';
      case 'opportunity': return 'bg-primary-500/20 border-primary-500/30';
      case 'positive': return 'bg-success-500/20 border-success-500/30';
      default: return 'bg-blue-500/20 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <TrendingDown size={20} className="mr-2 text-error-400" />
            Spending Pattern Analysis
          </h3>
          <div className="flex space-x-1 bg-black/20 rounded-lg p-1">
            {['category', 'time', 'frequency'].map((type) => (
              <button
                key={type}
                onClick={() => setViewType(type as any)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  viewType === type 
                    ? 'bg-primary-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <p className="text-gray-400 text-sm">
          Analyzing spending patterns for {timeRange.label}
        </p>
      </div>

      {/* View Type Content */}
      {viewType === 'category' && (
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
          <h4 className="font-medium text-white mb-4">Spending by Category</h4>
          
          <div className="space-y-4">
            {data.map((pattern, index) => (
              <div 
                key={pattern.category}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                  selectedPattern === pattern.category
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
                onClick={() => setSelectedPattern(
                  selectedPattern === pattern.category ? null : pattern.category
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium text-white">{pattern.category}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      pattern.trend === 'up' ? 'bg-error-500/20 text-error-400' :
                      pattern.trend === 'down' ? 'bg-success-500/20 text-success-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {pattern.trend === 'up' ? '↗' : pattern.trend === 'down' ? '↘' : '→'} {pattern.trend}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{formatCurrency(pattern.amount)}</p>
                    <p className="text-xs text-gray-400">{pattern.percentage.toFixed(1)}%</p>
                  </div>
                </div>

                {selectedPattern === pattern.category && (
                  <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Frequency</p>
                      <p className="text-white font-medium">{pattern.frequency} transactions</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Avg Amount</p>
                      <p className="text-white font-medium">{formatCurrency(pattern.avgAmount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Peak Day</p>
                      <p className="text-white font-medium">{pattern.peakDay}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Peak Time</p>
                      <p className="text-white font-medium">{pattern.peakTime}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spending Insights */}
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
        <h4 className="font-medium text-white mb-4 flex items-center">
          <Zap size={18} className="mr-2 text-yellow-400" />
          Spending Insights
        </h4>
        
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
              <div className="flex items-start space-x-3">
                {getInsightIcon(insight.type)}
                <div>
                  <h5 className="font-medium text-white text-sm">{insight.title}</h5>
                  <p className="text-gray-300 text-sm mt-1">{insight.description}</p>
                  <p className="text-xs mt-2 font-medium text-primary-400">
                    💡 {insight.action}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};