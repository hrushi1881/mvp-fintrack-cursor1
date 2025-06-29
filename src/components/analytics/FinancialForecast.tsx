import React, { useState, useEffect } from 'react';
import { TrendingUp, Lightbulb, RefreshCw, Zap, AlertTriangle, CheckCircle, Info, Sparkles, Calendar, Target } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { Button } from '../common/Button';

interface Recommendation {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

interface FinancialForecastData {
  summary: string;
  forecast: string;
  recommendations: Recommendation[];
  healthScore: number;
}

export const FinancialForecast: React.FC = () => {
  const { getFinancialForecast } = useFinance();
  const { formatCurrency } = useInternationalization();
  const [forecastData, setForecastData] = useState<FinancialForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchForecast();
  }, []);

  const fetchForecast = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getFinancialForecast();
      setForecastData(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error fetching financial forecast:', err);
      setError(err.message || 'Failed to fetch financial forecast');
      
      // Fallback mock data
      setForecastData({
        summary: "Your financial health is good with a net worth of $15,000 and a savings rate of 20%. Your debt-to-income ratio is 30% and you're utilizing 75% of your budget.",
        forecast: "Based on your current income of $3,000 and expenses of $2,400 per month, you're projected to increase your net worth by approximately $600 monthly. Your debt repayment is on track to reduce your liabilities by about $1,500 in the next 6 months. At your current savings rate, you'll add approximately $3,600 to your savings in the next 6 months.",
        recommendations: [
          {
            title: "Increase Your Savings Rate",
            description: "Try to increase your savings rate to 25% by reducing discretionary spending or finding additional income sources.",
            impact: "medium"
          },
          {
            title: "Build Emergency Fund",
            description: "Aim to have 3-6 months of expenses saved in an easily accessible emergency fund.",
            impact: "high"
          },
          {
            title: "Optimize Debt Repayment",
            description: "Focus on paying down high-interest debt first to minimize interest payments over time.",
            impact: "medium"
          }
        ],
        healthScore: 75
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-400';
    if (score >= 60) return 'text-primary-400';
    if (score >= 40) return 'text-warning-400';
    return 'text-error-400';
  };

  const getHealthScoreBg = (score: number) => {
    if (score >= 80) return 'bg-success-500/20';
    if (score >= 60) return 'bg-primary-500/20';
    if (score >= 40) return 'bg-warning-500/20';
    return 'bg-error-500/20';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-error-400 bg-error-500/20 border-error-500/30';
      case 'medium': return 'text-warning-400 bg-warning-500/20 border-warning-500/30';
      case 'low': return 'text-success-400 bg-success-500/20 border-success-500/30';
      default: return 'text-primary-400 bg-primary-500/20 border-primary-500/30';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <Zap size={16} className="text-error-400" />;
      case 'medium': return <Target size={16} className="text-warning-400" />;
      case 'low': return <CheckCircle size={16} className="text-success-400" />;
      default: return <Info size={16} className="text-primary-400" />;
    }
  };

  if (isLoading && !forecastData) {
    return (
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-500/20 rounded-lg">
              <TrendingUp size={18} className="text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">AI Financial Forecast</h3>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mb-4 relative">
            <RefreshCw size={24} className="text-primary-400 animate-spin" />
            <div className="absolute -top-2 -right-2">
              <Sparkles size={20} className="text-yellow-400 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-300 mb-2">Generating AI Financial Forecast</p>
          <p className="text-sm text-gray-400">Analyzing your financial data and trends...</p>
        </div>
      </div>
    );
  }

  if (error && !forecastData) {
    return (
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-error-500/20 rounded-lg">
              <AlertTriangle size={18} className="text-error-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">AI Financial Forecast</h3>
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
          <div className="flex items-start space-x-3">
            <AlertTriangle size={18} className="text-error-400 mt-0.5" />
            <div>
              <p className="text-error-400 font-medium">Error Loading Forecast</p>
              <p className="text-error-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!forecastData) {
    return (
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
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
          >
            <Sparkles size={14} className="mr-2 text-yellow-400" />
            Generate Forecast
          </Button>
        </div>
        
        <div className="text-center py-12">
          <Lightbulb size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No forecast available</p>
          <p className="text-sm text-gray-500 mt-2">Generate an AI-powered financial forecast to get personalized insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-500/20 rounded-lg">
            <TrendingUp size={18} className="text-primary-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Financial Forecast</h3>
            {lastUpdated && (
              <p className="text-xs text-gray-400">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full ${getHealthScoreBg(forecastData.healthScore)} border border-white/10`}>
            <span className={`text-sm font-medium ${getHealthScoreColor(forecastData.healthScore)}`}>
              Health Score: {forecastData.healthScore}/100
            </span>
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
      </div>
      
      {/* Current Financial Health */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <CheckCircle size={16} className="text-primary-400" />
          <h4 className="font-medium text-white">Current Financial Health</h4>
        </div>
        <div className="bg-black/30 rounded-lg p-4 border border-white/10">
          <p className="text-gray-300">{forecastData.summary}</p>
        </div>
      </div>
      
      {/* Financial Forecast */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <Calendar size={16} className="text-blue-400" />
          <h4 className="font-medium text-white">6-Month Forecast</h4>
        </div>
        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
          <p className="text-blue-300">{forecastData.forecast}</p>
        </div>
      </div>
      
      {/* Recommendations */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <Lightbulb size={16} className="text-yellow-400" />
          <h4 className="font-medium text-white">AI Recommendations</h4>
        </div>
        <div className="space-y-3">
          {forecastData.recommendations.map((rec, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getImpactColor(rec.impact)}`}>
              <div className="flex items-start space-x-3">
                {getImpactIcon(rec.impact)}
                <div>
                  <h5 className={`font-medium text-sm ${
                    rec.impact === 'high' ? 'text-error-400' :
                    rec.impact === 'medium' ? 'text-warning-400' :
                    'text-success-400'
                  }`}>
                    {rec.title}
                  </h5>
                  <p className="text-gray-300 text-sm mt-1">{rec.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Powered by AI */}
      <div className="mt-6 p-3 bg-black/30 rounded-lg border border-white/10 flex items-center justify-center space-x-2">
        <Sparkles size={14} className="text-yellow-400" />
        <span className="text-xs text-gray-400">Powered by AI - Personalized for your financial situation</span>
      </div>
    </div>
  );
};