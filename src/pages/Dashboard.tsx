import React, { useState } from 'react';
import { DollarSign, TrendingUp, Wallet, CreditCard, Plus, Minus, Target, Receipt, Search, Bell, Calendar, BarChart3, Users, Zap, History, Repeat, RefreshCw, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/common/Modal';
import { GoalForm } from '../components/forms/GoalForm';
import { LiabilityForm } from '../components/forms/LiabilityForm';
import { RecurringTransactionForm } from '../components/forms/RecurringTransactionForm';
import { QuickActions } from '../components/common/QuickActions';
import { SearchAndFilter } from '../components/common/SearchAndFilter';
import { PageNavigation } from '../components/layout/PageNavigation';
import { CollapsibleHeader } from '../components/layout/CollapsibleHeader';
import { LiveExchangeRateWidget } from '../components/common/LiveExchangeRateWidget';
import { NotificationsPanel } from '../components/common/NotificationsPanel';
import { ProfileMenu } from '../components/common/ProfileMenu';
import { MultipleIncomeManager } from '../components/dashboard/MultipleIncomeManager';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { Button } from '../components/common/Button';
import { FinancialForecast } from '../components/dashboard/FinancialForecast';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, getDashboardComponents, shouldShowTutorial } = usePersonalization();
  const { stats, transactions, addGoal, addLiability, addTransaction, addRecurringTransaction, loading, getMonthlyTrends } = useFinance();
  const { formatCurrency } = useInternationalization();
  const { t } = useTranslation();
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showLiabilityModal, setShowLiabilityModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState(transactions);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showForecast, setShowForecast] = useState(false);

  const handleAddGoal = async (goal: any) => {
    try {
      await addGoal(goal);
      setShowGoalModal(false);
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const handleAddLiability = async (liability: any, addAsIncome: boolean) => {
    try {
      await addLiability(liability);
      if (addAsIncome && liability.type !== 'purchase') {
        await addTransaction({
          type: 'income',
          amount: liability.totalAmount,
          category: 'Loan',
          description: `Loan received: ${liability.name}`,
          date: new Date(),
        });
      }
      setShowLiabilityModal(false);
    } catch (error) {
      console.error('Error adding liability:', error);
    }
  };

  const handleAddRecurringTransaction = async (data: any) => {
    try {
      await addRecurringTransaction(data);
      setShowRecurringModal(false);
    } catch (error) {
      console.error('Error adding recurring transaction:', error);
    }
  };

  const netWorth = stats.totalIncome - stats.totalExpenses - stats.totalLiabilities;
  const financialHealthScore = Math.min(Math.max(((netWorth / 10000) * 100) + 500, 0), 1000);

  // Show welcome message for new users
  const isNewUser = transactions.length === 0;
  const dashboardComponents = getDashboardComponents();
  const showTutorial = shouldShowTutorial('dashboard');

  // Get monthly trends for mini chart
  const monthlyTrends = getMonthlyTrends(3);
  const currentMonthNet = monthlyTrends[monthlyTrends.length - 1]?.net || 0;
  const previousMonthNet = monthlyTrends[monthlyTrends.length - 2]?.net || 0;
  const netChange = currentMonthNet - previousMonthNet;
  const netChangePercentage = previousMonthNet !== 0 ? (netChange / Math.abs(previousMonthNet)) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen text-white pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-20">
      {/* Collapsible Header */}
      <CollapsibleHeader>
        <div className="px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {t('app_name')}
              </h1>
              <p className="text-xs sm:text-sm text-gray-400">
                {t('welcome_back', { userName: user?.name?.split(' ')[0] || 'User' })}
              </p>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <Search size={18} className="text-gray-300 sm:w-5 sm:h-5" />
              </button>
              
              <button 
                onClick={() => navigate('/transaction-history')}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                title={t('history')}
              >
                <History size={18} className="text-gray-300 sm:w-5 sm:h-5" />
              </button>
              
              <button 
                onClick={() => setShowRecurringModal(true)}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                title="Recurring Transactions"
              >
                <Repeat size={18} className="text-gray-300 sm:w-5 sm:h-5" />
              </button>
              
              <button 
                onClick={() => setShowNotifications(true)}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors relative"
              >
                <Bell size={18} className="text-gray-300 sm:w-5 sm:h-5" />
                {isNewUser && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 sm:h-3 sm:w-3 bg-primary-500 rounded-full"></span>
                )}
              </button>
              
              <button 
                onClick={() => setShowProfileMenu(true)}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-500 rounded-full flex items-center justify-center"
              >
                <span className="text-xs sm:text-sm font-medium text-white">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </button>
            </div>
          </div>

          {/* Page Navigation */}
          <PageNavigation />
        </div>
      </CollapsibleHeader>
      
      {/* Main Content with top padding to account for fixed header */}
      <div className="pt-32 sm:pt-36 px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Search */}
        {showSearch && (
          <SearchAndFilter
            onResults={setSearchResults}
            placeholder="Search transactions, goals, or categories..."
          />
        )}

        {/* Welcome Message for New Users */}
        {isNewUser && (
          <div className="bg-gradient-to-r from-primary-600/80 to-primary-800/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-primary-500/20">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Users size={24} className="text-primary-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Welcome to your personalized Finspire! 🎉
                </h3>
                <p className="text-primary-100 text-sm mb-4">
                  Based on your profile as a {settings.userTypes.join(' and ')}, we've customized your dashboard 
                  to focus on {settings.primaryFocus.slice(0, 2).join(' and ')}. 
                  {showTutorial && ' Take a quick tour to get started!'}
                </p>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  {showTutorial && (
                    <button
                      onClick={() => {/* Start tutorial */}}
                      className="bg-yellow-500 text-yellow-900 py-2 px-4 rounded-lg font-medium hover:bg-yellow-400 transition-colors text-sm flex items-center justify-center"
                    >
                      <span className="mr-2">📚</span>
                      Quick Tour
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/add-transaction')}
                    className="bg-white text-primary-600 py-2 px-4 rounded-lg font-medium hover:bg-primary-50 transition-colors text-sm flex items-center justify-center"
                  >
                    <Plus size={16} className="mr-2" />
                    Add First Transaction
                  </button>
                  <button
                    onClick={() => setShowGoalModal(true)}
                    className="border border-white/30 text-white py-2 px-4 rounded-lg font-medium hover:bg-white/10 transition-colors text-sm flex items-center justify-center"
                  >
                    <Target size={16} className="mr-2" />
                    Set a Goal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Financial Health Card */}
        <div className="bg-gradient-to-br from-blue-600/80 to-blue-800/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 relative overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
          <div className="relative z-10">
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm sm:text-base font-medium">{t('dashboard.net_worth')}</span>
                {!isNewUser && (
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs sm:text-sm flex items-center ${
                      netChange >= 0 ? 'text-success-400' : 'text-error-400'
                    }`}>
                      {netChange >= 0 ? (
                        <TrendingUp size={12} className="mr-1 sm:w-3.5 sm:h-3.5" />
                      ) : (
                        <TrendingUp size={12} className="mr-1 sm:w-3.5 sm:h-3.5 rotate-180" />
                      )}
                      {Math.abs(netChangePercentage).toFixed(1)}% {t('dashboard.vs_last_month')}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-3xl sm:text-5xl font-bold text-white mb-2">
                {formatCurrency(netWorth)}
              </p>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-200 text-xs sm:text-sm">{t('dashboard.health_score')}:</span>
                  <span className="text-white text-sm sm:text-base font-semibold">
                    {Math.round(financialHealthScore)}/1000
                  </span>
                </div>
                <span className="text-blue-200 text-xs">
                  {financialHealthScore >= 750 ? t('dashboard.excellent') : 
                   financialHealthScore >= 500 ? t('dashboard.good') : 
                   isNewUser ? t('dashboard.getting_started') : t('dashboard.needs_work')}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => navigate('/add-transaction')}
                className="flex-1 bg-white text-blue-600 py-2.5 sm:py-3 px-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-sm sm:text-base flex items-center justify-center"
              >
                <Zap size={16} className="mr-2" />
                {t('quick_add')}
              </button>
              <button 
                onClick={() => navigate('/transaction-history')}
                className="flex-1 border border-white/30 text-white py-2.5 sm:py-3 px-4 rounded-xl font-semibold hover:bg-white/10 transition-colors text-sm sm:text-base flex items-center justify-center"
              >
                <History size={16} className="mr-2" />
                {t('history')}
              </button>
            </div>
          </div>
        </div>

        {/* AI Financial Forecast Button */}
        {dashboardComponents.includes('ai_forecast') && (
          <Button
            onClick={() => setShowForecast(!showForecast)}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 py-3"
          >
            <Zap size={18} className="mr-2" />
            {showForecast ? 'Hide AI Financial Forecast' : 'Show AI Financial Forecast'}
          </Button>
        )}

        {/* AI Financial Forecast */}
        {showForecast && <FinancialForecast />}

        {/* Multiple Income Sources */}
        <MultipleIncomeManager />

        {/* Quick Stats Cards */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-white">{t('dashboard.financial_overview')}</h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/10 hover:bg-black/30 transition-colors">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-success-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} className="text-success-400 sm:w-5 sm:h-5" />
                </div>
                <span className="text-xs text-gray-400">{t('dashboard.this_month')}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mb-1">{t('dashboard.income')}</p>
              <p className="text-base sm:text-xl font-bold text-white">
                {formatCurrency(stats.monthlyIncome)}
              </p>
            </div>

            <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/10 hover:bg-black/30 transition-colors">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-error-500/20 rounded-lg flex items-center justify-center">
                  <Receipt size={16} className="text-error-400 sm:w-5 sm:h-5" />
                </div>
                <span className="text-xs text-gray-400">{t('dashboard.this_month')}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mb-1">{t('dashboard.expenses')}</p>
              <p className="text-base sm:text-xl font-bold text-white">
                {formatCurrency(stats.monthlyExpenses)}
              </p>
            </div>

            <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/10 hover:bg-black/30 transition-colors">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-warning-500/20 rounded-lg flex items-center justify-center">
                  <CreditCard size={16} className="text-warning-400 sm:w-5 sm:h-5" />
                </div>
                <span className="text-xs text-gray-400">{t('dashboard.total_debt')}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mb-1">Liabilities</p>
              <p className="text-base sm:text-xl font-bold text-white">
                {formatCurrency(stats.totalLiabilities)}
              </p>
            </div>

            <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/10 hover:bg-black/30 transition-colors">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <Target size={16} className="text-primary-400 sm:w-5 sm:h-5" />
                </div>
                <span className="text-xs text-gray-400">{t('dashboard.saved')}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mb-1">{t('dashboard.goal_progress')}</p>
              <p className="text-base sm:text-xl font-bold text-white">
                {formatCurrency(stats.totalSavings)}
              </p>
            </div>
          </div>
        </div>

        {/* Live Exchange Rates Widget */}
        <LiveExchangeRateWidget />

        {/* Quick Actions */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-white">{t('dashboard.quick_actions')}</h3>
          <QuickActions
            onAddGoal={() => setShowGoalModal(true)}
            onAddLiability={() => setShowLiabilityModal(true)}
            compact={true}
          />
        </div>

        {/* Recent Activity */}
        {transactions.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-white">{t('dashboard.recent_activity')}</h3>
              <button 
                onClick={() => navigate('/transaction-history')}
                className="text-primary-400 text-xs sm:text-sm font-medium hover:text-primary-300"
              >
                {t('dashboard.view_all')}
              </button>
            </div>
            
            <div className="space-y-3">
              {(showSearch ? searchResults : transactions).slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 sm:p-4 bg-black/20 backdrop-blur-md rounded-xl hover:bg-black/30 transition-colors border border-white/10"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'income' 
                        ? 'bg-success-500/20' 
                        : 'bg-error-500/20'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp size={14} className="text-success-400 sm:w-4 sm:h-4" />
                      ) : (
                        <Receipt size={14} className="text-error-400 sm:w-4 sm:h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm sm:text-base">
                        {transaction.description}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400">
                        {transaction.category} • {transaction.date.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-semibold text-sm sm:text-base ${
                      transaction.type === 'income' 
                        ? 'text-success-400' 
                        : 'text-error-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financial Insights */}
        {!isNewUser && monthlyTrends.length > 0 && (
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4">{t('dashboard.monthly_insights')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">This Month</p>
                <p className={`text-lg font-bold ${currentMonthNet >= 0 ? 'text-success-400' : 'text-error-400'}`}>
                  {formatCurrency(Math.abs(currentMonthNet))}
                </p>
                <p className="text-xs text-gray-500">
                  {currentMonthNet >= 0 ? t('dashboard.surplus') : t('dashboard.deficit')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">{t('dashboard.change')}</p>
                <p className={`text-lg font-bold ${netChange >= 0 ? 'text-success-400' : 'text-error-400'}`}>
                  {netChange >= 0 ? '+' : ''}{formatCurrency(netChange)}
                </p>
                <p className="text-xs text-gray-500">
                  {Math.abs(netChangePercentage).toFixed(1)}% {t('dashboard.vs_last_month')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">{t('dashboard.budget_usage')}</p>
                <p className={`text-lg font-bold ${
                  stats.budgetUtilization > 90 ? 'text-error-400' : 
                  stats.budgetUtilization > 75 ? 'text-warning-400' : 'text-success-400'
                }`}>
                  {stats.budgetUtilization.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500">
                  {t('dashboard.average_across_budgets')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        title="Create New Goal"
      >
        <GoalForm
          onSubmit={handleAddGoal}
          onCancel={() => setShowGoalModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showLiabilityModal}
        onClose={() => setShowLiabilityModal(false)}
        title="Add New Liability"
      >
        <LiabilityForm
          onSubmit={handleAddLiability}
          onCancel={() => setShowLiabilityModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
        title="Create Recurring Transaction"
      >
        <RecurringTransactionForm
          onSubmit={handleAddRecurringTransaction}
          onCancel={() => setShowRecurringModal(false)}
        />
      </Modal>

      {/* Notifications Panel */}
      <NotificationsPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />

      {/* Profile Menu */}
      <ProfileMenu 
        isOpen={showProfileMenu} 
        onClose={() => setShowProfileMenu(false)}
        onOpenNotifications={() => {
          setShowNotifications(true);
          setShowProfileMenu(false);
        }}
      />
    </div>
  );
};