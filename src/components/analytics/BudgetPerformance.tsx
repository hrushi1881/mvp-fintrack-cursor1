import React from 'react';
import { PieChart, Calculator, TrendingUp, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface BudgetPerformanceData {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  utilization: number;
  status: 'under' | 'on_track' | 'over' | 'warning';
  trend: 'improving' | 'stable' | 'concerning';
}

interface BudgetPerformanceProps {
  data: BudgetPerformanceData[];
  timeRange: { start: Date; end: Date; label: string };
}

export const BudgetPerformance: React.FC<BudgetPerformanceProps> = ({
  data,
  timeRange
}) => {
  const { formatCurrency } = useInternationalizationContext();

  const totalBudgeted = data.reduce((sum, item) => sum + item.budgeted, 0);
  const totalSpent = data.reduce((sum, item) => sum + item.spent, 0);
  const overallUtilization = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'under': return 'text-success-400 bg-success-500/20';
      case 'on_track': return 'text-primary-400 bg-primary-500/20';
      case 'warning': return 'text-warning-400 bg-warning-500/20';
      case 'over': return 'text-error-400 bg-error-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'under': return <CheckCircle size={16} className="text-success-400" />;
      case 'on_track': return <Target size={16} className="text-primary-400" />;
      case 'warning': return <AlertTriangle size={16} className="text-warning-400" />;
      case 'over': return <AlertTriangle size={16} className="text-error-400" />;
      default: return <Calculator size={16} className="text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'under': return 'Under Budget';
      case 'on_track': return 'On Track';
      case 'warning': return 'Approaching Limit';
      case 'over': return 'Over Budget';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Calculator size={20} className="mr-2 text-primary-400" />
          Budget Performance - {timeRange.label}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-black/30 rounded-xl p-4 text-center">
            <Calculator size={20} className="mx-auto text-primary-400 mb-2" />
            <p className="text-xs text-gray-400 mb-1">Total Budgeted</p>
            <p className="text-xl font-bold text-white">{formatCurrency(totalBudgeted)}</p>
          </div>

          <div className="bg-black/30 rounded-xl p-4 text-center">
            <TrendingUp size={20} className="mx-auto text-warning-400 mb-2" />
            <p className="text-xs text-gray-400 mb-1">Total Spent</p>
            <p className="text-xl font-bold text-white">{formatCurrency(totalSpent)}</p>
          </div>

          <div className="bg-black/30 rounded-xl p-4 text-center">
            <PieChart size={20} className={`mx-auto mb-2 ${
              overallUtilization >= 100 ? 'text-error-400' :
              overallUtilization >= 80 ? 'text-warning-400' : 'text-success-400'
            }`} />
            <p className="text-xs text-gray-400 mb-1">Overall Usage</p>
            <p className={`text-xl font-bold ${
              overallUtilization >= 100 ? 'text-error-400' :
              overallUtilization >= 80 ? 'text-warning-400' : 'text-success-400'
            }`}>
              {overallUtilization.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Budget Performance Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="category" 
              stroke="#9CA3AF" 
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="#9CA3AF" 
              fontSize={12}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip 
              formatter={(value, name) => [
                formatCurrency(value as number), 
                name === 'budgeted' ? 'Budgeted' : 'Spent'
              ]}
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#F9FAFB',
                backdropFilter: 'blur(10px)'
              }}
            />
            <Bar dataKey="budgeted" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="spent" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Budget Categories Breakdown */}
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
        <h4 className="font-medium text-white mb-4">Budget Categories Performance</h4>
        
        <div className="space-y-4">
          {data.map((budget) => (
            <div key={budget.category} className="p-4 bg-black/30 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-white">{budget.category}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(budget.status)}`}>
                    {getStatusLabel(budget.status)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.budgeted)}
                  </p>
                  <p className="text-xs text-gray-400">{budget.utilization.toFixed(1)}% used</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    budget.status === 'over' ? 'bg-error-500' :
                    budget.status === 'warning' ? 'bg-warning-500' :
                    budget.status === 'on_track' ? 'bg-primary-500' : 'bg-success-500'
                  }`}
                  style={{ width: `${Math.min(budget.utilization, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(budget.status)}
                  <span className="text-gray-400">
                    {budget.remaining >= 0 ? 'Remaining' : 'Over by'}: {formatCurrency(Math.abs(budget.remaining))}
                  </span>
                </div>
                <span className={`text-xs ${
                  budget.trend === 'improving' ? 'text-success-400' :
                  budget.trend === 'concerning' ? 'text-error-400' : 'text-gray-400'
                }`}>
                  {budget.trend === 'improving' ? '📈 Improving' :
                   budget.trend === 'concerning' ? '📉 Concerning' : '➡️ Stable'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Insights */}
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
        <h4 className="font-medium text-white mb-4">Budget Insights</h4>
        
        <div className="space-y-3">
          {overallUtilization < 70 && (
            <div className="p-4 bg-success-500/20 rounded-lg border border-success-500/30">
              <div className="flex items-start space-x-3">
                <CheckCircle size={16} className="text-success-400 mt-0.5" />
                <div>
                  <h5 className="font-medium text-success-400 text-sm">Great Budget Control</h5>
                  <p className="text-success-300 text-sm mt-1">
                    You're using only {overallUtilization.toFixed(1)}% of your budget. This gives you flexibility for savings or unexpected expenses.
                  </p>
                </div>
              </div>
            </div>
          )}

          {overallUtilization >= 90 && (
            <div className="p-4 bg-error-500/20 rounded-lg border border-error-500/30">
              <div className="flex items-start space-x-3">
                <AlertTriangle size={16} className="text-error-400 mt-0.5" />
                <div>
                  <h5 className="font-medium text-error-400 text-sm">Budget Strain</h5>
                  <p className="text-error-300 text-sm mt-1">
                    You're using {overallUtilization.toFixed(1)}% of your budget. Consider reviewing your spending or adjusting budget allocations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {data.filter(d => d.status === 'over').length > 0 && (
            <div className="p-4 bg-warning-500/20 rounded-lg border border-warning-500/30">
              <div className="flex items-start space-x-3">
                <AlertTriangle size={16} className="text-warning-400 mt-0.5" />
                <div>
                  <h5 className="font-medium text-warning-400 text-sm">Categories Over Budget</h5>
                  <p className="text-warning-300 text-sm mt-1">
                    {data.filter(d => d.status === 'over').map(d => d.category).join(', ')} exceeded their budgets. 
                    Review these categories for optimization opportunities.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};