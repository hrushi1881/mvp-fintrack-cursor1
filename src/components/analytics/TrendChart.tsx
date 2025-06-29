import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface TrendData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface TrendChartProps {
  data: TrendData[];
  type: 'line' | 'area';
  showNet?: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({ 
  data, 
  type = 'line',
  showNet = true 
}) => {
  const { formatCurrency, currency } = useInternationalization();
  const ChartComponent = type === 'area' ? AreaChart : LineChart;

  return (
    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-4">Financial Trends</h3>
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
            tickFormatter={(value) => `${currency.symbol}${value.toLocaleString()}`}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [
              formatCurrency(value), 
              name.charAt(0).toUpperCase() + name.slice(1)
            ]}
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#F9FAFB',
              backdropFilter: 'blur(10px)'
            }}
          />
          
          {type === 'area' ? (
            <>
              <Area
                type="monotone"
                dataKey="income"
                stackId="1"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stackId="2"
                stroke="#EF4444"
                fill="#EF4444"
                fillOpacity={0.3}
              />
              {showNet && (
                <Area
                  type="monotone"
                  dataKey="net"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.2}
                />
              )}
            </>
          ) : (
            <>
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#EF4444"
                strokeWidth={3}
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2 }}
              />
              {showNet && (
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                />
              )}
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>
      
      <div className="flex justify-center space-x-6 mt-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-success-500 rounded-full"></div>
          <span className="text-gray-300">Income</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-error-500 rounded-full"></div>
          <span className="text-gray-300">Expenses</span>
        </div>
        {showNet && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
            <span className="text-gray-300">Net</span>
          </div>
        )}
      </div>
    </div>
  );
};