import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
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
import { SpendingPatternAnalysis } from '../components/analytics/SpendingPatternAnalysis';
import { IncomeAnalysis } from '../components/analytics/IncomeAnalysis';
import { BudgetPerformance } from '../components/analytics/BudgetPerformance';
import { GoalProgressAnalytics } from '../components/analytics/GoalProgressAnalytics';
import { useFinance } from '../contexts/FinanceContext';
import { ChevronDown, ChevronUp, TrendingUp, PieChart as PieChartIcon, DollarSign, Target, Calendar, Clock, Sparkles, BarChart3, Activity, Zap } from 'lucide-react';
import { isWithinInterval, format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

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
  const { 
    transactions, 
    goals, 
    budgets, 
    liabilities,
    getMonthlyTrends, 
    getCategoryBreakdown, 
    getNetWorthTrends,
    getSpendingPatterns,
    getIncomeAnalysis,
    getBudgetPerformance
  } = useFinance();
  
  const [showDetailedCharts, setShowDetailedCharts] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'area'>('line');
  const [showFilters, setShowFilters] = useState(false);
  const [timeRange, setTimeRange] = useState(12); // months
  const [activeTab, setActiveTab] = useState<'overview' | 'spending' | 'income' | 'budget' | 'goals' | 'health' | 'forecast'>('overview');
  
  // Timeline state
  const [timelineType, setTimelineType] = useState<TimelineType>('month');
  const [timelineRange, setTimelineRange] = useState<TimelineRange>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
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

      // Additional filters
      if (filters.dateRange.start && t.date < new Date(filters.dateRange.start)) return false;
      if (filters.dateRange.end && t.date > new Date(filters.dateRange.end)) return false;
      if (filters.categories.length > 0 && !filters.categories.includes(t.category)) return false;
      if (filters.transactionType !== 'all' && t.type !== filters.transactionType) return false;
      if (filters.amountRange.min > 0 && t.amount < filters.amountRange.min) return false;
      if (filters.amountRange.max > 0 && t.amount > filters.amountRange.max) return false;
      
      return true;
    });
  }, [transactions, timelineRange, filters]);

  // Calculate analytics data
  const monthlyTrends = useMemo(() => getMonthlyTrends(timeRange), [getMonthlyTrends, timeRange]);
  const spendingPatterns = useMemo(() => getSpendingPatterns(filteredTransactions), [getSpendingPatterns, filteredTransactions]);
  const incomeAnalysis = useMemo(() => getIncomeAnalysis(filteredTransactions), [getIncomeAnalysis, filteredTransactions]);
  const budgetPerformance = useMemo(() => getBudgetPerformance(), [getBudgetPerformance]);

  // Timeline analytics
  const timelineAnalytics = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const transactionCount = filteredTransactions.length;
    const avgTransactionAmount = transactionCount > 0 ? (income + expenses) / transactionCount : 0;
    
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

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'spending', label: 'Spending', icon: TrendingUp },
    { id: 'income', label: 'Income', icon: DollarSign },
    { id: 'budget', label: 'Budget', icon: PieChartIcon },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'health', label: 'Health', icon: Activity },
    { id: 'forecast', label: 'AI Forecast', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen text-white pb-20">
      {/* Collapsible Header */}
      <CollapsibleHeader>
        <div className="px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Analytics & Reports</h1>
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
      
      {/* Main Content */}
      <div className="pt-32 sm:pt-36 px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Timeline Selector */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
          <TimelineSelector
            selectedType={timelineType}
            selectedRange={timelineRange}
            onTypeChange={setTimelineType}
            onRangeChange={setTimelineRange}
            showCalendar={false}
            onToggleCalendar={() => {}}
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
            {/* Financial Trends */}
            <TrendChart data={monthlyTrends} type={chartType} />

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
                      Less Detail <ChevronUp size={14} className="ml-1" />
                    </>
                  ) : (
                    <>
                      More Detail <ChevronDown size={14} className="ml-1" />
                    </>
                  )}
                </button>
              </div>
              
              {showDetailedCharts ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Expense Pie Chart */}
                  {categoryBreakdown.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                        <PieChartIcon size={16} className="mr-2" />
                        Expenses by Category
                      </h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={categoryBreakdown}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            fontSize={10}
                          >
                            {categoryBreakdown.map((entry, index) => (
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
                </div>
              ) : (
                <div className="space-y-3">
                  {categoryBreakdown.slice(0, 5).map((item, index) => (
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
          </div>
        )}

        {activeTab === 'spending' && (
          <div className="space-y-6">
            <SpendingPatternAnalysis 
              data={spendingPatterns}
              timeRange={timelineRange}
            />
          </div>
        )}

        {activeTab === 'income' && (
          <div className="space-y-6">
            <IncomeAnalysis 
              data={incomeAnalysis}
              timeRange={timelineRange}
            />
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="space-y-6">
            <BudgetPerformance 
              data={budgetPerformance}
              timeRange={timelineRange}
            />
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-6">
            <GoalProgressAnalytics 
              goals={goals}
              timeRange={timelineRange}
            />
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-6">
            <FinancialHealthScore />
          </div>
        )}

        {activeTab === 'forecast' && (
          <div className="space-y-6">
            <FinancialForecast />
          </div>
        )}
      </div>
    </div>
  );
};