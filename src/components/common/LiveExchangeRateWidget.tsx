import React, { useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import { useCurrencyConversion } from '../../contexts/CurrencyConversionContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';

export const LiveExchangeRateWidget: React.FC = () => {
  const { currency } = useInternationalization();
  const { 
    exchangeRates, 
    getConversionRate, 
    refreshRates, 
    isLoading, 
    lastUpdated, 
    isOnline,
    conversionHistory 
  } = useCurrencyConversion();
  
  const [showDetails, setShowDetails] = useState(false);

  // Popular currencies to show rates for
  const popularCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR'];
  const displayCurrencies = popularCurrencies.filter(code => code !== currency.code).slice(0, 4);

  const getRecentTrend = (currencyCode: string) => {
    const recentConversions = conversionHistory
      .filter(h => h.toCurrency === currencyCode || h.fromCurrency === currencyCode)
      .slice(0, 2);
    
    if (recentConversions.length < 2) return null;
    
    const [latest, previous] = recentConversions;
    const trend = latest.rate > previous.rate ? 'up' : 'down';
    const change = Math.abs(((latest.rate - previous.rate) / previous.rate) * 100);
    
    return { trend, change };
  };

  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CNY': '¥', 'INR': '₹',
      'AUD': 'A$', 'CAD': 'C$', 'CHF': 'CHF', 'SEK': 'kr', 'NOK': 'kr'
    };
    return symbols[code] || code;
  };

  return (
    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi size={16} className="text-success-400" />
            ) : (
              <WifiOff size={16} className="text-warning-400" />
            )}
            <h3 className="font-semibold text-white text-sm">Exchange Rates</h3>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success-400 animate-pulse' : 'bg-warning-400'}`}></div>
            <span className={`text-xs ${isOnline ? 'text-success-400' : 'text-warning-400'}`}>
              {isOnline ? 'Live' : 'Cached'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <Clock size={12} />
              <span>{lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
          <button
            onClick={refreshRates}
            disabled={isLoading || !isOnline}
            className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={`text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {displayCurrencies.map((currencyCode) => {
          const rate = getConversionRate(currency.code, currencyCode);
          const trend = getRecentTrend(currencyCode);
          
          return (
            <div key={currencyCode} className="flex items-center justify-between p-2 bg-black/20 rounded-lg hover:bg-black/30 transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-white">{currencyCode}</span>
                <span className="text-xs text-gray-400">{getCurrencySymbol(currencyCode)}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-white">
                  {rate.toFixed(rate < 1 ? 6 : 4)}
                </span>
                
                {trend && (
                  <div className={`flex items-center space-x-1 ${
                    trend.trend === 'up' ? 'text-success-400' : 'text-error-400'
                  }`}>
                    {trend.trend === 'up' ? (
                      <TrendingUp size={12} />
                    ) : (
                      <TrendingDown size={12} />
                    )}
                    <span className="text-xs">
                      {trend.change.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full mt-3 text-xs text-primary-400 hover:text-primary-300 transition-colors"
      >
        {showDetails ? 'Show Less' : 'View All Rates'}
      </button>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(exchangeRates)
              .filter(([code]) => !displayCurrencies.includes(code) && code !== currency.code)
              .slice(0, 8)
              .map(([code, rate]) => (
                <div key={code} className="flex justify-between items-center p-1">
                  <span className="text-gray-400">{code}</span>
                  <span className="text-gray-300">{rate.toFixed(4)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {!isOnline && (
        <div className="mt-3 p-2 bg-warning-500/20 border border-warning-500/30 rounded-lg">
          <p className="text-warning-400 text-xs">
            Using cached rates. Connect to internet for live updates.
          </p>
        </div>
      )}
    </div>
  );
};