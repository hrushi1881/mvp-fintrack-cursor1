import React, { useState } from 'react';
import { RefreshCw, TrendingUp, Clock, Wifi, WifiOff, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { useCurrencyConversion } from '../../contexts/CurrencyConversionContext';

interface CurrencyConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCurrency: any;
}

export const CurrencyConversionModal: React.FC<CurrencyConversionModalProps> = ({
  isOpen,
  onClose,
  targetCurrency
}) => {
  const { currency, formatCurrency, setCurrency } = useInternationalization();
  const { 
    convertAllUserData, 
    getConversionRate, 
    isLoading, 
    lastUpdated, 
    isOnline,
    refreshRates,
    conversionHistory
  } = useCurrencyConversion();
  
  const [isConverting, setIsConverting] = useState(false);
  const [conversionComplete, setConversionComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversionType, setConversionType] = useState<'display' | 'data'>('display');

  const conversionRate = getConversionRate(currency.code, targetCurrency.code);
  const sampleAmounts = [100, 1000, 10000];

  const handleConversion = async () => {
    try {
      setIsConverting(true);
      setError(null);
      
      if (conversionType === 'data') {
        await convertAllUserData(targetCurrency.code);
      } else {
        // Display only - just change the currency setting
        setCurrency(targetCurrency);
      }
      
      setConversionComplete(true);
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
        setConversionComplete(false);
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Conversion failed. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };


  const handleRefreshRates = async () => {
    try {
      await refreshRates();
    } catch (err) {
      console.error('Failed to refresh rates:', err);
    }
  };

  if (conversionComplete) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Conversion Complete">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-success-500/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={40} className="text-success-400" />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Currency Converted Successfully!
            </h3>
            <p className="text-gray-400">
              All your financial data has been converted to {targetCurrency.name} ({targetCurrency.code})
            </p>
          </div>

          <div className="bg-success-500/20 border border-success-500/30 rounded-lg p-4">
            <p className="text-success-400 text-sm">
              Your app will refresh automatically to show the updated values.
            </p>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Convert Currency">
      <div className="space-y-6">
        {/* Conversion Type Selection */}
        <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
          <h4 className="font-medium text-blue-400 mb-2">Conversion Options</h4>
          <div className="space-y-3">
            <label className="cursor-pointer">
              <input
                type="radio"
                name="conversionType"
                value="display"
                checked={conversionType === 'display'}
                onChange={() => setConversionType('display')}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 transition-colors ${
                conversionType === 'display' 
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <p className="font-medium">Display Currency Only</p>
                <p className="text-sm opacity-80">Change how amounts are displayed without converting existing data</p>
              </div>
            </label>
            
            <label className="cursor-pointer">
              <input
                type="radio"
                name="conversionType"
                value="data"
                checked={conversionType === 'data'}
                onChange={() => setConversionType('data')}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 transition-colors ${
                conversionType === 'data' 
                  ? 'border-warning-500 bg-warning-500/20 text-warning-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <p className="font-medium">Convert All Data</p>
                <p className="text-sm opacity-80">Convert all existing financial data to the new currency</p>
              </div>
            </label>
          </div>
        </div>

        {/* Connection Status */}
        <div className={`flex items-center space-x-2 p-3 rounded-lg ${
          isOnline ? 'bg-success-500/20 border border-success-500/30' : 'bg-warning-500/20 border border-warning-500/30'
        }`}>
          {isOnline ? (
            <Wifi size={16} className="text-success-400" />
          ) : (
            <WifiOff size={16} className="text-warning-400" />
          )}
          <div className="flex-1">
            <p className={`text-sm font-medium ${isOnline ? 'text-success-400' : 'text-warning-400'}`}>
              {isOnline ? 'Live Exchange Rates' : 'Offline Mode'}
            </p>
            <p className="text-xs text-gray-400">
              {isOnline 
                ? `Last updated: ${lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}`
                : 'Using cached exchange rates'
              }
            </p>
          </div>
          {isOnline && (
            <button
              onClick={handleRefreshRates}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              disabled={isLoading}
            >
              <RefreshCw size={14} className={`text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* Conversion Preview */}
        <div className="bg-black/20 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-400">From</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-lg">{currency.symbol}</span>
                <span className="font-semibold text-white">{currency.code}</span>
              </div>
              <p className="text-xs text-gray-500">{currency.name}</p>
            </div>
            
            <ArrowRight size={20} className="text-gray-400" />
            
            <div className="text-center">
              <p className="text-sm text-gray-400">To</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-lg">{targetCurrency.symbol}</span>
                <span className="font-semibold text-white">{targetCurrency.code}</span>
              </div>
              <p className="text-xs text-gray-500">{targetCurrency.name}</p>
            </div>
          </div>

          {/* Exchange Rate */}
          <div className="text-center p-3 bg-primary-500/20 rounded-lg border border-primary-500/30">
            <p className="text-sm text-primary-400 mb-1">Exchange Rate</p>
            <p className="text-lg font-bold text-white">
              1 {currency.code} = {conversionRate.toFixed(6)} {targetCurrency.code}
            </p>
          </div>
        </div>

        {/* Sample Conversions */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Sample Conversions</h4>
          <div className="space-y-2">
            {sampleAmounts.map((amount) => (
              <div key={amount} className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                <span className="text-gray-300">
                  {formatCurrency(amount)}
                </span>
                <span className="font-medium text-white">
                  {targetCurrency.symbol}{(amount * conversionRate).toLocaleString(undefined, {
                    minimumFractionDigits: targetCurrency.decimals,
                    maximumFractionDigits: targetCurrency.decimals
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Conversions */}
        {conversionHistory.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
              <Clock size={14} className="mr-2" />
              Recent Conversions
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {conversionHistory.slice(0, 3).map((conversion, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-black/20 rounded text-xs">
                  <span className="text-gray-400">
                    {conversion.fromCurrency} → {conversion.toCurrency}
                  </span>
                  <span className="text-gray-300">
                    Rate: {conversion.rate.toFixed(4)}
                  </span>
                  <span className="text-gray-500">
                    {conversion.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning */}
        <div className={`rounded-lg p-4 border ${
          conversionType === 'data' 
            ? 'bg-warning-500/20 border-warning-500/30' 
            : 'bg-blue-500/20 border-blue-500/30'
        }`}>
          <div className="flex items-start space-x-3">
            <AlertCircle size={16} className={`mt-0.5 ${
              conversionType === 'data' ? 'text-warning-400' : 'text-blue-400'
            }`} />
            <div className="text-sm">
              <p className={`font-medium mb-1 ${
                conversionType === 'data' ? 'text-warning-400' : 'text-blue-400'
              }`}>
                {conversionType === 'data' ? 'Data Conversion Notice' : 'Display Change Notice'}
              </p>
              {conversionType === 'data' ? (
                <ul className="text-warning-300 space-y-1 text-xs">
                  <li>• All your financial data will be converted to {targetCurrency.name}</li>
                  <li>• This action cannot be undone automatically</li>
                  <li>• {isOnline ? 'Using live exchange rates' : 'Using cached exchange rates'}</li>
                  <li>• Original amounts are preserved for reference</li>
                </ul>
              ) : (
                <ul className="text-blue-300 space-y-1 text-xs">
                  <li>• Only the display currency will change to {targetCurrency.name}</li>
                  <li>• Your existing data remains in the original currency</li>
                  <li>• Amounts will be converted for display using live exchange rates</li>
                  <li>• You can change this back anytime</li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error-500/20 border border-error-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle size={16} className="text-error-400" />
              <p className="text-error-400 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isConverting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConversion}
            className={`flex-1 ${
              conversionType === 'data' 
                ? 'bg-warning-500 hover:bg-warning-600' 
                : 'bg-primary-500 hover:bg-primary-600'
            }`}
            loading={isConverting}
            disabled={isConverting || currency.code === targetCurrency.code}
          >
            {conversionType === 'data' ? 'Convert All Data' : 'Change Display Only'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};