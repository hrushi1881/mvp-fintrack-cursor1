import React, { useState, useMemo } from 'react';
import { Calculator, TrendingDown, ArrowRight, Calendar, DollarSign, Percent, Clock, BarChart3, RefreshCw, CheckCircle, Info } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { Button } from '../common/Button';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { Liability } from '../../types';

interface DebtStrategyToolProps {
  onClose: () => void;
}

interface DebtPaymentPlan {
  id: string;
  name: string;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment: number;
  payoffDate: Date;
  totalInterest: number;
  payments: Array<{
    date: Date;
    payment: number;
    principal: number;
    interest: number;
    remainingBalance: number;
  }>;
}

interface StrategyResult {
  totalMonths: number;
  totalInterestPaid: number;
  totalPaid: number;
  payoffDate: Date;
  debtPlans: DebtPaymentPlan[];
}

export const DebtStrategyTool: React.FC<DebtStrategyToolProps> = ({ onClose }) => {
  const { liabilities, calculateDebtRepaymentStrategy } = useFinance();
  const { formatCurrency, currency } = useInternationalization();
  const [strategy, setStrategy] = useState<'snowball' | 'avalanche'>('avalanche');
  const [extraPayment, setExtraPayment] = useState<number>(0);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Filter out paid off liabilities
  const activeDebts = useMemo(() => 
    liabilities.filter(debt => debt.remainingAmount > 0),
    [liabilities]
  );

  // Calculate the results for both strategies
  const snowballResult = useMemo(() => 
    calculateDebtRepaymentStrategy('snowball', extraPayment),
    [calculateDebtRepaymentStrategy, extraPayment]
  );
  
  const avalancheResult = useMemo(() => 
    calculateDebtRepaymentStrategy('avalanche', extraPayment),
    [calculateDebtRepaymentStrategy, extraPayment]
  );

  // Get the result for the currently selected strategy
  const currentResult = strategy === 'snowball' ? snowballResult : avalancheResult;
  const alternateResult = strategy === 'snowball' ? avalancheResult : snowballResult;

  // Calculate savings compared to the other strategy
  const interestSavings = alternateResult.totalInterestPaid - currentResult.totalInterestPaid;
  const timeSavings = alternateResult.totalMonths - currentResult.totalMonths;

  // Get the selected debt's payment plan
  const selectedDebtPlan = selectedDebtId 
    ? currentResult.debtPlans.find(plan => plan.id === selectedDebtId)
    : null;

  // Simulate calculation process
  const handleCalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
    }, 1000);
  };

  if (activeDebts.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle size={48} className="mx-auto text-success-400 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Active Debts</h3>
        <p className="text-gray-400 mb-6">You don't have any active debts to create a repayment plan for.</p>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/30">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
          <Calculator size={20} className="mr-2 text-blue-400" />
          Debt Repayment Strategy Calculator
        </h3>
        <p className="text-gray-300 text-sm">
          Compare different strategies to pay off your debts and save money on interest.
        </p>
      </div>

      {/* Strategy Selection */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Choose Your Repayment Strategy
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="cursor-pointer">
            <input
              type="radio"
              checked={strategy === 'avalanche'}
              onChange={() => setStrategy('avalanche')}
              className="sr-only"
            />
            <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
              strategy === 'avalanche' 
                ? 'border-primary-500 bg-primary-500/20 text-primary-400 shadow-lg scale-105' 
                : 'border-white/20 hover:border-white/30 text-gray-300 hover:bg-white/5'
            }`}>
              <div className="flex flex-col items-center text-center">
                <TrendingDown size={24} className="mb-2" />
                <h4 className="font-semibold text-lg mb-1">Debt Avalanche</h4>
                <p className="text-sm opacity-80">
                  Pay highest interest rates first
                </p>
                <p className="text-xs mt-2 opacity-60">
                  Minimizes interest paid
                </p>
              </div>
            </div>
          </label>

          <label className="cursor-pointer">
            <input
              type="radio"
              checked={strategy === 'snowball'}
              onChange={() => setStrategy('snowball')}
              className="sr-only"
            />
            <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
              strategy === 'snowball' 
                ? 'border-primary-500 bg-primary-500/20 text-primary-400 shadow-lg scale-105' 
                : 'border-white/20 hover:border-white/30 text-gray-300 hover:bg-white/5'
            }`}>
              <div className="flex flex-col items-center text-center">
                <div className="text-2xl mb-2">🏔️</div>
                <h4 className="font-semibold text-lg mb-1">Debt Snowball</h4>
                <p className="text-sm opacity-80">
                  Pay smallest balances first
                </p>
                <p className="text-xs mt-2 opacity-60">
                  Builds momentum with quick wins
                </p>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Extra Payment Input */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
          <DollarSign size={16} className="mr-2 text-green-400" />
          Extra Monthly Payment
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="number"
            min="0"
            step="10"
            value={extraPayment}
            onChange={(e) => setExtraPayment(Number(e.target.value))}
            className="flex-1 bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white"
            placeholder="e.g., 100"
          />
          <Button 
            onClick={handleCalculate}
            size="sm"
            className="whitespace-nowrap"
            loading={isCalculating}
          >
            <RefreshCw size={16} className="mr-2" />
            Recalculate
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Adding extra payments can significantly reduce your debt payoff time and interest paid.
        </p>
      </div>

      {/* Results Summary */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <h4 className="font-medium text-white mb-4 flex items-center">
          <BarChart3 size={18} className="mr-2 text-primary-400" />
          {strategy === 'avalanche' ? 'Avalanche' : 'Snowball'} Strategy Results
        </h4>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-black/20 p-3 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Total Paid</p>
            <p className="text-lg font-bold text-white">
              {formatCurrency(currentResult.totalPaid)}
            </p>
          </div>
          
          <div className="bg-black/20 p-3 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Interest Paid</p>
            <p className="text-lg font-bold text-error-400">
              {formatCurrency(currentResult.totalInterestPaid)}
            </p>
          </div>
          
          <div className="bg-black/20 p-3 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Payoff Time</p>
            <p className="text-lg font-bold text-white">
              {currentResult.totalMonths} months
            </p>
          </div>
          
          <div className="bg-black/20 p-3 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Debt-Free Date</p>
            <p className="text-lg font-bold text-success-400">
              {format(currentResult.payoffDate, 'MMM yyyy')}
            </p>
          </div>
        </div>

        {/* Comparison with other strategy */}
        {interestSavings !== 0 && (
          <div className={`p-3 rounded-lg ${
            interestSavings > 0 ? 'bg-success-500/20 border border-success-500/30' : 'bg-warning-500/20 border border-warning-500/30'
          }`}>
            <div className="flex items-start space-x-2">
              <Info size={16} className={interestSavings > 0 ? 'text-success-400 mt-0.5' : 'text-warning-400 mt-0.5'} />
              <div>
                <p className={`font-medium ${interestSavings > 0 ? 'text-success-400' : 'text-warning-400'}`}>
                  {interestSavings > 0 
                    ? `You'll save ${formatCurrency(interestSavings)} in interest` 
                    : `You'll pay ${formatCurrency(Math.abs(interestSavings))} more in interest`}
                </p>
                <p className={`text-sm ${interestSavings > 0 ? 'text-success-300' : 'text-warning-300'}`}>
                  {timeSavings > 0 
                    ? `And be debt-free ${timeSavings} months sooner` 
                    : timeSavings < 0 
                      ? `But it will take ${Math.abs(timeSavings)} more months` 
                      : 'With the same payoff timeline'}
                  {' compared to the '}
                  {strategy === 'avalanche' ? 'Snowball' : 'Avalanche'} strategy
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Debt Payoff Order */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-white flex items-center">
            <ArrowRight size={18} className="mr-2 text-orange-400" />
            Payoff Order
          </h4>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-primary-400 hover:text-primary-300 font-medium"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        
        <div className="space-y-4">
          {currentResult.debtPlans.map((plan, index) => {
            const isSelected = selectedDebtId === plan.id;
            const progressPercent = ((plan.payments[0]?.payment || 0) - plan.remainingAmount) / (plan.payments[0]?.payment || 1) * 100;
            
            return (
              <div 
                key={plan.id}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected 
                    ? 'border-primary-500 bg-primary-500/10' 
                    : 'border-white/10 hover:border-white/20'
                }`}
                onClick={() => setSelectedDebtId(isSelected ? null : plan.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h5 className="font-medium text-white">{plan.name}</h5>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span>{formatCurrency(plan.remainingAmount)}</span>
                        <span>•</span>
                        <span>{plan.interestRate}% APR</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {formatCurrency(plan.monthlyPayment + (index === 0 ? extraPayment : 0))}
                      <span className="text-xs text-gray-400">/mo</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Paid off: {format(plan.payoffDate, 'MMM yyyy')}
                    </p>
                  </div>
                </div>
                
                {showDetails && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-black/20 p-2 rounded">
                        <span className="text-gray-400">Total Interest:</span>
                        <span className="float-right text-error-400 font-medium">
                          {formatCurrency(plan.totalInterest)}
                        </span>
                      </div>
                      <div className="bg-black/20 p-2 rounded">
                        <span className="text-gray-400">Months to Payoff:</span>
                        <span className="float-right text-white font-medium">
                          {plan.payments.length}
                        </span>
                      </div>
                    </div>
                    
                    {isSelected && plan.payments.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-300 mb-2">Payment Schedule (First 3 Months)</p>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {plan.payments.slice(0, 3).map((payment, i) => (
                            <div key={i} className="grid grid-cols-4 gap-1 text-xs bg-black/20 p-2 rounded">
                              <div className="text-gray-400">{format(payment.date, 'MMM yyyy')}</div>
                              <div className="text-white">{formatCurrency(payment.payment)}</div>
                              <div className="text-success-400">
                                Principal: {formatCurrency(payment.principal)}
                              </div>
                              <div className="text-error-400">
                                Interest: {formatCurrency(payment.interest)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Strategy Explanation */}
      <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
        <div className="flex items-start space-x-3">
          <Info size={18} className="text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-400 mb-1">About {strategy === 'avalanche' ? 'Debt Avalanche' : 'Debt Snowball'}</h4>
            <p className="text-sm text-blue-300">
              {strategy === 'avalanche' 
                ? 'The Debt Avalanche method focuses on paying off debts with the highest interest rates first. This approach minimizes the total interest paid and is mathematically optimal.' 
                : 'The Debt Snowball method focuses on paying off the smallest debts first, regardless of interest rate. This approach provides psychological wins and can help maintain motivation.'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4">
        <Button 
          variant="outline" 
          onClick={onClose} 
          className="flex-1"
        >
          Close
        </Button>
        <Button 
          onClick={() => setStrategy(strategy === 'avalanche' ? 'snowball' : 'avalanche')}
          className="flex-1"
        >
          Try {strategy === 'avalanche' ? 'Snowball' : 'Avalanche'} Instead
        </Button>
      </div>
    </div>
  );
};