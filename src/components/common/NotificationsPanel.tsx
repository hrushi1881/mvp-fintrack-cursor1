import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, Calendar, CreditCard, Target, Clock, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { useFinance } from '../../contexts/FinanceContext';
import { format, isToday, isYesterday, addDays } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: Date;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  const { transactions, goals, liabilities, budgets } = useFinance();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Generate notifications based on financial data
  useEffect(() => {
    if (!isOpen) return;

    const generatedNotifications: Notification[] = [];
    const now = new Date();

    // Check for upcoming bill payments (liabilities)
    liabilities.forEach(liability => {
      const dueDate = new Date(liability.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 7 && daysUntilDue >= 0) {
        generatedNotifications.push({
          id: `liability_${liability.id}`,
          title: 'Upcoming Payment',
          message: `${liability.name} payment of $${liability.monthlyPayment.toLocaleString()} is due in ${daysUntilDue} days.`,
          type: daysUntilDue <= 2 ? 'warning' : 'info',
          read: false,
          createdAt: new Date(now.getTime() - (7 - daysUntilDue) * 24 * 60 * 60 * 1000)
        });
      }
    });

    // Check for budget alerts
    budgets.forEach(budget => {
      const utilization = (budget.spent / budget.amount) * 100;
      if (utilization >= 90) {
        generatedNotifications.push({
          id: `budget_${budget.id}`,
          title: 'Budget Alert',
          message: `Your ${budget.category} budget is at ${utilization.toFixed(0)}% of its limit.`,
          type: utilization >= 100 ? 'error' : 'warning',
          read: false,
          createdAt: new Date(now.getTime() - Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000)
        });
      }
    });

    // Check for goal milestones
    goals.forEach(goal => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      if (progress >= 25 && progress < 30) {
        generatedNotifications.push({
          id: `goal_25_${goal.id}`,
          title: 'Goal Progress',
          message: `You've reached 25% of your ${goal.title} goal!`,
          type: 'success',
          read: false,
          createdAt: new Date(now.getTime() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000)
        });
      } else if (progress >= 50 && progress < 55) {
        generatedNotifications.push({
          id: `goal_50_${goal.id}`,
          title: 'Goal Progress',
          message: `You're halfway to your ${goal.title} goal!`,
          type: 'success',
          read: false,
          createdAt: new Date(now.getTime() - Math.floor(Math.random() * 4) * 24 * 60 * 60 * 1000)
        });
      } else if (progress >= 75 && progress < 80) {
        generatedNotifications.push({
          id: `goal_75_${goal.id}`,
          title: 'Goal Progress',
          message: `You're 75% of the way to your ${goal.title} goal!`,
          type: 'success',
          read: false,
          createdAt: new Date(now.getTime() - Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000)
        });
      } else if (progress >= 100) {
        generatedNotifications.push({
          id: `goal_complete_${goal.id}`,
          title: 'Goal Achieved!',
          message: `Congratulations! You've reached your ${goal.title} goal!`,
          type: 'success',
          read: false,
          createdAt: new Date(now.getTime() - Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000)
        });
      }
    });

    // Add some system notifications
    generatedNotifications.push({
      id: 'welcome',
      title: 'Welcome to Finspire',
      message: 'Start tracking your finances and achieve your financial goals!',
      type: 'info',
      read: true,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    });

    if (transactions.length > 0) {
      const lastTransaction = transactions[0];
      generatedNotifications.push({
        id: `transaction_${lastTransaction.id}`,
        title: 'Transaction Recorded',
        message: `Your ${lastTransaction.type} of $${lastTransaction.amount.toLocaleString()} for ${lastTransaction.description} has been recorded.`,
        type: 'success',
        read: true,
        createdAt: new Date(lastTransaction.date)
      });
    }

    // Add a tip notification
    generatedNotifications.push({
      id: 'tip_1',
      title: 'Financial Tip',
      message: 'Setting up automatic savings can help you reach your goals faster.',
      type: 'info',
      read: false,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    });

    // Add AI insight notification
    generatedNotifications.push({
      id: 'ai_insight_1',
      title: 'AI Financial Insight',
      message: 'Based on your spending patterns, you could save $120 monthly by reducing dining out expenses.',
      type: 'info',
      read: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
    });

    // Sort notifications by date (newest first)
    const sortedNotifications = generatedNotifications.sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );

    setNotifications(sortedNotifications);
    setUnreadCount(sortedNotifications.filter(n => !n.read).length);
  }, [isOpen, liabilities, budgets, goals, transactions]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
    setUnreadCount(0);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const deleteNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleGenerateAiInsights = async () => {
    setIsAiGenerating(true);
    
    // Simulate AI generating insights
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Add new AI-generated notifications
    const now = new Date();
    const newNotifications = [
      {
        id: `ai_insight_${Date.now()}_1`,
        title: 'AI Spending Analysis',
        message: 'Your spending on entertainment has increased by 15% compared to last month. Consider setting a budget for this category.',
        type: 'info' as const,
        read: false,
        createdAt: now
      },
      {
        id: `ai_insight_${Date.now()}_2`,
        title: 'Savings Opportunity',
        message: 'Based on your income and expenses, you could increase your monthly savings by $200 by optimizing your grocery spending.',
        type: 'info' as const,
        read: false,
        createdAt: now
      },
      {
        id: `ai_insight_${Date.now()}_3`,
        title: 'Investment Suggestion',
        message: 'You have sufficient emergency savings. Consider investing some of your excess cash for long-term growth.',
        type: 'info' as const,
        read: false,
        createdAt: now
      }
    ];
    
    setNotifications(prev => [...newNotifications, ...prev]);
    setUnreadCount(prev => prev + newNotifications.length);
    setIsAiGenerating(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} className="text-success-400" />;
      case 'warning':
        return <AlertCircle size={16} className="text-warning-400" />;
      case 'error':
        return <AlertCircle size={16} className="text-error-400" />;
      case 'info':
      default:
        return <Info size={16} className="text-primary-400" />;
    }
  };

  const getNotificationTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-success-500/20 border-success-500/30';
      case 'warning':
        return 'bg-warning-500/20 border-warning-500/30';
      case 'error':
        return 'bg-error-500/20 border-error-500/30';
      case 'info':
      default:
        return 'bg-primary-500/20 border-primary-500/30';
    }
  };

  const formatNotificationDate = (date: Date) => {
    if (isToday(date)) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, 'h:mm a')}`;
    } else if (date > addDays(new Date(), -7)) {
      return format(date, 'EEEE, h:mm a');
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative w-full max-w-md h-full bg-black/90 backdrop-blur-md border-l border-white/10 overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell size={20} className="text-primary-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
              <p className="text-xs text-gray-400">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary-400 hover:text-primary-300 font-medium"
              >
                Mark all as read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* AI Insights Button */}
        <div className="p-3 border-b border-white/10 bg-black/30">
          <Button
            onClick={handleGenerateAiInsights}
            fullWidth
            variant="outline"
            className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
            loading={isAiGenerating}
            icon={<Sparkles size={16} />}
          >
            Generate AI Financial Insights
          </Button>
        </div>
        
        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Bell size={48} className="text-gray-600 mb-4" />
              <p className="text-gray-400 font-medium">No notifications</p>
              <p className="text-sm text-gray-500 mt-2">
                You're all caught up! We'll notify you of important updates.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 hover:bg-white/5 transition-colors relative ${
                    !notification.read ? 'bg-black/40' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  {!notification.read && (
                    <div className="absolute left-4 top-4 w-2 h-2 rounded-full bg-primary-500"></div>
                  )}
                  
                  <div className="flex space-x-3 ml-4">
                    <div className={`p-2 rounded-lg ${getNotificationTypeStyles(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-white text-sm">{notification.title}</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          <X size={14} className="text-gray-500" />
                        </button>
                      </div>
                      
                      <p className="text-gray-400 text-sm mt-1">{notification.message}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatNotificationDate(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/50">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};