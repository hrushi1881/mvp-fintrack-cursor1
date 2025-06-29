import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Clock, PiggyBank, CreditCard, Wallet } from 'lucide-react';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface NetWorthData {
  month: string;
  netWorth: number;
  liquidAssets: number;
  goalSavings: number;
  totalLiabilities: number;
}

interface NetWorthChartProps {
  data: NetWorthData[];
  timeRange: number;
  onTimeRangeChange: (months: number) => void;
}

export const NetWorthChart: React.FC<NetWorthChartProps> = ({ 
  data, 
  timeRange, 
  onTimeRangeChange 
}) => {
  const { formatCurrency, currency } = useInternationalization();
  const [chartType, setChartType] = useState<'line' | 'area'>('area');
  const [showComponents, setShowComponents] = useState(false);

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart;

  // Calculate net worth change
  const currentNetWorth = data[data.length - 1]?.netWorth || 0;
  const previousNetWorth = data[data.length - 2]?.netWorth || 0;
  const netWorthChange = currentNetWorth - previousNetWorth;
  const netWorthChangePercent = previousNetWorth !== 0 ? (netWorthChange / Math.abs(previousNetWorth)) * 100 : 0;

  // Calculate component breakdown for latest month
  const latestData = data[data.length - 1];
  const components = latestData ? [
    {
      label: 'Liquid Assets',
      value: latestData.liquidAssets,
      icon: Wallet,
      color: '#3B82F6',
      percentage: (latestData.liquidAssets / (latestData.liquidAssets + latestData.goalSavings)) * 100
    },
    {
      label: 'Goal Savings',
      value: latestData.goalSavings,
      icon: PiggyBank,
      color: '#10B981',
      percentage: (latestData.goalSavings / (latestData.liquidAssets + latestData.goalSavings)) * 100
    },
    {
      label: 'Liabilities',
      value: -latestData.totalLiabilities,
      icon: CreditCard,
      color: '#EF4444',
      percentage: (latestData.totalLiabilities / (latestData.liquidAssets + latestData.goalSavings)) * 100
    }
  ] : [];

  const timeRangeOptions = [
    { value: 6, label: '6M' },
    { value: 12, label: '1Y' },
    { value: 24, label: '2Y' },
    { value: 36, label: '3Y' }
  ];

  return (
    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Net Worth Trends</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CurrencyIcon currencyCode={currency.code} size={16} className="text-gray-400" />
              <span className="text-2xl font-bold text-white">
                {formatCurrency(currentNetWorth)}
              </span>
            </div>
            {data.length > 1 && (
              <div className={`flex items-center space-x-1 text-sm ${
                netWorthChange >= 0 ? 'text-success-400' : 'text-error-400'
              }`}>
                {netWorthChange >= 0 ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                <span>
                  {netWorthChange >= 0 ? '+' : ''}{formatCurrency(netWorthChange)}
                </span>
                <span className="text-gray-400">
                  ({netWorthChangePercent >= 0 ? '+' : ''}{netWorthChangePercent.toFixed(1)}%)
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Time Range Selector */}
          <div className="flex bg-black/20 rounded-lg p-1">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onTimeRangeChange(option.value)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  timeRange === option.value 
                    ? 'bg-primary-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <div className="flex bg-black/20 rounded-lg p-1">
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1 rounded text-xs ${
                chartType === 'area' ? 'bg-primary-500 text-white' : 'text-gray-400'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded text-xs ${
                chartType === 'line' ? 'bg-primary-500 text-white' : 'text-gray-400'
              }`}
            >
              Line
            </button>
          </div>

          {/* Components Toggle */}
          <button
            onClick={() => setShowComponents(!showComponents)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              showComponents 
                ? 'bg-primary-500/20 text-primary-400' 
                : 'bg-black/20 text-gray-400 hover:text-white'
            }`}
          >
            Components
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <ChartComponent data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="month" 
              stroke="#9CA3AF" 
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis 
              stroke="#9CA3AF" 
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
              tickFormatter={(value) => `${currency.symbol}${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatCurrency(value), 
                name === 'netWorth' ? 'Net Worth' :
                name === 'liquidAssets' ? 'Liquid Assets' :
                name === 'goalSavings' ? 'Goal Savings' :
                name === 'totalLiabilities' ? 'Liabilities' : name
              ]}
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#F9FAFB',
                backdropFilter: 'blur(10px)'
              }}
            />
            
            {chartType === 'area' ? (
              <>
                {showComponents && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="liquidAssets"
                      stackId="1"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="goalSavings"
                      stackId="1"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.3}
                    />
                  </>
                )}
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={showComponents ? 0.2 : 0.4}
                  strokeWidth={3}
                />
              </>
            ) : (
              <>
                {showComponents && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="liquidAssets"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                      strokeDasharray="5 5"
                    />
                    <Line
                      type="monotone"
                      dataKey="goalSavings"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                      strokeDasharray="5 5"
                    />
                    <Line
                      type="monotone"
                      dataKey="totalLiabilities"
                      stroke="#EF4444"
                      strokeWidth={2}
                      dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
                      strokeDasharray="5 5"
                    />
                  </>
                )}
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
                />
              </>
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-6 mb-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="text-gray-300">Net Worth</span>
        </div>
        {showComponents && (
          <>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-300">Liquid Assets</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-success-500 rounded-full"></div>
              <span className="text-gray-300">Goal Savings</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-error-500 rounded-full"></div>
              <span className="text-gray-300">Liabilities</span>
            </div>
          </>
        )}
      </div>

      {/* Component Breakdown */}
      {showComponents && latestData && (
        <div className="bg-black/20 rounded-xl p-4 border border-white/10">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Current Breakdown</h4>
          <div className="space-y-3">
            {components.map((component, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: component.color }}
                  />
                  <component.icon size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-300">{component.label}</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium ${
                    component.value >= 0 ? 'text-white' : 'text-error-400'
                  }`}>
                    {component.value >= 0 ? '' : '-'}{formatCurrency(Math.abs(component.value))}
                  </span>
                  <div className="text-xs text-gray-500">
                    {component.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {data.length > 1 && (
        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="flex items-start space-x-2">
            <TrendingUp size={16} className="text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-400 font-medium">Net Worth Insight</p>
              <p className="text-blue-300">
                {netWorthChange >= 0 
                  ? `Your net worth increased by ${formatCurrency(netWorthChange)} this month. Great progress!`
                  : `Your net worth decreased by ${formatCurrency(Math.abs(netWorthChange))} this month. Consider reviewing your spending.`
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};