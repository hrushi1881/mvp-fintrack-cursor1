import React, { useState } from 'react';
import { Shield, Info, TrendingUp, TrendingDown, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';

export const FinancialHealthScore: React.FC = () => {
  const { stats } = useFinance();
  const { formatCurrency } = useInternationalization();
  const [showDetails, setShowDetails] = useState(false);

  // Calculate financial health score (0-1000)
  const calculateScore = () => {
    const netWorth = stats.totalIncome - stats.totalExpenses - stats.totalLiabilities;
    
    // Base score from net worth (0-600 points)
    let score = Math.min(Math.max(((netWorth / 10000) * 100) + 300, 0), 600);
    
    // Savings rate (0-200 points)
    const totalIncome = stats.totalIncome || 1; // Avoid division by zero
    const savingsRate = (stats.totalSavings / totalIncome) * 100;
    score += Math.min(savingsRate * 4, 200);
    
    // Debt-to-income ratio (0-200 points)
    const monthlyIncome = stats.monthlyIncome || 1; // Avoid division by zero
    const debtToIncomeRatio = stats.totalLiabilities / (monthlyIncome * 12);
    const debtScore = debtToIncomeRatio <= 0.36 ? 200 : 
                     debtToIncomeRatio <= 0.42 ? 150 :
                     debtToIncomeRatio <= 0.5 ? 100 :
                     debtToIncomeRatio <= 1 ? 50 : 0;
    score += debtScore;
    
    return Math.round(Math.min(score, 1000));
  };

  const score = calculateScore();
  
  // Determine score category
  const getScoreCategory = () => {
    if (score >= 800) return { label: 'Excellent', color: 'text-success-400', bg: 'bg-success-500/20' };
    if (score >= 650) return { label: 'Good', color: 'text-primary-400', bg: 'bg-primary-500/20' };
    if (score >= 500) return { label: 'Fair', color: 'text-warning-400', bg: 'bg-warning-500/20' };
    return { label: 'Needs Work', color: 'text-error-400', bg: 'bg-error-500/20' };
  };

  const scoreCategory = getScoreCategory();
  
  // Generate recommendations based on score
  const getRecommendations = () => {
    const recommendations = [];
    
    if (stats.totalSavings < stats.monthlyIncome * 3) {
      recommendations.push({
        title: 'Build Emergency Fund',
        description: 'Aim for 3-6 months of expenses in an emergency fund',
        icon: Shield,
        priority: 'high'
      });
    }
    
    if (stats.totalLiabilities > stats.monthlyIncome * 12) {
      recommendations.push({
        title: 'Reduce Debt',
        description: 'Focus on paying down high-interest debt',
        icon: TrendingDown,
        priority: 'high'
      });
    }
    
    if (stats.monthlyExpenses > stats.monthlyIncome * 0.7) {
      recommendations.push({
        title: 'Reduce Expenses',
        description: 'Try to keep expenses below 70% of your income',
        icon: TrendingDown,
        priority: 'medium'
      });
    }
    
    if (stats.totalSavings < stats.monthlyIncome * 6 && stats.totalSavings >= stats.monthlyIncome * 3) {
      recommendations.push({
        title: 'Increase Emergency Fund',
        description: 'Continue building your emergency fund to 6 months of expenses',
        icon: Shield,
        priority: 'medium'
      });
    }
    
    if (stats.monthlyIncome > 0 && stats.totalSavings / stats.monthlyIncome < 0.2) {
      recommendations.push({
        title: 'Increase Savings Rate',
        description: 'Try to save at least 20% of your income',
        icon: TrendingUp,
        priority: 'medium'
      });
    }
    
    // Add a default recommendation if none apply
    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Maintain Financial Health',
        description: 'Continue your good financial habits',
        icon: CheckCircle,
        priority: 'low'
      });
    }
    
    return recommendations;
  };

  const recommendations = getRecommendations();

  return (
    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <Shield size={20} className="text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Financial Health Score</h3>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Info size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Score Display */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-40 h-40 mb-4">
          {/* Background Circle */}
          <div className="absolute inset-0 rounded-full bg-black/30 border border-white/10"></div>
          
          {/* Progress Circle */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              fill="none" 
              stroke="rgba(255,255,255,0.1)" 
              strokeWidth="8" 
            />
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              fill="none" 
              stroke={score >= 800 ? '#22c55e' : score >= 650 ? '#3b82f6' : score >= 500 ? '#f59e0b' : '#ef4444'} 
              strokeWidth="8" 
              strokeDasharray="283" 
              strokeDashoffset={283 - (283 * score / 1000)}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          
          {/* Score Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white">{score}</span>
            <span className={`text-sm font-medium ${scoreCategory.color}`}>{scoreCategory.label}</span>
          </div>
        </div>
        
        {/* Score Range */}
        <div className="w-full flex justify-between text-xs text-gray-400 mb-2">
          <span>0</span>
          <span>250</span>
          <span>500</span>
          <span>750</span>
          <span>1000</span>
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full mb-1">
          <div 
            className={`h-1 rounded-full ${
              score >= 800 ? 'bg-success-500' : 
              score >= 650 ? 'bg-primary-500' : 
              score >= 500 ? 'bg-warning-500' : 
              'bg-error-500'
            }`}
            style={{ width: `${score / 10}%` }}
          ></div>
        </div>
      </div>

      {/* Score Details */}
      {showDetails && (
        <div className="mb-6 space-y-4">
          <h4 className="font-medium text-white">Score Breakdown</h4>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-black/30 p-3 rounded-lg">
              <p className="text-gray-400 mb-1">Net Worth</p>
              <p className="font-medium text-white">{formatCurrency(stats.totalIncome - stats.totalExpenses - stats.totalLiabilities)}</p>
            </div>
            
            <div className="bg-black/30 p-3 rounded-lg">
              <p className="text-gray-400 mb-1">Savings Rate</p>
              <p className="font-medium text-white">
                {stats.totalIncome > 0 ? ((stats.totalSavings / stats.totalIncome) * 100).toFixed(1) : 0}%
              </p>
            </div>
            
            <div className="bg-black/30 p-3 rounded-lg">
              <p className="text-gray-400 mb-1">Debt-to-Income</p>
              <p className="font-medium text-white">
                {stats.monthlyIncome > 0 ? ((stats.totalLiabilities / (stats.monthlyIncome * 12)) * 100).toFixed(1) : 0}%
              </p>
            </div>
            
            <div className="bg-black/30 p-3 rounded-lg">
              <p className="text-gray-400 mb-1">Monthly Savings</p>
              <p className="font-medium text-white">
                {formatCurrency(Math.max(0, stats.monthlyIncome - stats.monthlyExpenses))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="space-y-3">
        <h4 className="font-medium text-white mb-2">Recommendations</h4>
        
        {recommendations.map((rec, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg border ${
              rec.priority === 'high' ? 'bg-error-500/10 border-error-500/30' :
              rec.priority === 'medium' ? 'bg-warning-500/10 border-warning-500/30' :
              'bg-success-500/10 border-success-500/30'
            }`}
          >
            <div className="flex items-start space-x-3">
              <rec.icon size={16} className={`mt-0.5 ${
                rec.priority === 'high' ? 'text-error-400' :
                rec.priority === 'medium' ? 'text-warning-400' :
                'text-success-400'
              }`} />
              <div>
                <p className={`font-medium text-sm ${
                  rec.priority === 'high' ? 'text-error-400' :
                  rec.priority === 'medium' ? 'text-warning-400' :
                  'text-success-400'
                }`}>
                  {rec.title}
                </p>
                <p className="text-xs text-gray-300">{rec.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <div className="flex items-start space-x-2">
          <Zap size={16} className="text-blue-400 mt-0.5" />
          <p className="text-sm text-blue-300">
            Your financial health score is calculated based on your net worth, savings rate, debt-to-income ratio, and other financial metrics.
          </p>
        </div>
      </div>
    </div>
  );
};