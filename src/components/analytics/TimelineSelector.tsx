import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Filter } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays, subWeeks, subMonths, subQuarters, subYears, addDays, addWeeks, addMonths, addQuarters, addYears } from 'date-fns';

export type TimelineType = 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface TimelineRange {
  start: Date;
  end: Date;
  label: string;
}

interface TimelineSelectorProps {
  selectedType: TimelineType;
  selectedRange: TimelineRange;
  onTypeChange: (type: TimelineType) => void;
  onRangeChange: (range: TimelineRange) => void;
  showCalendar?: boolean;
  onToggleCalendar?: () => void;
}

export const TimelineSelector: React.FC<TimelineSelectorProps> = ({
  selectedType,
  selectedRange,
  onTypeChange,
  onRangeChange,
  showCalendar = false,
  onToggleCalendar,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const timelineTypes = [
    { value: 'week', label: 'Week', icon: '📅' },
    { value: 'month', label: 'Month', icon: '🗓️' },
    { value: 'quarter', label: 'Quarter', icon: '📊' },
    { value: 'year', label: 'Year', icon: '📈' },
    { value: 'custom', label: 'Custom', icon: '🎯' },
  ];

  const getCurrentRange = (type: TimelineType, date: Date = currentDate): TimelineRange => {
    switch (type) {
      case 'week':
        const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
        return {
          start: weekStart,
          end: weekEnd,
          label: `Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
        };
      
      case 'month':
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        return {
          start: monthStart,
          end: monthEnd,
          label: format(date, 'MMMM yyyy')
        };
      
      case 'quarter':
        const quarterStart = startOfQuarter(date);
        const quarterEnd = endOfQuarter(date);
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return {
          start: quarterStart,
          end: quarterEnd,
          label: `Q${quarter} ${format(date, 'yyyy')}`
        };
      
      case 'year':
        const yearStart = startOfYear(date);
        const yearEnd = endOfYear(date);
        return {
          start: yearStart,
          end: yearEnd,
          label: format(date, 'yyyy')
        };
      
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start: new Date(customStartDate),
            end: new Date(customEndDate),
            label: `${format(new Date(customStartDate), 'MMM d')} - ${format(new Date(customEndDate), 'MMM d, yyyy')}`
          };
        }
        // Fallback to current month
        return getCurrentRange('month', date);
      
      default:
        return getCurrentRange('month', date);
    }
  };

  const navigateTimeline = (direction: 'prev' | 'next') => {
    let newDate: Date;
    
    switch (selectedType) {
      case 'week':
        newDate = direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1);
        break;
      case 'month':
        newDate = direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1);
        break;
      case 'quarter':
        newDate = direction === 'prev' ? subQuarters(currentDate, 1) : addQuarters(currentDate, 1);
        break;
      case 'year':
        newDate = direction === 'prev' ? subYears(currentDate, 1) : addYears(currentDate, 1);
        break;
      default:
        return;
    }
    
    setCurrentDate(newDate);
    const newRange = getCurrentRange(selectedType, newDate);
    onRangeChange(newRange);
  };

  const handleTypeChange = (type: TimelineType) => {
    onTypeChange(type);
    const newRange = getCurrentRange(type, currentDate);
    onRangeChange(newRange);
  };

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      const newRange = getCurrentRange('custom');
      onRangeChange(newRange);
    }
  };

  const getQuickRanges = () => {
    const now = new Date();
    return [
      {
        label: 'Last 7 days',
        range: {
          start: subDays(now, 6),
          end: now,
          label: 'Last 7 days'
        }
      },
      {
        label: 'Last 30 days',
        range: {
          start: subDays(now, 29),
          end: now,
          label: 'Last 30 days'
        }
      },
      {
        label: 'Last 3 months',
        range: {
          start: subMonths(now, 3),
          end: now,
          label: 'Last 3 months'
        }
      },
      {
        label: 'Last 6 months',
        range: {
          start: subMonths(now, 6),
          end: now,
          label: 'Last 6 months'
        }
      },
      {
        label: 'Year to date',
        range: {
          start: startOfYear(now),
          end: now,
          label: 'Year to date'
        }
      },
      {
        label: 'All time',
        range: {
          start: subYears(now, 5),
          end: now,
          label: 'All time'
        }
      }
    ];
  };

  return (
    <div className="space-y-4">
      {/* Timeline Type Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Timeline</span>
        </div>
        
        {onToggleCalendar && (
          <button
            onClick={onToggleCalendar}
            className={`p-2 rounded-lg transition-colors ${
              showCalendar ? 'bg-primary-500/20 text-primary-400' : 'hover:bg-white/10 text-gray-400'
            }`}
            title="Toggle Calendar"
          >
            <Calendar size={16} />
          </button>
        )}
      </div>

      {/* Type Buttons */}
      <div className="grid grid-cols-5 gap-2">
        {timelineTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => handleTypeChange(type.value as TimelineType)}
            className={`p-3 rounded-xl text-center transition-all duration-200 ${
              selectedType === type.value
                ? 'bg-primary-500 text-white shadow-lg scale-105'
                : 'bg-black/20 text-gray-300 hover:bg-white/10 hover:scale-102'
            }`}
          >
            <div className="text-lg mb-1">{type.icon}</div>
            <div className="text-xs font-medium">{type.label}</div>
          </button>
        ))}
      </div>

      {/* Navigation and Current Range */}
      {selectedType !== 'custom' && (
        <div className="flex items-center justify-between bg-black/20 rounded-xl p-3 border border-white/10">
          <button
            onClick={() => navigateTimeline('prev')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={16} className="text-gray-400" />
          </button>
          
          <div className="text-center">
            <p className="font-semibold text-white">{selectedRange.label}</p>
            <p className="text-xs text-gray-400">
              {format(selectedRange.start, 'MMM d')} - {format(selectedRange.end, 'MMM d, yyyy')}
            </p>
          </div>
          
          <button
            onClick={() => navigateTimeline('next')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>
      )}

      {/* Custom Date Range */}
      {selectedType === 'custom' && (
        <div className="bg-black/20 rounded-xl p-4 border border-white/10 space-y-4">
          <h4 className="font-medium text-white">Custom Date Range</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  if (e.target.value && customEndDate) {
                    setTimeout(handleCustomDateChange, 100);
                  }
                }}
                className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  if (customStartDate && e.target.value) {
                    setTimeout(handleCustomDateChange, 100);
                  }
                }}
                className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          {/* Quick Range Buttons */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2">Quick Ranges</label>
            <div className="grid grid-cols-2 gap-2">
              {getQuickRanges().map((quickRange, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCustomStartDate(format(quickRange.range.start, 'yyyy-MM-dd'));
                    setCustomEndDate(format(quickRange.range.end, 'yyyy-MM-dd'));
                    onRangeChange(quickRange.range);
                  }}
                  className="p-2 text-xs bg-black/20 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
                >
                  {quickRange.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {showCalendar && (
        <div className="bg-black/20 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-white">Calendar View</h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={14} className="text-gray-400" />
              </button>
              <span className="text-sm font-medium text-white min-w-[120px] text-center">
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <ChevronRight size={14} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Mini Calendar */}
          <div className="grid grid-cols-7 gap-1 text-xs">
            {/* Day headers */}
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
              <div key={day} className="text-center text-gray-400 p-2 font-medium">
                {day}
              </div>
            ))}
            
            {/* Calendar days - simplified for demo */}
            {Array.from({ length: 35 }, (_, i) => {
              const dayNumber = i - 6; // Adjust for month start
              const isCurrentMonth = dayNumber > 0 && dayNumber <= 31;
              const isSelected = isCurrentMonth && dayNumber === currentDate.getDate();
              
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (isCurrentMonth) {
                      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
                      setCurrentDate(newDate);
                      const newRange = getCurrentRange(selectedType, newDate);
                      onRangeChange(newRange);
                    }
                  }}
                  className={`p-2 text-center rounded transition-colors ${
                    !isCurrentMonth 
                      ? 'text-gray-600 cursor-not-allowed' 
                      : isSelected
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                  disabled={!isCurrentMonth}
                >
                  {isCurrentMonth ? dayNumber : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Selection Summary */}
      <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
        <div className="flex items-center space-x-2">
          <Filter size={14} className="text-blue-400" />
          <span className="text-blue-400 text-sm font-medium">Current Filter</span>
        </div>
        <p className="text-blue-300 text-sm mt-1">
          Showing data for <strong>{selectedRange.label}</strong>
        </p>
        <p className="text-blue-200 text-xs">
          {format(selectedRange.start, 'EEEE, MMMM d, yyyy')} - {format(selectedRange.end, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>
    </div>
  );
};