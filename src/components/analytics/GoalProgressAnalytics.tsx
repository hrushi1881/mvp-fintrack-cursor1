import React from 'react';
import { Target, Calendar, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, differenceInDays, differenceInMonths } from 'date-fns';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { Goal } from '../../types';

interface GoalProgressAnalyticsProps {
  goals: Goal[];
  timeRange: { start: Date; end: Date; label: string };
}

export const GoalProgressAnalytics: React.FC<GoalProgressAnalyticsProps> = ({
  goals,
  timeRange
}) => {
  const { formatCurrency } = useInternationalization();

  // Calculate goal analytics
  const goalAnalytics = goals.map(goal => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const daysRemaining = differenceInDays(goal.targetDate, new Date());
    const monthsRemaining = differenceInMonths(goal.targetDate, new Date());
    const remaining = goal.targetAmount - goal.currentAmount;
    const monthlyNeeded = monthsRemaining > 0 ? remaining / monthsRemaining : 0;
    
    let status: 'on_track' | 'behind' | 'ahead' | 'completed' | 'overdue';
    if (progress >= 100) {
      status = 'completed';
    } else if (daysRemaining < 0) {
      status = 'overdue';
    } else if (monthlyNeeded <= 500) { // Assuming $500/month is reasonable
      status = 'on_track';
    } else if (monthlyNeeded <= 1000) {
      status = 'behind';
    } else {
      status = 'ahead';
    }

    return {
      ...goal,
      progress,
      daysRemaining,
      monthsRemaining,
      remaining,
      monthlyNeeded,
      status
    };
  });

  const completedGoals = goalAnalytics.filter(g => g.status === 'completed');
  const activeGoals = goalAnalytics.filter(g => g.status !== 'completed');
  const onTrackGoals = goalAnalytics.filter(g => g.status === 'on_track');
  const behindGoals = goalAnalytics.filter(g => g.status === 'behind');

  const chartData = goalAnalytics.map(goal => ({
    name: goal.title.length > 15 ? goal.title.substring(0, 15) + '...' : goal.title,
    current: goal.currentAmount,
    target: goal.targetAmount,
    progress: goal.progress
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success-400 bg-success-500/20';
      case 'on_track': return 'text-primary-400 bg-primary-500/20';
      case 'behind': return 'text-warning-400 bg-warning-500/20';
      case 'overdue': return 'text-error-400 bg-error-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-success-400" />;
      case 'on_track': return <Target size={16} className="text-primary-400" />;
      case 'behind': return <Clock size={16} className="text-warning-400" />;
      case 'overdue': return <AlertTriangle size={16} className="text-error-400" />;
      default: return <Target size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Goals Overview */}
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Target size={20} className="mr-2 text-primary-400" />
          Goal Progress Analytics
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-black/30 rounded-xl p-4 text-center">
            <Target size={20} className="mx-auto text-primary-400 mb-2" />
            <p className="text-xs text-gray-400 mb-1">Total Goals</p>
            <p className="text-xl font-bold text-white">{goals.length}</p>
          </div>

          <div className="bg-black/30 rounded-xl p-4 text-center">
            <CheckCircle size={20} className="mx-auto text-success-400 mb-2" />
            <p className="text-xs text-gray-400 mb-1">Completed</p>
            <p className="text-xl font-bold text-success-400">{completedGoals.length}</p>
          </div>

          <div className="bg-black/30 rounded-xl p-4 text-center">
            <TrendingUp size={20} className="mx-auto text-primary-400 mb-2" />
            <p className="text-xs text-gray-400 mb-1">On Track</p>
            <p className="text-xl font-bold text-primary-400">{onTrackGoals.length}</p>
          </div>

          <div className="bg-black/30 rounded-xl p-4 text-center">
            <Clock size={20} className="mx-auto text-warning-400 mb-2" />
            <p className="text-xs text-gray-400 mb-1">Behind</p>
            <p className="text-xl font-bold text-warning-400">{behindGoals.length}</p>
          </div>
        </div>

        {/* Goals Progress Chart */}
        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
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
                  name === 'current' ? 'Current Amount' : 'Target Amount'
                ]}
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#F9FAFB',
                  backdropFilter: 'blur(10px)'
                }}
              />
              <Bar dataKey="target" fill="#374151" radius={[4, 4, 0, 0]} />
              <Bar dataKey="current" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Individual Goal Analysis */}
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
        <h4 className="font-medium text-white mb-4">Individual Goal Performance</h4>
        
        <div className="space-y-4">
          {goalAnalytics.map((goal) => (
            <div key={goal.id} className="p-4 bg-black/30 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-white">{goal.title}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(goal.status)}`}>
                    {goal.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{goal.progress.toFixed(1)}%</p>
                  <p className="text-xs text-gray-400">
                    {goal.daysRemaining > 0 ? `${goal.daysRemaining} days left` : 'Overdue'}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    goal.status === 'completed' ? 'bg-success-500' :
                    goal.status === 'on_track' ? 'bg-primary-500' :
                    goal.status === 'behind' ? 'bg-warning-500' : 'bg-error-500'
                  }`}
                  style={{ width: `${Math.min(goal.progress, 100)}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Current / Target</p>
                  <p className="text-white">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Monthly Needed</p>
                  <p className={`font-medium ${
                    goal.monthlyNeeded <= 500 ? 'text-success-400' :
                    goal.monthlyNeeded <= 1000 ? 'text-warning-400' : 'text-error-400'
                  }`}>
                    {formatCurrency(goal.monthlyNeeded)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goal Insights */}
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
        <h4 className="font-medium text-white mb-4">Goal Insights</h4>
        
        <div className="space-y-3">
          {completedGoals.length > 0 && (
            <div className="p-4 bg-success-500/20 rounded-lg border border-success-500/30">
              <div className="flex items-start space-x-3">
                <CheckCircle size={16} className="text-success-400 mt-0.5" />
                <div>
                  <h5 className="font-medium text-success-400 text-sm">Goals Achieved!</h5>
                  <p className="text-success-300 text-sm mt-1">
                    You've completed {completedGoals.length} goal{completedGoals.length !== 1 ? 's' : ''}. 
                    Great job on reaching your financial milestones!
                  </p>
                </div>
              </div>
            </div>
          )}

          {behindGoals.length > 0 && (
            <div className="p-4 bg-warning-500/20 rounded-lg border border-warning-500/30">
              <div className="flex items-start space-x-3">
                <Clock size={16} className="text-warning-400 mt-0.5" />
                <div>
                  <h5 className="font-medium text-warning-400 text-sm">Goals Need Attention</h5>
                  <p className="text-warning-300 text-sm mt-1">
                    {behindGoals.length} goal{behindGoals.length !== 1 ? 's are' : ' is'} behind schedule. 
                    Consider increasing contributions or adjusting target dates.
                  </p>
                </div>
              </div>
            </div>
          )}

          {onTrackGoals.length === activeGoals.length && activeGoals.length > 0 && (
            <div className="p-4 bg-primary-500/20 rounded-lg border border-primary-500/30">
              <div className="flex items-start space-x-3">
                <Target size={16} className="text-primary-400 mt-0.5" />
                <div>
                  <h5 className="font-medium text-primary-400 text-sm">All Goals On Track</h5>
                  <p className="text-primary-300 text-sm mt-1">
                    Excellent! All your active goals are progressing well. Keep up the great work!
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