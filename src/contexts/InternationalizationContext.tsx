import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  symbolPosition: 'before' | 'after';
  thousandsSeparator: string;
  decimalSeparator: string;
}

interface RegionConfig {
  country: string;
  countryCode: string;
  timezone: string;
  dateFormat: string;
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  numberFormat: string;
}

interface InternationalizationContextType {
  currency: CurrencyConfig;
  region: RegionConfig;
  setCurrency: (currency: CurrencyConfig) => void;
  setRegion: (region: RegionConfig) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date, format?: string) => string;
  formatNumber: (number: number) => string;
  detectUserLocation: () => Promise<void>;
  supportedCurrencies: CurrencyConfig[];
  supportedRegions: RegionConfig[];
}

const InternationalizationContext = createContext<InternationalizationContextType | undefined>(undefined);

export const useInternationalization = () => {
  const context = useContext(InternationalizationContext);
  if (context === undefined) {
    throw new Error('useInternationalization must be used within an InternationalizationProvider');
  }
  return context;
};

interface InternationalizationProviderProps {
  children: ReactNode;
}

export const InternationalizationProvider: React.FC<InternationalizationProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();

  // Comprehensive currency configurations
  const supportedCurrencies: CurrencyConfig[] = [
    // Major World Currencies
    { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2, symbolPosition: 'after', thousandsSeparator: '.', decimalSeparator: ',' },
    { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimals: 2, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    
    // Asia Pacific
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', decimals: 2, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won', decimals: 0, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht', decimals: 2, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', decimals: 2, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', decimals: 0, symbolPosition: 'before', thousandsSeparator: '.', decimalSeparator: ',' },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso', decimals: 2, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', decimals: 0, symbolPosition: 'after', thousandsSeparator: '.', decimalSeparator: ',' },
    
    // Europe
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimals: 2, symbolPosition: 'after', thousandsSeparator: "'", decimalSeparator: '.' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', decimals: 2, symbolPosition: 'after', thousandsSeparator: ' ', decimalSeparator: ',' },
    { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', decimals: 2, symbolPosition: 'after', thousandsSeparator: ' ', decimalSeparator: ',' },
    { code: 'DKK', symbol: 'kr', name: 'Danish Krone', decimals: 2, symbolPosition: 'after', thousandsSeparator: '.', decimalSeparator: ',' },
    { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', decimals: 2, symbolPosition: 'after', thousandsSeparator: ' ', decimalSeparator: ',' },
    { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', decimals: 2, symbolPosition: 'after', thousandsSeparator: ' ', decimalSeparator: ',' },
    { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', decimals: 0, symbolPosition: 'after', thousandsSeparator: ' ', decimalSeparator: ',' },
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble', decimals: 2, symbolPosition: 'after', thousandsSeparator: ' ', decimalSeparator: ',' },
    
    // Americas
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimals: 2, symbolPosition: 'before', thousandsSeparator: '.', decimalSeparator: ',' },
    { code: 'MXN', symbol: '$', name: 'Mexican Peso', decimals: 2, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    { code: 'ARS', symbol: '$', name: 'Argentine Peso', decimals: 2, symbolPosition: 'before', thousandsSeparator: '.', decimalSeparator: ',' },
    { code: 'CLP', symbol: '$', name: 'Chilean Peso', decimals: 0, symbolPosition: 'before', thousandsSeparator: '.', decimalSeparator: ',' },
    { code: 'COP', symbol: '$', name: 'Colombian Peso', decimals: 0, symbolPosition: 'before', thousandsSeparator: '.', decimalSeparator: ',' },
    { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', decimals: 2, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    
    // Middle East & Africa
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', decimals: 2, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', decimals: 2, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal', decimals: 2, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', decimals: 2, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira', decimals: 2, symbolPosition: 'after', thousandsSeparator: '.', decimalSeparator: ',' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand', decimals: 2, symbolPosition: 'before', thousandsSeparator: ' ', decimalSeparator: '.' },
    { code: 'EGP', symbol: '£', name: 'Egyptian Pound', decimals: 2, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', decimals: 2, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', decimals: 2, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    
    // Cryptocurrencies
    { code: 'BTC', symbol: '₿', name: 'Bitcoin', decimals: 8, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
    { code: 'ETH', symbol: 'Ξ', name: 'Ethereum', decimals: 6, symbolPosition: 'before', thousandsSeparator: ',', decimalSeparator: '.' },
  ];

  // Regional configurations
  const supportedRegions: RegionConfig[] = [
    // North America
    { country: 'United States', countryCode: 'US', timezone: 'America/New_York', dateFormat: 'MM/dd/yyyy', firstDayOfWeek: 0, numberFormat: 'en-US' },
    { country: 'Canada', countryCode: 'CA', timezone: 'America/Toronto', dateFormat: 'yyyy-MM-dd', firstDayOfWeek: 0, numberFormat: 'en-CA' },
    { country: 'Mexico', countryCode: 'MX', timezone: 'America/Mexico_City', dateFormat: 'dd/MM/yyyy', firstDayOfWeek: 1, numberFormat: 'es-MX' },
    
    // Europe
    { country: 'United Kingdom', countryCode: 'GB', timezone: 'Europe/London', dateFormat: 'dd/MM/yyyy', firstDayOfWeek: 1, numberFormat: 'en-GB' },
    { country: 'Germany', countryCode: 'DE', timezone: 'Europe/Berlin', dateFormat: 'dd.MM.yyyy', firstDayOfWeek: 1, numberFormat: 'de-DE' },
    { country: 'France', countryCode: 'FR', timezone: 'Europe/Paris', dateFormat: 'dd/MM/yyyy', firstDayOfWeek: 1, numberFormat: 'fr-FR' },
    { country: 'Spain', countryCode: 'ES', timezone: 'Europe/Madrid', dateFormat: 'dd/MM/yyyy', firstDayOfWeek: 1, numberFormat: 'es-ES' },
    { country: 'Italy', countryCode: 'IT', timezone: 'Europe/Rome', dateFormat: 'dd/MM/yyyy', firstDayOfWeek: 1, numberFormat: 'it-IT' },
    { country: 'Netherlands', countryCode: 'NL', timezone: 'Europe/Amsterdam', dateFormat: 'dd-MM-yyyy', firstDayOfWeek: 1, numberFormat: 'nl-NL' },
    { country: 'Sweden', countryCode: 'SE', timezone: 'Europe/Stockholm', dateFormat: 'yyyy-MM-dd', firstDayOfWeek: 1, numberFormat: 'sv-SE' },
    { country: 'Norway', countryCode: 'NO', timezone: 'Europe/Oslo', dateFormat: 'dd.MM.yyyy', firstDayOfWeek: 1, numberFormat: 'nb-NO' },
    { country: 'Switzerland', countryCode: 'CH', timezone: 'Europe/Zurich', dateFormat: 'dd.MM.yyyy', firstDayOfWeek: 1, numberFormat: 'de-CH' },
    { country: 'Poland', countryCode: 'PL', timezone: 'Europe/Warsaw', dateFormat: 'dd.MM.yyyy', firstDayOfWeek: 1, numberFormat: 'pl-PL' },
    { country: 'Russia', countryCode: 'RU', timezone: 'Europe/Moscow', dateFormat: 'dd.MM.yyyy', firstDayOfWeek: 1, numberFormat: 'ru-RU' },
    
    // Asia Pacific
    { country: 'Japan', countryCode: 'JP', timezone: 'Asia/Tokyo', dateFormat: 'yyyy/MM/dd', firstDayOfWeek: 0, numberFormat: 'ja-JP' },
    { country: 'China', countryCode: 'CN', timezone: 'Asia/Shanghai', dateFormat: 'yyyy/MM/dd', firstDayOfWeek: 1, numberFormat: 'zh-CN' },
    { country: 'India', countryCode: 'IN', timezone: 'Asia/Kolkata', dateFormat: 'dd/MM/yyyy', firstDayOfWeek: 0, numberFormat: 'en-IN' },
    { country: 'Australia', countryCode: 'AU', timezone: 'Australia/Sydney', dateFormat: 'dd/MM/yyyy', firstDayOfWeek: 1, numberFormat: 'en-AU' },
    { country: 'Singapore', countryCode: 'SG', timezone: 'Asia/Singapore', dateFormat: 'dd/MM/yyyy', firstDayOfWeek: 1, numberFormat: 'en-SG' },
    { country: 'South Korea', countryCode: 'KR', timezone: 'Asia/Seoul', dateFormat: 'yyyy. MM. dd.', firstDayOfWeek: 0, numberFormat: 'ko-KR' },
    { country: 'Thailand', countryCode: 'TH', timezone: 'Asia/Bangkok', dateFormat: 'dd/MM/yyyy', firstDayOfWeek: 0, numberFormat: 'th-TH' },
    { country: 'Malaysia', countryCode: 'MY', timezone: 'Asia/Kuala_Lumpur', dateFormat: 'dd/MM/yyyy', firstDayOfWeek: 1, numberFormat: 'ms-MY' },
    { country: 'Indonesia', countryCode: 'ID', timezone: 'Asia/Jakarta', dateFormat: 'dd/MM/yyyy', firstDayOfWeek: 1, numberFormat: 'id-ID' },
    { country: 'Philippines', countryCode: 'PH', timezone: 'Asia/Manila', dateFormat: 'MM/dd/yyyy', firstDayOfWeek: 0, numberFormat: 'en-PH' },
    { country: 'Vietnam', countryCode: 'VN', timezone: 'Asia/Ho_Chi_Minh', dateFormat: 'dd/MM/yyyy', firstDayOfWeek: 1, numberFormat: 'vi-VN' },
    
    // Middle East & Africa
    { country: 'UAE', countryCode: 'AE', timezone: 'Asia/Dubai', dateFormat: 'dd/MM/yyyy', firstDayOfWeek: 6, numberFormat: 'ar-AE' },
    { country: 'Saudi Arabia', countryCode: 'SA', timezone: 'Asia/Riyadh', dateFormat: 'dd/MM/yyyy', firstDayOfWeek: 6, numberFormat: 'ar-SA' },
    { country: 'Israel', countryCode: 'IL', timezone: 'Asia/Jerusalem', dateFormat: 'dd/MM/yyyy', firstDayOfWeek: 0, numberFormat: 'he-IL' },
    { country: 'Turkey', countryCode: 'TR', timezone: 'Europe/Istanbul', dateFormat: 'dd.MM.yyyy', firstDayOfWeek: 1, numberFormat: 'tr-TR' },
    { country: 'South Africa', countryCode: 'ZA', timezone: 'Africa/Johannesburg', dateFormat: 'yyyy/MM/dd', firstDayOfWeek: 0, numberFormat: 'en-ZA' },
    { country: 'Egypt', countryCode: 'EG', timezone: 'Africa/Cairo', dateFormat: 'dd/MM/yyyy', firstDayOfWeek: 6, numberFormat: 'ar-EG' },
    { country: 'Nigeria', countryCode: 'NG', timezone: 'Africa/Lagos', dateFormat: 'dd/MM/yyyy', firstDayOfWeek: 1, numberFormat: 'en-NG' },
    
    // South America
    { country: 'Brazil', countryCode: 'BR', timezone: 'America/Sao_Paulo', dateFormat: 'dd/MM/yyyy', firstDayOfWeek: 0, numberFormat: 'pt-BR' },
    { country: 'Argentina', countryCode: 'AR', timezone: 'America/Argentina/Buenos_Aires', dateFormat: 'dd/MM/yyyy', firstDayOfWeek: 1, numberFormat: 'es-AR' },
    { country: 'Chile', countryCode: 'CL', timezone: 'America/Santiago', dateFormat: 'dd-MM-yyyy', firstDayOfWeek: 1, numberFormat: 'es-CL' },
    { country: 'Colombia', countryCode: 'CO', timezone: 'America/Bogota', dateFormat: 'dd/MM/yyyy', firstDayOfWeek: 1, numberFormat: 'es-CO' },
  ];

  const [currency, setCurrency] = useState<CurrencyConfig>(supportedCurrencies[0]); // Default to USD
  const [region, setRegion] = useState<RegionConfig>(supportedRegions[0]); // Default to US

  // Load saved preferences
  useEffect(() => {
    const savedCurrency = localStorage.getItem('finspire_currency');
    const savedRegion = localStorage.getItem('finspire_region');

    if (savedCurrency) {
      const found = supportedCurrencies.find(c => c.code === savedCurrency);
      if (found) setCurrency(found);
    }

    if (savedRegion) {
      const found = supportedRegions.find(r => r.countryCode === savedRegion);
      if (found) setRegion(found);
    }
  }, []);

  // Save preferences when changed
  useEffect(() => {
    localStorage.setItem('finspire_currency', currency.code);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('finspire_region', region.countryCode);
  }, [region]);

  // Auto-detect user location and preferences
  const detectUserLocation = async () => {
    try {
      // Try to get user's timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const userLocale = navigator.language;
      
      // Find matching region based on timezone
      const matchingRegion = supportedRegions.find(r => r.timezone === userTimezone);
      if (matchingRegion) {
        setRegion(matchingRegion);
      }

      // Try to detect currency from locale
      const currencyFromLocale = new Intl.NumberFormat(userLocale, {
        style: 'currency',
        currency: 'USD'
      }).resolvedOptions().currency;

      const matchingCurrency = supportedCurrencies.find(c => c.code === currencyFromLocale);
      if (matchingCurrency) {
        setCurrency(matchingCurrency);
      }

      // Optional: Use IP geolocation service for more accurate detection
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.country_code) {
          const regionByCountry = supportedRegions.find(r => r.countryCode === data.country_code);
          if (regionByCountry) {
            setRegion(regionByCountry);
          }
        }

        if (data.currency) {
          const currencyByCountry = supportedCurrencies.find(c => c.code === data.currency);
          if (currencyByCountry) {
            setCurrency(currencyByCountry);
          }
        }
      } catch (geoError) {
        console.log('Geolocation detection failed, using browser defaults');
      }

    } catch (error) {
      console.error('Error detecting user location:', error);
    }
  };

  // Format currency according to local conventions
  const formatCurrency = (amount: number): string => {
    const absAmount = Math.abs(amount);
    const isNegative = amount < 0;
    
    // Format the number according to currency settings
    let formattedNumber = absAmount.toFixed(currency.decimals);
    
    // Apply thousands separator
    const parts = formattedNumber.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSeparator);
    
    if (currency.decimals > 0 && parts[1]) {
      formattedNumber = parts.join(currency.decimalSeparator);
    } else {
      formattedNumber = parts[0];
    }

    // Add currency symbol
    const result = currency.symbolPosition === 'before' 
      ? `${currency.symbol}${formattedNumber}`
      : `${formattedNumber} ${currency.symbol}`;

    return isNegative ? `-${result}` : result;
  };

  // Format date according to regional preferences
  const formatDate = (date: Date, format?: string): string => {
    const formatToUse = format || region.dateFormat;
    
    try {
      return new Intl.DateTimeFormat(region.numberFormat, {
        timeZone: region.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date);
    } catch (error) {
      // Fallback to basic formatting
      return date.toLocaleDateString();
    }
  };

  // Format numbers according to regional preferences
  const formatNumber = (number: number): string => {
    try {
      return new Intl.NumberFormat(region.numberFormat).format(number);
    } catch (error) {
      return number.toLocaleString();
    }
  };

  const value = {
    currency,
    region,
    setCurrency,
    setRegion,
    formatCurrency,
    formatDate,
    formatNumber,
    detectUserLocation,
    supportedCurrencies,
    supportedRegions,
  };

  return (
    <InternationalizationContext.Provider value={value}>
      {children}
    </InternationalizationContext.Provider>
  );
};