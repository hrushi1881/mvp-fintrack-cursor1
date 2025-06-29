import React, { useState, useMemo } from 'react';
import { ArrowLeft, Edit3, Trash2, Search, Filter, Calendar as CalendarIcon, TrendingUp, TrendingDown, Plus, Minus, Eye, EyeOff, CheckSquare, Square } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, getDay } from 'date-fns';
import { PageNavigation } from '../components/layout/PageNavigation';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CurrencyIcon } from '../components/common/CurrencyIcon';

export const Calendar: React.FC = () => {
  const { transactions } = useFinance();
  const { formatCurrency, currency } = useInternationalization();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get transactions for the current month
  const monthTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });
  }, [transactions, monthStart, monthEnd]);

  // Group transactions by date
  const transactionsByDate = useMemo(() => {
    const grouped: Record<string, typeof transactions> = {};
    monthTransactions.forEach(transaction => {
      const dateKey = format(transaction.date, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });
    return grouped;
  }, [monthTransactions]);

  // Calculate daily totals
  const getDayData = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayTransactions = transactionsByDate[dateKey] || [];
    
    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const net = income - expenses;
    
    return {
      transactions: dayTransactions,
      income,
      expenses,
      net,
      hasTransactions: dayTransactions.length > 0
    };
  };

  const selectedDateTransactions = selectedDate ? getDayData(selectedDate) : null;

  // Calculate month totals
  const monthTotals = useMemo(() => {
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { income, expenses, net: income - expenses };
  }, [monthTransactions]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
    setSelectedDate(null);
  };

  // Generate calendar grid with proper week alignment
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = getDay(monthStart);
    const daysFromPrevMonth = firstDayOfWeek;
    
    const prevMonthEnd = subMonths(monthStart, 1);
    const prevMonthDays = eachDayOfInterval({
      start: subMonths(prevMonthEnd, 0),
      end: prevMonthEnd
    }).slice(-daysFromPrevMonth);
    
    const nextMonthStart = addMonths(monthStart, 1);
    const totalCells = 42;
    const remainingCells = totalCells - prevMonthDays.length - daysInMonth.length;
    const nextMonthDays = eachDayOfInterval({
      start: nextMonthStart,
      end: addMonths(nextMonthStart, 0)
    }).slice(0, remainingCells);
    
    return [
      ...prevMonthDays.map(date => ({ date, isCurrentMonth: false })),
      ...daysInMonth.map(date => ({ date, isCurrentMonth: true })),
      ...nextMonthDays.map(date => ({ date, isCurrentMonth: false }))
    ];
  }, [monthStart, daysInMonth]);

  return (
    <div className="min-h-screen text-white pb-20">
      {/* Header with Navigation */}
      <header className="bg-black/20 backdrop-blur-md px-4 py-4 sm:py-6 sticky top-0 z-30 border-b border-white/10">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Calendar</h1>
        </div>
        <PageNavigation />
      </header>
      
      <div className="px-4 py-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-3 rounded-xl bg-black/20 backdrop-blur-md hover:bg-black/30 transition-colors border border-white/10"
          >
            <ArrowLeft size={20} className="text-gray-300" />
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center justify-center space-x-4 mt-2 text-sm">
              <span className="text-success-400">
                +{formatCurrency(monthTotals.income)}
              </span>
              <span className="text-error-400">
                -{formatCurrency(monthTotals.expenses)}
              </span>
              <span className={`font-semibold ${monthTotals.net >= 0 ? 'text-success-400' : 'text-error-400'}`}>
                Net: {monthTotals.net >= 0 ? '+' : ''}{formatCurrency(monthTotals.net)}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-3 rounded-xl bg-black/20 backdrop-blur-md hover:bg-black/30 transition-colors border border-white/10"
          >
            <TrendingUp size={20} className="text-gray-300 rotate-90" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/10">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ date, isCurrentMonth }, index) => {
              const dayData = getDayData(date);
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isTodayDate = isToday(date);
              
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  disabled={!isCurrentMonth}
                  className={`
                    relative p-3 rounded-xl transition-all duration-200 min-h-[60px] flex flex-col items-center justify-center backdrop-blur-sm
                    ${!isCurrentMonth 
                      ? 'text-gray-600 cursor-not-allowed' 
                      : 'text-white hover:bg-white/10'
                    }
                    ${isSelected ? 'bg-primary-500/50 hover:bg-primary-600/50 border border-primary-400' : ''}
                    ${isTodayDate && !isSelected ? 'bg-white/10 ring-2 ring-primary-500' : ''}
                  `}
                >
                  <span className={`text-sm font-medium ${
                    isTodayDate ? 'text-primary-400' : ''
                  }`}>
                    {format(date, 'd')}
                  </span>
                  
                  {isCurrentMonth && dayData.hasTransactions && (
                    <div className="flex space-x-1 mt-1">
                      {dayData.income > 0 && (
                        <div className="w-1.5 h-1.5 bg-success-400 rounded-full"></div>
                      )}
                      {dayData.expenses > 0 && (
                        <div className="w-1.5 h-1.5 bg-error-400 rounded-full"></div>
                      )}
                    </div>
                  )}
                  
                  {isCurrentMonth && dayData.net !== 0 && (
                    <span className={`text-xs font-medium mt-1 ${
                      dayData.net > 0 ? 'text-success-400' : 'text-error-400'
                    }`}>
                      {dayData.net > 0 ? '+' : ''}{formatCurrency(dayData.net)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDate && selectedDateTransactions && (
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              <div className="flex items-center space-x-4">
                {selectedDateTransactions.income > 0 && (
                  <div className="flex items-center space-x-1 text-success-400">
                    <TrendingUp size={16} />
                    <span className="font-medium">+{formatCurrency(selectedDateTransactions.income)}</span>
                  </div>
                )}
                {selectedDateTransactions.expenses > 0 && (
                  <div className="flex items-center space-x-1 text-error-400">
                    <TrendingDown size={16} />
                    <span className="font-medium">-{formatCurrency(selectedDateTransactions.expenses)}</span>
                  </div>
                )}
              </div>
            </div>

            {selectedDateTransactions.hasTransactions ? (
              <div className="space-y-3">
                {selectedDateTransactions.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-md rounded-xl hover:bg-black/30 transition-colors border border-white/10"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === 'income' 
                          ? 'bg-success-500/20' 
                          : 'bg-error-500/20'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp size={16} className="text-success-400" />
                        ) : (
                          <TrendingDown size={16} className="text-error-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-400">
                          {transaction.category}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'income' 
                          ? 'text-success-400' 
                          : 'text-error-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(transaction.date, 'h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">No transactions on this date</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};