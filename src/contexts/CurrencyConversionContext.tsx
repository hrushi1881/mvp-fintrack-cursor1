import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useInternationalization } from './InternationalizationContext';

interface ExchangeRates {
  [currencyCode: string]: number;
}

interface ConversionHistory {
  timestamp: Date;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  amount: number;
  convertedAmount: number;
}

interface CurrencyConversionContextType {
  exchangeRates: ExchangeRates;
  baseCurrency: string;
  isLoading: boolean;
  lastUpdated: Date | null;
  conversionHistory: ConversionHistory[];
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => number;
  convertAllUserData: (newCurrency: string) => Promise<void>;
  refreshRates: () => Promise<void>;
  getConversionRate: (fromCurrency: string, toCurrency: string) => number;
  isOnline: boolean;
  offlineRates: ExchangeRates;
}

const CurrencyConversionContext = createContext<CurrencyConversionContextType | undefined>(undefined);

export const useCurrencyConversion = () => {
  const context = useContext(CurrencyConversionContext);
  if (context === undefined) {
    throw new Error('useCurrencyConversion must be used within a CurrencyConversionProvider');
  }
  return context;
};

interface CurrencyConversionProviderProps {
  children: ReactNode;
}

export const CurrencyConversionProvider: React.FC<CurrencyConversionProviderProps> = ({ children }) => {
  const { currency } = useInternationalization();
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [baseCurrency] = useState('USD'); // Always use USD as base for consistency
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [conversionHistory, setConversionHistory] = useState<ConversionHistory[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineRates, setOfflineRates] = useState<ExchangeRates>({});

  // Fallback exchange rates for offline use (approximate rates)
  const fallbackRates: ExchangeRates = {
    'USD': 1.0,
    'EUR': 0.85,
    'GBP': 0.73,
    'JPY': 110.0,
    'CNY': 6.45,
    'INR': 74.5,
    'AUD': 1.35,
    'CAD': 1.25,
    'SGD': 1.35,
    'HKD': 7.8,
    'KRW': 1180.0,
    'THB': 33.0,
    'MYR': 4.15,
    'IDR': 14250.0,
    'PHP': 50.5,
    'VND': 23000.0,
    'CHF': 0.92,
    'SEK': 8.6,
    'NOK': 8.5,
    'DKK': 6.35,
    'PLN': 3.9,
    'CZK': 21.5,
    'HUF': 295.0,
    'RUB': 73.0,
    'BRL': 5.2,
    'MXN': 20.1,
    'ARS': 98.0,
    'CLP': 710.0,
    'COP': 3650.0,
    'PEN': 3.6,
    'AED': 3.67,
    'SAR': 3.75,
    'QAR': 3.64,
    'ILS': 3.2,
    'TRY': 8.5,
    'ZAR': 14.8,
    'EGP': 15.7,
    'NGN': 411.0,
    'KES': 108.0,
    'BTC': 0.000023,
    'ETH': 0.00035
  };

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load cached rates and history
  useEffect(() => {
    const cachedRates = localStorage.getItem('finspire_exchange_rates');
    const cachedTimestamp = localStorage.getItem('finspire_rates_timestamp');
    const cachedHistory = localStorage.getItem('finspire_conversion_history');

    if (cachedRates) {
      const rates = JSON.parse(cachedRates);
      setExchangeRates(rates);
      setOfflineRates(rates);
    } else {
      setOfflineRates(fallbackRates);
    }

    if (cachedTimestamp) {
      setLastUpdated(new Date(cachedTimestamp));
    }

    if (cachedHistory) {
      const history = JSON.parse(cachedHistory).map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
      setConversionHistory(history);
    }
  }, []);

  // Auto-refresh rates every 5 minutes when online
  useEffect(() => {
    if (isOnline) {
      refreshRates();
      const interval = setInterval(refreshRates, 5 * 60 * 1000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [isOnline]);

  // Fetch exchange rates from multiple APIs with fallbacks
  const refreshRates = async (): Promise<void> => {
    if (!isOnline) return;

    setIsLoading(true);
    try {
      // Try multiple free APIs for reliability
      let rates: ExchangeRates | null = null;

      // Primary API: ExchangeRate-API (free tier)
      try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
        if (response.ok) {
          const data = await response.json();
          rates = data.rates;
        }
      } catch (error) {
        console.log('Primary API failed, trying backup...');
      }

      // Backup API: Fixer.io (requires API key, but has free tier)
      if (!rates) {
        try {
          const response = await fetch(`https://api.fixer.io/latest?base=${baseCurrency}`);
          if (response.ok) {
            const data = await response.json();
            rates = data.rates;
          }
        } catch (error) {
          console.log('Backup API failed, trying third option...');
        }
      }

      // Third option: CurrencyAPI (free tier)
      if (!rates) {
        try {
          const response = await fetch(`https://api.currencyapi.com/v3/latest?apikey=YOUR_API_KEY&base_currency=${baseCurrency}`);
          if (response.ok) {
            const data = await response.json();
            rates = Object.fromEntries(
              Object.entries(data.data).map(([key, value]: [string, any]) => [key, value.value])
            );
          }
        } catch (error) {
          console.log('Third API failed, using cached/fallback rates');
        }
      }

      // Use fallback rates if all APIs fail
      if (!rates) {
        rates = fallbackRates;
        console.log('Using fallback exchange rates');
      }

      // Ensure USD is always 1.0 in the rates
      rates[baseCurrency] = 1.0;

      setExchangeRates(rates);
      setOfflineRates(rates);
      setLastUpdated(new Date());

      // Cache the rates
      localStorage.setItem('finspire_exchange_rates', JSON.stringify(rates));
      localStorage.setItem('finspire_rates_timestamp', new Date().toISOString());

    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      // Use cached rates or fallback
      if (Object.keys(exchangeRates).length === 0) {
        setExchangeRates(fallbackRates);
        setOfflineRates(fallbackRates);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get conversion rate between two currencies
  const getConversionRate = (fromCurrency: string, toCurrency: string): number => {
    const rates = isOnline ? exchangeRates : offlineRates;
    
    if (fromCurrency === toCurrency) return 1.0;
    
    const fromRate = rates[fromCurrency] || fallbackRates[fromCurrency] || 1.0;
    const toRate = rates[toCurrency] || fallbackRates[toCurrency] || 1.0;
    
    // Convert through USD as base currency
    return toRate / fromRate;
  };

  // Convert amount between currencies
  const convertAmount = (amount: number, fromCurrency: string, toCurrency: string): number => {
    const rate = getConversionRate(fromCurrency, toCurrency);
    const convertedAmount = amount * rate;

    // Add to conversion history
    const historyEntry: ConversionHistory = {
      timestamp: new Date(),
      fromCurrency,
      toCurrency,
      rate,
      amount,
      convertedAmount
    };

    setConversionHistory(prev => {
      const newHistory = [historyEntry, ...prev.slice(0, 99)]; // Keep last 100 conversions
      localStorage.setItem('finspire_conversion_history', JSON.stringify(newHistory));
      return newHistory;
    });

    return convertedAmount;
  };

  // Convert all user data to new currency
  const convertAllUserData = async (newCurrency: string): Promise<void> => {
    const currentCurrency = currency.code;
    if (currentCurrency === newCurrency) return;

    try {
      setIsLoading(true);

      // Get conversion rate
      const conversionRate = getConversionRate(currentCurrency, newCurrency);

      // Convert transactions
      const transactions = JSON.parse(localStorage.getItem('finspire_transactions') || '[]');
      const convertedTransactions = transactions.map((transaction: any) => ({
        ...transaction,
        amount: transaction.amount * conversionRate,
        originalAmount: transaction.originalAmount || transaction.amount,
        originalCurrency: transaction.originalCurrency || currentCurrency,
        date: new Date(transaction.date) // Ensure date is properly parsed
      }));

      // Convert goals
      const goals = JSON.parse(localStorage.getItem('finspire_goals') || '[]');
      const convertedGoals = goals.map((goal: any) => ({
        ...goal,
        targetAmount: goal.targetAmount * conversionRate,
        currentAmount: goal.currentAmount * conversionRate,
        originalTargetAmount: goal.originalTargetAmount || goal.targetAmount,
        originalCurrentAmount: goal.originalCurrentAmount || goal.currentAmount,
        originalCurrency: goal.originalCurrency || currentCurrency,
        targetDate: new Date(goal.targetDate),
        createdAt: new Date(goal.createdAt)
      }));

      // Convert liabilities
      const liabilities = JSON.parse(localStorage.getItem('finspire_liabilities') || '[]');
      const convertedLiabilities = liabilities.map((liability: any) => ({
        ...liability,
        totalAmount: liability.totalAmount * conversionRate,
        remainingAmount: liability.remainingAmount * conversionRate,
        monthlyPayment: liability.monthlyPayment * conversionRate,
        originalTotalAmount: liability.originalTotalAmount || liability.totalAmount,
        originalRemainingAmount: liability.originalRemainingAmount || liability.remainingAmount,
        originalMonthlyPayment: liability.originalMonthlyPayment || liability.monthlyPayment,
        originalCurrency: liability.originalCurrency || currentCurrency,
        dueDate: new Date(liability.dueDate),
        createdAt: new Date(liability.createdAt)
      }));

      // Convert budgets
      const budgets = JSON.parse(localStorage.getItem('finspire_budgets') || '[]');
      const convertedBudgets = budgets.map((budget: any) => ({
        ...budget,
        amount: budget.amount * conversionRate,
        spent: budget.spent * conversionRate,
        originalAmount: budget.originalAmount || budget.amount,
        originalSpent: budget.originalSpent || budget.spent,
        originalCurrency: budget.originalCurrency || currentCurrency,
        createdAt: new Date(budget.createdAt)
      }));

      // Convert recurring transactions
      const recurringTransactions = JSON.parse(localStorage.getItem('finspire_recurring_transactions') || '[]');
      const convertedRecurringTransactions = recurringTransactions.map((rt: any) => ({
        ...rt,
        amount: rt.amount * conversionRate,
        originalAmount: rt.originalAmount || rt.amount,
        originalCurrency: rt.originalCurrency || currentCurrency,
        startDate: new Date(rt.startDate),
        endDate: rt.endDate ? new Date(rt.endDate) : undefined,
        nextOccurrenceDate: new Date(rt.nextOccurrenceDate),
        lastProcessedDate: rt.lastProcessedDate ? new Date(rt.lastProcessedDate) : undefined,
        createdAt: new Date(rt.createdAt)
      }));

      // Save converted data
      localStorage.setItem('finspire_transactions', JSON.stringify(convertedTransactions));
      localStorage.setItem('finspire_goals', JSON.stringify(convertedGoals));
      localStorage.setItem('finspire_liabilities', JSON.stringify(convertedLiabilities));
      localStorage.setItem('finspire_budgets', JSON.stringify(convertedBudgets));
      localStorage.setItem('finspire_recurring_transactions', JSON.stringify(convertedRecurringTransactions));

      // Save conversion metadata
      const conversionMetadata = {
        lastConversion: {
          timestamp: new Date().toISOString(),
          fromCurrency: currentCurrency,
          toCurrency: newCurrency,
          rate: conversionRate
        }
      };
      localStorage.setItem('finspire_conversion_metadata', JSON.stringify(conversionMetadata));

      // Trigger a page reload to refresh all components with new data
      window.location.reload();

    } catch (error) {
      console.error('Error converting user data:', error);
      throw new Error('Failed to convert currency data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    exchangeRates: isOnline ? exchangeRates : offlineRates,
    baseCurrency,
    isLoading,
    lastUpdated,
    conversionHistory,
    convertAmount,
    convertAllUserData,
    refreshRates,
    getConversionRate,
    isOnline,
    offlineRates
  };

  return (
    <CurrencyConversionContext.Provider value={value}>
      {children}
    </CurrencyConversionContext.Provider>
  );
};