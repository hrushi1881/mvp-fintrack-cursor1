import React, { useState } from 'react';
import { DollarSign, ChevronDown, Search, Globe, TrendingUp, RefreshCw } from 'lucide-react';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { useCurrencyConversion } from '../../contexts/CurrencyConversionContext';
import { CurrencyConversionModal } from './CurrencyConversionModal';

export const CurrencySelector: React.FC = () => {
  const { currency, setCurrency, supportedCurrencies, formatCurrency } = useInternationalization();
  const { getConversionRate, isOnline, lastUpdated } = useCurrencyConversion();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [selectedCurrencyForConversion, setSelectedCurrencyForConversion] = useState<any>(null);

  const filteredCurrencies = supportedCurrencies.filter(curr =>
    curr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    curr.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCurrencySelect = (selectedCurrency: any) => {
    if (selectedCurrency.code === currency.code) {
      setIsOpen(false);
      return;
    }

    // Show conversion modal for data conversion
    setSelectedCurrencyForConversion(selectedCurrency);
    setShowConversionModal(true);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleDirectCurrencyChange = (selectedCurrency: any) => {
    // Direct change without data conversion (for display purposes only)
    setCurrency(selectedCurrency);
    setShowConversionModal(false);
  };

  const getCurrencyFlag = (code: string) => {
    const flagMap: Record<string, string> = {
      'USD': '🇺🇸', 'EUR': '🇪🇺', 'GBP': '🇬🇧', 'JPY': '🇯🇵', 'CNY': '🇨🇳',
      'INR': '🇮🇳', 'AUD': '🇦🇺', 'CAD': '🇨🇦', 'SGD': '🇸🇬', 'HKD': '🇭🇰',
      'KRW': '🇰🇷', 'THB': '🇹🇭', 'MYR': '🇲🇾', 'IDR': '🇮🇩', 'PHP': '🇵🇭',
      'VND': '🇻🇳', 'CHF': '🇨🇭', 'SEK': '🇸🇪', 'NOK': '🇳🇴', 'DKK': '🇩🇰',
      'PLN': '🇵🇱', 'CZK': '🇨🇿', 'HUF': '🇭🇺', 'RUB': '🇷🇺', 'BRL': '🇧🇷',
      'MXN': '🇲🇽', 'ARS': '🇦🇷', 'CLP': '🇨🇱', 'COP': '🇨🇴', 'PEN': '🇵🇪',
      'AED': '🇦🇪', 'SAR': '🇸🇦', 'QAR': '🇶🇦', 'ILS': '🇮🇱', 'TRY': '🇹🇷',
      'ZAR': '🇿🇦', 'EGP': '🇪🇬', 'NGN': '🇳🇬', 'KES': '🇰🇪', 'BTC': '₿', 'ETH': 'Ξ'
    };
    return flagMap[code] || '💱';
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-3 p-3 bg-black/20 backdrop-blur-md rounded-xl hover:bg-black/30 transition-colors border border-white/10 w-full"
        >
          <div className="flex items-center space-x-3 flex-1">
            <div className="p-2 bg-white/10 rounded-lg">
              <DollarSign size={18} className="text-gray-400" />
            </div>
            <div className="text-left">
              <p className="font-medium text-white text-sm">Currency</p>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-gray-400">Set your preferred currency</p>
                {isOnline ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-success-400">Live</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-warning-400 rounded-full"></div>
                    <span className="text-xs text-warning-400">Offline</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getCurrencyFlag(currency.code)}</span>
            <div className="text-right">
              <span className="text-sm font-medium text-white">{currency.code}</span>
              <p className="text-xs text-gray-400">{currency.symbol}</p>
            </div>
            <ChevronDown 
              size={16} 
              className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
          </div>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-md rounded-xl border border-white/10 shadow-xl z-50 max-h-96 overflow-hidden">
            {/* Header with Status */}
            <div className="p-3 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white">Select Currency</h3>
                <div className="flex items-center space-x-2 text-xs">
                  {isOnline ? (
                    <div className="flex items-center space-x-1 text-success-400">
                      <RefreshCw size={12} />
                      <span>Live Rates</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-warning-400">
                      <Globe size={12} />
                      <span>Cached Rates</span>
                    </div>
                  )}
                  {lastUpdated && (
                    <span className="text-gray-500">
                      {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search currencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm"
                />
              </div>
            </div>

            {/* Currency List */}
            <div className="max-h-72 overflow-y-auto">
              {filteredCurrencies.map((curr) => {
                const rate = getConversionRate(currency.code, curr.code);
                const isCurrentCurrency = curr.code === currency.code;
                
                return (
                  <button
                    key={curr.code}
                    onClick={() => handleCurrencySelect(curr)}
                    className={`w-full flex items-center space-x-3 p-3 hover:bg-white/10 transition-colors ${
                      isCurrentCurrency ? 'bg-primary-500/20 border-l-2 border-primary-500' : ''
                    }`}
                  >
                    <span className="text-lg">{getCurrencyFlag(curr.code)}</span>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${
                          isCurrentCurrency ? 'text-primary-400' : 'text-white'
                        }`}>
                          {curr.code}
                        </span>
                        <div className="text-right">
                          <span className="text-sm text-gray-400">{curr.symbol}</span>
                          {!isCurrentCurrency && (
                            <div className="flex items-center space-x-1">
                              <TrendingUp size={10} className="text-gray-500" />
                              <span className="text-xs text-gray-500">
                                {rate.toFixed(rate < 1 ? 6 : 2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">{curr.name}</p>
                      <p className="text-xs text-gray-500">
                        Example: {curr.code === currency.code ? formatCurrency(1234.56) : 
                          `${curr.symbol}${(1234.56 * rate).toLocaleString(undefined, {
                            minimumFractionDigits: curr.decimals,
                            maximumFractionDigits: curr.decimals
                          })}`
                        }
                      </p>
                    </div>
                    {isCurrentCurrency && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>

            {filteredCurrencies.length === 0 && (
              <div className="p-6 text-center">
                <Globe size={32} className="mx-auto text-gray-600 mb-2" />
                <p className="text-gray-400 text-sm">No currencies found</p>
              </div>
            )}

            {/* Footer */}
            <div className="p-3 border-t border-white/10 bg-black/20">
              <p className="text-xs text-gray-500 text-center">
                {isOnline ? 'Real-time exchange rates' : 'Using cached rates'} • 
                Powered by multiple financial data providers
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Currency Conversion Modal */}
      {selectedCurrencyForConversion && (
        <CurrencyConversionModal
          isOpen={showConversionModal}
          onClose={() => {
            setShowConversionModal(false);
            setSelectedCurrencyForConversion(null);
          }}
          targetCurrency={selectedCurrencyForConversion}
        />
      )}
    </>
  );
};