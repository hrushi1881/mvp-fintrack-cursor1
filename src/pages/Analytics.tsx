import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CollapsibleHeader } from '../components/layout/CollapsibleHeader';
import { PageNavigation } from '../components/layout/PageNavigation';
import { AdvancedFilters } from '../components/analytics/AdvancedFilters';
import { TrendChart } from '../components/analytics/TrendChart';
import { CategoryInsights } from '../components/analytics/CategoryInsights';
import { NetWorthChart } from '../components/analytics/NetWorthChart';
import { TimelineSelector, TimelineType } from '../components/analytics/TimelineSelector';
import { DataExportImport } from '../components/common/DataExportImport';
import { FinancialHealthScore } from '../components/analytics/FinancialHealthScore';
import { FinancialForecast } from '../components/analytics/FinancialForecast';
import { useFinance } from '../contexts/FinanceContext';
import { ChevronDown, ChevronUp, TrendingUp, PieChart as PieChartIcon, DollarSign, Target, Calendar, Clock, Sparkles } from 'lucide-react';
import { isWithinInterval, format } from 'date-fns';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

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

interface TimelineRange {
  start: Date;
  end: Date;
  label: string;
}

export const Analytics: React.FC = () => {
  const { transactions, goals, budgets, getMonthlyTrends, getCategoryBreakdown, getNetWorthTrends } = useFinance();
  const [showDetailedCharts, setShowDetailedCharts] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'area'>('line');
  const [showFilters, setShowFilters] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [timeRange, setTimeRange] = useState(12); // months
  const [netWorthTimeRange, setNetWorthTimeRange] = useState(12); // separate time range for net worth
  const [activeTab, setActiveTab] = useState<'overview' | 'networth' | 'categories' | 'health' | 'forecast'>('overview');
  
  // Timeline state
  const [timelineType, setTimelineType] = useState<TimelineType>('month');
  const [timelineRange, setTimelineRange] = useState<TimelineRange>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    label: format(new Date(), 'MMMM yyyy')
  });
  
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: { start: '', end: '' },
    categories: [],
    amountRange: { min: 0, max: 0 },
    transactionType: 'all',
  });

  // Get available categories
  const availableCategories = useMemo(() => {
    const categories = new Set(transactions.map(t => t.category));
    return Array.from(categories).sort();
  }, [transactions]);

  // Apply timeline and filters to transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Timeline filter (primary filter)
      if (!isWithinInterval(t.date, { start: timelineRange.start, end: timelineRange.end })) {
        return false;
      }

      // Additional date range filter (if specified)
      if (filters.dateRange.start && t.date < new Date(filters.dateRange.start)) return false;
      if (filters.dateRange.end && t.date > new Date(filters.dateRange.end)) return false;
      
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(t.category)) return false;
      
      // Transaction type filter
      if (filters.transactionType !== 'all' && t.type !== filters.transactionType) return false;
      
      // Amount range filter
      if (filters.amountRange.min > 0 && t.amount < filters.amountRange.min) return false;
      if (filters.amountRange.max > 0 && t.amount > filters.amountRange.max) return false;
      
      return true;
    });
  }, [transactions, timelineRange, filters]);

  // Enhanced time range options for trends
  const timeRangeOptions = [
    { value: 1, label: '1 Day', unit: 'day' },
    { value: 7, label: '1 Week', unit: 'day' },
    { value: 14, label: '2 Weeks', unit: 'day' },
    { value: 30, label: '1 Month', unit: 'day' },
    { value: 90, label: '3 Months', unit: 'week' },
    { value: 180, label: '6 Months', unit: 'week' },
    { value: 365, label: '1 Year', unit: 'month' },
    { value: 730, label: '2 Years', unit: 'month' },
  ];

  // Calculate analytics data based on filtered transactions and time range
  const monthlyTrends = useMemo(() => {
    const trends = [];
    const now = new Date();
    const selectedOption = timeRangeOptions.find(opt => opt.value === timeRange) || timeRangeOptions[6];
    
    if (selectedOption.unit === 'day') {
      // Daily trends
      for (let i = selectedOption.value - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        const dayTransactions = filteredTransactions.filter(t => 
          t.date.toDateString() === date.toDateString()
        );
        
        const income = dayTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = dayTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        trends.push({
          month: format(date, selectedOption.value <= 7 ? 'EEE' : 'MMM dd'),
          income,
          expenses,
          net: income - expenses
        });
      }
    } else if (selectedOption.unit === 'week') {
      // Weekly trends
      const weeksToShow = Math.ceil(selectedOption.value / 7);
      for (let i = weeksToShow - 1; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weekTransactions = filteredTransactions.filter(t => 
          t.date >= weekStart && t.date <= weekEnd
        );
        
        const income = weekTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = weekTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        trends.push({
          month: `Week ${format(weekStart, 'MMM dd')}`,
          income,
          expenses,
          net: income - expenses
        });
      }
    } else {
      // Monthly trends (existing logic)
      const monthsToShow = Math.ceil(selectedOption.value / 30);
      for (let i = monthsToShow - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthTransactions = filteredTransactions.filter(t => 
          t.date.getMonth() === date.getMonth() && 
          t.date.getFullYear() === date.getFullYear()
        );
        
        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        trends.push({
          month: date.toLocaleDateString('default', { month: 'short', year: 'numeric' }),
          income,
          expenses,
          net: income - expenses
        });
      }
    }
    
    return trends;
  }, [filteredTransactions, timeRange, timeRangeOptions]);

  // Get net worth trends
  const netWorthTrends = useMemo(() => {
    return getNetWorthTrends(netWorthTimeRange);
  }, [getNetWorthTrends, netWorthTimeRange]);

  // Calculate timeline-specific analytics
  const timelineAnalytics = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const transactionCount = filteredTransactions.length;
    const avgTransactionAmount = transactionCount > 0 ? (income + expenses) / transactionCount : 0;
    
    // Calculate daily averages based on timeline type
    const timelineDays = Math.ceil((timelineRange.end.getTime() - timelineRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const dailyIncome = timelineDays > 0 ? income / timelineDays : 0;
    const dailyExpenses = timelineDays > 0 ? expenses / timelineDays : 0;

    return {
      income,
      expenses,
      net: income - expenses,
      transactionCount,
      avgTransactionAmount,
      dailyIncome,
      dailyExpenses,
      timelineDays
    };
  }, [filteredTransactions, timelineRange]);

  // Expense breakdown
  const expensesByCategory = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const categoryTotals = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  // Income breakdown
  const incomeByCategory = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income');
    const categoryTotals = income.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  // Category insights data
  const currentPeriodData = useMemo(() => {
    const income = getCategoryBreakdown('income', 3);
    const expenses = getCategoryBreakdown('expense', 3);
    
    return { income, expenses };
  }, [getCategoryBreakdown]);

  const previousPeriodData = useMemo(() => {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() - 3);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    
    const previousTransactions = transactions.filter(t => 
      t.date >= startDate && t.date < endDate
    );
    
    // Calculate previous period breakdown
    const income = previousTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    
    const expenses = previousTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    
    const total = Object.values(income).reduce((sum, amount) => sum + amount, 0);
    const expenseTotal = Object.values(expenses).reduce((sum, amount) => sum + amount, 0);
    
    return {
      income: Object.entries(income).map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0
      })),
      expenses: Object.entries(expenses).map(([category, amount]) => ({
        category,
        amount,
        percentage: expenseTotal > 0 ? (amount / expenseTotal) * 100 : 0
      }))
    };
  }, [transactions]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'networth', label: 'Net Worth', icon: DollarSign },
    { id: 'categories', label: 'Categories', icon: PieChartIcon },
    { id: 'health', label: 'Health Score', icon: Target },
    { id: 'forecast', label: 'AI Forecast', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen text-white pb-20">
      {/* Collapsible Header */}
      <CollapsibleHeader>
        <div className="px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Analytics</h1>
            <div className="flex items-center space-x-2">
              <DataExportImport />
              <AdvancedFilters
                filters={filters}
                onFiltersChange={setFilters}
                availableCategories={availableCategories}
                isOpen={showFilters}
                onToggle={() => setShowFilters(!showFilters)}
              />
            </div>
          </div>
          <PageNavigation />
        </div>
      </CollapsibleHeader>
      
      {/* Main Content with top padding to account for fixed header */}
      <div className="pt-32 sm:pt-36 px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Timeline Selector */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
          <TimelineSelector
            selectedType={timelineType}
            selectedRange={timelineRange}
            onTypeChange={setTimelineType}
            onRangeChange={setTimelineRange}
            showCalendar={showCalendar}
            onToggleCalendar={() => setShowCalendar(!showCalendar)}
          />
        </div>

        {/* Timeline Analytics Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp size={16} className="text-success-400" />
              <span className="text-xs text-gray-400">Income</span>
            </div>
            <p className="text-lg font-bold text-white">${timelineAnalytics.income.toLocaleString()}</p>
            <p className="text-xs text-gray-500">
              ${timelineAnalytics.dailyIncome.toFixed(0)}/day avg
            </p>
          </div>

          <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp size={16} className="text-error-400 rotate-180" />
              <span className="text-xs text-gray-400">Expenses</span>
            </div>
            <p className="text-lg font-bold text-white">${timelineAnalytics.expenses.toLocaleString()}</p>
            <p className="text-xs text-gray-500">
              ${timelineAnalytics.dailyExpenses.toFixed(0)}/day avg
            </p>
          </div>

          <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign size={16} className={timelineAnalytics.net >= 0 ? 'text-success-400' : 'text-error-400'} />
              <span className="text-xs text-gray-400">Net</span>
            </div>
            <p className={`text-lg font-bold ${timelineAnalytics.net >= 0 ? 'text-success-400' : 'text-error-400'}`}>
              {timelineAnalytics.net >= 0 ? '+' : ''}${timelineAnalytics.net.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">
              {timelineAnalytics.transactionCount} transactions
            </p>
          </div>

          <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <Clock size={16} className="text-primary-400" />
              <span className="text-xs text-gray-400">Period</span>
            </div>
            <p className="text-lg font-bold text-white">{timelineAnalytics.timelineDays}</p>
            <p className="text-xs text-gray-500">
              days in {timelineType}
            </p>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <AdvancedFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableCategories={availableCategories}
            isOpen={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
          />
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-black/20 backdrop-blur-md rounded-xl p-1 border border-white/10 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Enhanced Time Range Selector for Trends */}
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-white">Financial Trends</h3>
              <div className="flex items-center space-x-2">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(Number(e.target.value))}
                  className="bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm min-w-[120px]"
                >
                  {timeRangeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="flex bg-black/20 rounded-lg p-1">
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-3 py-1 rounded text-xs ${
                      chartType === 'line' ? 'bg-primary-500 text-white' : 'text-gray-400'
                    }`}
                  >
                    Line
                  </button>
                  <button
                    onClick={() => setChartType('area')}
                    className={`px-3 py-1 rounded text-xs ${
                      chartType === 'area' ? 'bg-primary-500 text-white' : 'text-gray-400'
                    }`}
                  >
                    Area
                  </button>
                </div>
              </div>
            </div>

            {/* Trend Chart */}
            <TrendChart data={monthlyTrends} type={chartType} />

            {/* Category Insights */}
            <CategoryInsights
              incomeData={currentPeriodData.income}
              expenseData={currentPeriodData.expenses}
              previousPeriodData={previousPeriodData}
            />
          </div>
        )}

        {activeTab === 'networth' && (
          <div className="space-y-6">
            {/* Net Worth Chart */}
            <NetWorthChart
              data={netWorthTrends}
              timeRange={netWorthTimeRange}
              onTimeRangeChange={setNetWorthTimeRange}
            />

            {/* Net Worth Insights */}
            {netWorthTrends.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
                  <div className="flex items-center space-x-3 mb-2">
                    <DollarSign size={20} className="text-blue-400" />
                    <h4 className="font-medium text-white">Liquid Assets</h4>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    ${netWorthTrends[netWorthTrends.length - 1]?.liquidAssets.toLocaleString() || '0'}
                  </p>
                  <p className="text-sm text-gray-400">Available cash & checking</p>
                </div>

                <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
                  <div className="flex items-center space-x-3 mb-2">
                    <Target size={20} className="text-success-400" />
                    <h4 className="font-medium text-white">Goal Savings</h4>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    ${netWorthTrends[netWorthTrends.length - 1]?.goalSavings.toLocaleString() || '0'}
                  </p>
                  <p className="text-sm text-gray-400">Money saved for goals</p>
                </div>

                <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
                  <div className="flex items-center space-x-3 mb-2">
                    <TrendingUp size={20} className="text-purple-400" />
                    <h4 className="font-medium text-white">Growth Rate</h4>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {netWorthTrends.length > 1 ? (
                      ((netWorthTrends[netWorthTrends.length - 1]?.netWorth - netWorthTrends[0]?.netWorth) / 
                       Math.abs(netWorthTrends[0]?.netWorth || 1) * 100).toFixed(1)
                    ) : '0'}%
                  </p>
                  <p className="text-sm text-gray-400">Over {netWorthTimeRange} months</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            {/* Category Breakdown */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  Category Breakdown - {timelineRange.label}
                </h3>
                <button
                  onClick={() => setShowDetailedCharts(!showDetailedCharts)}
                  className="flex items-center text-primary-400 text-xs sm:text-sm font-medium hover:text-primary-300"
                >
                  {showDetailedCharts ? (
                    <>
                      Less Detail <ChevronUp size={14} className="ml-1 sm:w-4 sm:h-4" />
                    </>
                  ) : (
                    <>
                      More Detail <ChevronDown size={14} className="ml-1 sm:w-4 sm:h-4" />
                    </>
                  )}
                </button>
              </div>
              
              {showDetailedCharts ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Expense Pie Chart */}
                  {expensesByCategory.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                        <PieChartIcon size={16} className="mr-2" />
                        Expenses by Category
                      </h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={expensesByCategory}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            fontSize={10}
                          >
                            {expensesByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => `$${value.toLocaleString()}`}
                            contentStyle={{
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px',
                              color: '#F9FAFB',
                              backdropFilter: 'blur(10px)'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Income Bar Chart */}
                  {incomeByCategory.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                        <TrendingUp size={16} className="mr-2" />
                        Income by Category
                      </h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={incomeByCategory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#9CA3AF" 
                            fontSize={10}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            stroke="#9CA3AF" 
                            fontSize={10}
                            tickFormatter={(value) => `$${value.toLocaleString()}`}
                          />
                          <Tooltip 
                            formatter={(value) => `$${value.toLocaleString()}`}
                            contentStyle={{
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px',
                              color: '#F9FAFB',
                              backdropFilter: 'blur(10px)'
                            }}
                          />
                          <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {expensesByCategory.slice(0, 5).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium text-white text-sm sm:text-base">{item.name}</span>
                      </div>
                      <span className="text-gray-400 text-sm sm:text-base">${item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Insights */}
            <CategoryInsights
              incomeData={currentPeriodData.income}
              expenseData={currentPeriodData.expenses}
              previousPeriodData={previousPeriodData}
            />
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-6">
            {/* Financial Health Score */}
            <FinancialHealthScore />
          </div>
        )}

        {activeTab === 'forecast' && (
          <div className="space-y-6">
            {/* AI Financial Forecast */}
            <FinancialForecast />
          </div>
        )}

        {/* Goals Progress - Enhanced */}
        {goals.length > 0 && (
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Goal Progress</h3>
            <div className="space-y-4">
              {goals.slice(0, 5).map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                const monthsRemaining = Math.ceil(
                  (goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)
                );
                
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-white">{goal.title}</span>
                      <div className="text-right">
                        <span className="text-gray-400">
                          {progress.toFixed(0)}% • {monthsRemaining > 0 ? `${monthsRemaining}mo left` : 'Overdue'}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progress >= 100 ? 'bg-success-500' : 
                          progress >= 75 ? 'bg-primary-500' : 
                          progress >= 50 ? 'bg-warning-500' : 'bg-error-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>${goal.currentAmount.toLocaleString()}</span>
                      <span>${goal.targetAmount.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};