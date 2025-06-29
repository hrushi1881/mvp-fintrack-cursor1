import React from 'react';
import { DollarSign, Euro, PoundSterling, Pen as Yen, Bitcoin, CreditCard } from 'lucide-react';

interface CurrencyIconProps {
  currencyCode: string;
  size?: number;
  className?: string;
}

export const CurrencyIcon: React.FC<CurrencyIconProps> = ({ 
  currencyCode, 
  size = 18, 
  className = "text-gray-400" 
}) => {
  // Map currency codes to appropriate icons
  switch (currencyCode) {
    case 'USD':
    case 'AUD':
    case 'CAD':
    case 'SGD':
    case 'HKD':
    case 'MXN':
      return <DollarSign size={size} className={className} />;
    
    case 'EUR':
      return <Euro size={size} className={className} />;
    
    case 'GBP':
      return <PoundSterling size={size} className={className} />;
    
    case 'JPY':
    case 'CNY':
      return <Yen size={size} className={className} />;
    
    case 'BTC':
    case 'ETH':
      return <Bitcoin size={size} className={className} />;
    
    default:
      return <CreditCard size={size} className={className} />;
  }
};