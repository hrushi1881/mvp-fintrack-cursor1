import React from 'react';
import { TrendingUp, DollarSign, Calendar, Briefcase, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface IncomeSource {
  source: string;
  amount: number;
  percentage: number;
  frequency: number;
  avgAmount: number;
  trend: 'up' | 'down' | 'stable';
  reliability: 'high' | 'medium' | 'low';
}

interface IncomeAnalysisProps {
  data: IncomeSource[];
  timeRange: { start: Date; end: Date; label: string };
}

export const IncomeAnalysis: React.FC<IncomeAnalysisProps> = ({
  data,
  timeRange
}) => {
  const { formatCurrency } = useInternationalization();

  const totalIncome = data.reduce((sum, source) => sum + source.amount, 0);
  const reliableSources = data.filter(s => s.reliability === 'high');
  const reliableIncome = reliableSources.reduce((sum, source) => sum + source.amount, 0);
  const reliabilityPercentage = totalIncome > 0 ? (reliableIncome / totalIncome) * 100 : 0;

  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case 'high': return 'text-success-400 bg-success-500/20';
      case 'medium': return 'text-warning-400 bg-warning-500/20';
      case 'low': return 'text-error-400 bg-error-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '➡️';
    }
  };

  return (
    <div className="space-y-6">
      {/* Income Overview */}
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <TrendingUp size={20} className="mr-2 text-success-400" />
          Income Analysis - {timeRange.label}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-black/30 rounded-xl p-4 text-center">
            <DollarSign size={20} className="mx-auto text-success-400 mb-2" />
            <p className="text-xs text-gray-400 mb-1">Total Income</p>
            <p className="text-xl font-bold text-white">{formatCurrency(totalIncome)}</p>
          </div>

          <div className="bg-black/30 rounded-xl p-4 text-center">
            <Target size={20} className="mx-auto text-primary-400 mb-2" />
            <p className="text-xs text-gray-400 mb-1">Income Sources</p>
            <p className="text-xl font-bold text-white">{data.length}</p>
          </div>

          <div className="bg-black/30 rounded-xl p-4 text-center">
            <Calendar size={20} className={`mx-auto mb-2 ${
              reliabilityPercentage >= 80 ? 'text-success-400' :
              reliabilityPercentage >= 60 ? 'text-warning-400' : 'text-error-400'
            }`} />
            <p className="text-xs text-gray-400 mb-1">Reliability</p>
            <p className={`text-xl font-bold ${
              reliabilityPercentage >= 80 ? 'text-success-400' :
              reliabilityPercentage >= 60 ? 'text-warning-400' : 'text-error-400'
            }`}>
              {reliabilityPercentage.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Income Sources Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="source" 
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
              formatter={(value) => [formatCurrency(value as number), 'Amount']}
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#F9FAFB',
                backdropFilter: 'blur(10px)'
              }}
            />
            <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Income Sources Breakdown */}
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
        <h4 className="font-medium text-white mb-4">Income Sources Breakdown</h4>
        
        <div className="space-y-3">
          {data.map((source, index) => (
            <div key={source.source} className="p-4 bg-black/30 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <Briefcase size={16} className="text-success-400" />
                  <span className="font-medium text-white">{source.source}</span>
                  <span className="text-lg">{getTrendIcon(source.trend)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getReliabilityColor(source.reliability)}`}>
                    {source.reliability} reliability
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{formatCurrency(source.amount)}</p>
                  <p className="text-xs text-gray-400">{source.percentage.toFixed(1)}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Frequency</p>
                  <p className="text-white">{source.frequency} transactions</p>
                </div>
                <div>
                  <p className="text-gray-400">Average Amount</p>
                  <p className="text-white">{formatCurrency(source.avgAmount)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Income Insights */}
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
        <h4 className="font-medium text-white mb-4 flex items-center">
          <Target size={18} className="mr-2 text-blue-400" />
          Income Insights
        </h4>
        
        <div className="space-y-3">
          <div className="p-4 bg-success-500/20 rounded-lg border border-success-500/30">
            <div className="flex items-start space-x-3">
              <CheckCircle size={16} className="text-success-400 mt-0.5" />
              <div>
                <h5 className="font-medium text-success-400 text-sm">Income Diversification</h5>
                <p className="text-success-300 text-sm mt-1">
                  You have {data.length} income source{data.length !== 1 ? 's' : ''}, which provides good financial stability.
                  {reliabilityPercentage >= 80 && ' Your income sources are highly reliable.'}
                </p>
              </div>
            </div>
          </div>

          {reliabilityPercentage < 60 && (
            <div className="p-4 bg-warning-500/20 rounded-lg border border-warning-500/30">
              <div className="flex items-start space-x-3">
                <AlertTriangle size={16} className="text-warning-400 mt-0.5" />
                <div>
                  <h5 className="font-medium text-warning-400 text-sm">Income Stability Concern</h5>
                  <p className="text-warning-300 text-sm mt-1">
                    Only {reliabilityPercentage.toFixed(0)}% of your income comes from reliable sources. 
                    Consider building more stable income streams.
                  </p>
                </div>
              </div>
            </div>
          )}

          {data.some(d => d.trend === 'down') && (
            <div className="p-4 bg-error-500/20 rounded-lg border border-error-500/30">
              <div className="flex items-start space-x-3">
                <AlertTriangle size={16} className="text-error-400 mt-0.5" />
                <div>
                  <h5 className="font-medium text-error-400 text-sm">Declining Income Sources</h5>
                  <p className="text-error-300 text-sm mt-1">
                    Some income sources are showing downward trends. Monitor these closely and consider alternatives.
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