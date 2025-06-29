import React, { useState, useEffect } from 'react';
import { Lightbulb, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface Tip {
  id: number;
  title: string;
  content: string;
  category: 'saving' | 'investing' | 'budgeting' | 'debt';
  icon: string;
}

export const FinancialTips: React.FC = () => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const tips: Tip[] = [
    {
      id: 1,
      title: "50/30/20 Rule",
      content: "Allocate 50% of your income to needs, 30% to wants, and 20% to savings and debt repayment.",
      category: "budgeting",
      icon: "💰"
    },
    {
      id: 2,
      title: "Pay Yourself First",
      content: "Set aside savings as soon as you get paid, before spending on anything else.",
      category: "saving",
      icon: "🏦"
    },
    {
      id: 3,
      title: "Debt Avalanche Method",
      content: "Pay off high-interest debt first to minimize interest payments over time.",
      category: "debt",
      icon: "❄️"
    },
    {
      id: 4,
      title: "Debt Snowball Method",
      content: "Pay off smallest debts first to build momentum and motivation.",
      category: "debt",
      icon: "🏂"
    },
    {
      id: 5,
      title: "Emergency Fund",
      content: "Save 3-6 months of expenses for unexpected financial emergencies.",
      category: "saving",
      icon: "🚨"
    },
    {
      id: 6,
      title: "Automate Your Finances",
      content: "Set up automatic transfers for savings and bill payments to stay consistent.",
      category: "budgeting",
      icon: "🤖"
    },
    {
      id: 7,
      title: "Dollar-Cost Averaging",
      content: "Invest a fixed amount regularly regardless of market conditions to reduce risk.",
      category: "investing",
      icon: "📈"
    },
    {
      id: 8,
      title: "Track Your Spending",
      content: "Regularly review where your money goes to identify areas for improvement.",
      category: "budgeting",
      icon: "🔍"
    }
  ];

  // Auto-rotate tips
  useEffect(() => {
    const interval = setInterval(() => {
      nextTip();
    }, 8000);
    
    return () => clearInterval(interval);
  }, [currentTipIndex]);

  const nextTip = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
      setIsAnimating(false);
    }, 300);
  };

  const prevTip = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentTipIndex((prev) => (prev - 1 + tips.length) % tips.length);
      setIsAnimating(false);
    }, 300);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'saving': return 'bg-green-500/20 border-green-500/30 text-green-400';
      case 'investing': return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
      case 'budgeting': return 'bg-purple-500/20 border-purple-500/30 text-purple-400';
      case 'debt': return 'bg-orange-500/20 border-orange-500/30 text-orange-400';
      default: return 'bg-primary-500/20 border-primary-500/30 text-primary-400';
    }
  };

  const currentTip = tips[currentTipIndex];

  return (
    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Lightbulb size={18} className="text-yellow-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Financial Tip</h3>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={prevTip}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft size={16} className="text-gray-400" />
          </button>
          <span className="text-xs text-gray-400">{currentTipIndex + 1}/{tips.length}</span>
          <button
            onClick={nextTip}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>
      </div>
      
      <div className={`transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex items-start space-x-4 mb-4">
          <div className="text-3xl">{currentTip.icon}</div>
          <div>
            <h4 className="font-semibold text-white text-lg mb-1">{currentTip.title}</h4>
            <p className="text-gray-300">{currentTip.content}</p>
          </div>
        </div>
        
        <div className={`p-2 rounded-lg ${getCategoryColor(currentTip.category)}`}>
          <span className="text-xs font-medium capitalize">{currentTip.category} Tip</span>
        </div>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <div className="flex space-x-1">
          {tips.map((_, index) => (
            <div 
              key={index} 
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentTipIndex 
                  ? 'bg-primary-500 w-4' 
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
        
        <a 
          href="https://www.investopedia.com/personal-finance-4427760" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-primary-400 hover:text-primary-300 flex items-center"
        >
          Learn more <ExternalLink size={12} className="ml-1" />
        </a>
      </div>
    </div>
  );
};