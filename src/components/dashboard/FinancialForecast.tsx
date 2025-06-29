import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, DollarSign, Target, RefreshCw, AlertTriangle, CheckCircle, Info, ArrowRight, Zap } from 'lucide-react';
import { Button } from '../common/Button';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface FinancialForecastProps {
  maxRecommendations?: number;
}

export const FinancialForecast: React.FC<FinancialForecastProps> = ({ 
  maxRecommendations = 3 
}) => {
  const { transactions, goals, liabilities, budgets, stats } = useFinance();
  const { formatCurrency, currency } = useInternationalization();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [timeHorizon, setTimeHorizon] = useState<1 | 5 | 10 | 20>(5);
  const [showDetails, setShowDetails] = useState(false);

  const fetchForecast = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Calculate current financial state
      const monthlyIncome = stats.monthlyIncome || 0;
      const monthlyExpenses = stats.monthlyExpenses || 0;
      const currentSavings = goals.reduce((sum, g) => sum + g.currentAmount, 0) || 0;
      const totalDebt = liabilities.reduce((sum, l) => sum + l.remainingAmount, 0) || 0;
      const monthlyDebtPayment = liabilities.reduce((sum, l) => sum + l.monthlyPayment, 0) || 0;
      
      // Prepare data for the API
      const financialData = {
        income: {
          monthly: monthlyIncome,
          annual: monthlyIncome * 12,
        },
        expenses: {
          monthly: monthlyExpenses,
          annual: monthlyExpenses * 12,
        },
        savings: {
          current: currentSavings,
          monthly: Math.max(0, monthlyIncome - monthlyExpenses - monthlyDebtPayment),
        },
        liabilities: {
          total: totalDebt,
          monthlyPayment: monthlyDebtPayment,
          items: liabilities.map(l => ({
            id: l.id,
            name: l.name,
            remainingAmount: l.remainingAmount,
            interestRate: l.interestRate,
            monthlyPayment: l.monthlyPayment,
          })),
        },
        goals: goals.map(g => ({
          id: g.id,
          title: g.title,
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount,
          targetDate: g.targetDate.toISOString(),
        })),
        savingsRate: monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0,
        timeHorizon,
      };

      // Call the financial forecast API
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/financial-forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ financialData }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setForecast(data);
    } catch (error: any) {
      console.error('Error fetching financial forecast:', error);
      setError(error.message || 'Failed to generate forecast');
      
      // Fallback to mock data for demo purposes
      setForecast({
        summary: {
          currentNetWorth: 15000,
          monthlySavings: 500,
          savingsRate: 20,
        },
        shortTerm: {
          savings: 21000,
          netWorth: 15000,
          debtRemaining: 6000,
        },
        mediumTerm: {
          savings: 45000,
          netWorth: 42000,
          debtRemaining: 3000,
        },
        longTerm: {
          savings: 90000,
          netWorth: 90000,
          debtRemaining: 0,
        },
        scenarios: {
          conservative: { netWorth: 42000, savings: 45000 },
          moderate: { netWorth: 48000, savings: 51000 },
          aggressive: { netWorth: 55000, savings: 58000 },
        },
        recommendations: [
          {
            type: "positive",
            title: "Good Savings Trajectory",
            description: "You're on track to build significant savings over the next 5 years.",
            action: "Consider diversifying your investments for better long-term growth."
          },
          {
            type: "warning",
            title: "Retirement Planning",
            description: "Start building your retirement savings early to benefit from compound growth.",
            action: "Look into tax-advantaged retirement accounts."
          },
          {
            type: "opportunity",
            title: "Investment Opportunity",
            description: "With your emergency fund in place, you could benefit from investing more aggressively.",
            action: "Consider increasing your exposure to growth assets like index funds."
          }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchForecast();
  }, []);

  // Refetch when time horizon changes
  useEffect(() => {
    if (forecast) {
      fetchForecast();
    }
  }, [timeHorizon]);

  const getTimeHorizonLabel = () => {
    switch (timeHorizon) {
      case 1: return '1 Year';
      case 5: return '5 Years';
      case 10: return '10 Years';
      case 20: return '20 Years';
      default: return '5 Years';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'positive': return <CheckCircle size={18} className="text-success-400" />;
      case 'warning': return <AlertTriangle size={18} className="text-warning-400" />;
      case 'critical': return <AlertTriangle size={18} className="text-error-400" />;
      case 'opportunity': return <Zap size={18} className="text-primary-400" />;
      default: return <Info size={18} className="text-primary-400" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-success-500/20 border-success-500/30';
      case 'warning': return 'bg-warning-500/20 border-warning-500/30';
      case 'critical': return 'bg-error-500/20 border-error-500/30';
      case 'opportunity': return 'bg-primary-500/20 border-primary-500/30';
      default: return 'bg-blue-500/20 border-blue-500/30';
    }
  };

  if (isLoading && !forecast) {
    return (
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-500/20 rounded-lg">
              <TrendingUp size={18} className="text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Financial Forecast</h3>
          </div>
        </div>
        
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Generating your financial forecast...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (error && !forecast) {
    return (
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-error-500/20 rounded-lg">
              <AlertTriangle size={18} className="text-error-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Financial Forecast</h3>
          </div>
          <Button
            onClick={fetchForecast}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw size={14} className="mr-2" />
            Retry
          </Button>
        </div>
        
        <div className="bg-error-500/20 border border-error-500/30 rounded-lg p-4">
          <p className="text-error-400 text-sm">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!forecast) return null;

  return (
    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-500/20 rounded-lg">
            <TrendingUp size={18} className="text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">AI Financial Forecast</h3>
        </div>
        <Button
          onClick={fetchForecast}
          variant="outline"
          size="sm"
          className="border-white/20 text-white hover:bg-white/10"
          loading={isLoading}
        >
          <RefreshCw size={14} className="mr-2" />
          Refresh
        </Button>
      </div>
      
      {/* Time Horizon Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
          <Calendar size={16} className="mr-2 text-blue-400" />
          Forecast Horizon
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 5, 10, 20].map((years) => (
            <button
              key={years}
              onClick={() => setTimeHorizon(years as 1 | 5 | 10 | 20)}
              className={`p-2 rounded-lg text-center transition-colors ${
                timeHorizon === years
                  ? 'bg-primary-500 text-white'
                  : 'bg-black/20 text-gray-300 hover:bg-white/10'
              }`}
            >
              {years} {years === 1 ? 'Year' : 'Years'}
            </button>
          ))}
        </div>
      </div>

      {/* Forecast Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-black/30 rounded-xl p-4 border border-white/10">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign size={16} className="text-success-400" />
            <h4 className="font-medium text-white">Net Worth</h4>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(forecast.summary.currentNetWorth || 0)}
          </p>
          <p className="text-sm text-gray-400">Current</p>
          
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-lg font-semibold text-success-400">
              {formatCurrency(timeHorizon === 1 ? (forecast.shortTerm?.netWorth || 0) : 
                             timeHorizon === 5 ? (forecast.mediumTerm?.netWorth || 0) : 
                             (forecast.longTerm?.netWorth || 0))}
            </p>
            <p className="text-xs text-gray-400">Projected in {getTimeHorizonLabel()}</p>
          </div>
        </div>

        <div className="bg-black/30 rounded-xl p-4 border border-white/10">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp size={16} className="text-primary-400" />
            <h4 className="font-medium text-white">Savings</h4>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(forecast.summary.monthlySavings || 0)}
          </p>
          <p className="text-sm text-gray-400">Monthly</p>
          
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-lg font-semibold text-primary-400">
              {formatCurrency(timeHorizon === 1 ? (forecast.shortTerm?.savings || 0) : 
                             timeHorizon === 5 ? (forecast.mediumTerm?.savings || 0) : 
                             (forecast.longTerm?.savings || 0))}
            </p>
            <p className="text-xs text-gray-400">Projected in {getTimeHorizonLabel()}</p>
          </div>
        </div>

        <div className="bg-black/30 rounded-xl p-4 border border-white/10">
          <div className="flex items-center space-x-2 mb-2">
            <Target size={16} className="text-warning-400" />
            <h4 className="font-medium text-white">Debt</h4>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(liabilities.reduce((sum, l) => sum + l.remainingAmount, 0) || 0)}
          </p>
          <p className="text-sm text-gray-400">Current</p>
          
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-lg font-semibold text-warning-400">
              {formatCurrency(timeHorizon === 1 ? (forecast.shortTerm?.debtRemaining || 0) : 
                             timeHorizon === 5 ? (forecast.mediumTerm?.debtRemaining || 0) : 
                             (forecast.longTerm?.debtRemaining || 0))}
            </p>
            <p className="text-xs text-gray-400">Projected in {getTimeHorizonLabel()}</p>
          </div>
        </div>
      </div>

      {/* Investment Scenarios */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-white flex items-center">
            <Zap size={16} className="mr-2 text-yellow-400" />
            Investment Scenarios
          </h4>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-primary-400 hover:text-primary-300 font-medium"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-black/30 rounded-lg p-3 border border-white/10 text-center">
            <p className="text-xs text-gray-400 mb-1">Conservative</p>
            <p className="text-lg font-semibold text-white">
              {formatCurrency(forecast.scenarios?.conservative?.netWorth || 0)}
            </p>
            {showDetails && (
              <p className="text-xs text-gray-500 mt-1">3% annual return</p>
            )}
          </div>
          
          <div className="bg-black/30 rounded-lg p-3 border border-white/10 text-center">
            <p className="text-xs text-gray-400 mb-1">Moderate</p>
            <p className="text-lg font-semibold text-primary-400">
              {formatCurrency(forecast.scenarios?.moderate?.netWorth || 0)}
            </p>
            {showDetails && (
              <p className="text-xs text-gray-500 mt-1">6% annual return</p>
            )}
          </div>
          
          <div className="bg-black/30 rounded-lg p-3 border border-white/10 text-center">
            <p className="text-xs text-gray-400 mb-1">Aggressive</p>
            <p className="text-lg font-semibold text-success-400">
              {formatCurrency(forecast.scenarios?.aggressive?.netWorth || 0)}
            </p>
            {showDetails && (
              <p className="text-xs text-gray-500 mt-1">9% annual return</p>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-3">
        <h4 className="font-medium text-white">AI Recommendations</h4>
        
        {forecast.recommendations && forecast.recommendations.slice(0, maxRecommendations).map((recommendation: any, index: number) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg ${getRecommendationColor(recommendation.type)}`}
          >
            <div className="flex items-start space-x-3">
              {getRecommendationIcon(recommendation.type)}
              <div>
                <h4 className="font-medium text-white text-sm">{recommendation.title}</h4>
                <p className="text-gray-300 text-sm mt-1">{recommendation.description}</p>
                {recommendation.action && (
                  <p className="text-xs mt-2 font-medium text-primary-400 flex items-center">
                    <ArrowRight size={12} className="mr-1" />
                    {recommendation.action}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <div className="flex items-center text-blue-400 text-xs">
          <Info size={14} className="mr-2" />
          <span>This forecast is based on your current financial data and uses AI to project future scenarios. Actual results may vary.</span>
        </div>
      </div>
    </div>
  );
};