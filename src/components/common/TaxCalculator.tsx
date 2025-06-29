import React, { useState, useMemo } from 'react';
import { Calculator, Info, DollarSign, Percent } from 'lucide-react';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

interface TaxConfig {
  country: string;
  brackets: TaxBracket[];
  standardDeduction?: number;
  socialSecurity?: number;
  medicare?: number;
  currency: string;
}

export const TaxCalculator: React.FC = () => {
  const { region, currency, formatCurrency } = useInternationalization();
  const [income, setIncome] = useState<number>(0);
  const [showDetails, setShowDetails] = useState(false);

  // Tax configurations for different countries
  const taxConfigs: Record<string, TaxConfig> = {
    'US': {
      country: 'United States',
      currency: 'USD',
      standardDeduction: 13850, // 2023 single filer
      socialSecurity: 6.2,
      medicare: 1.45,
      brackets: [
        { min: 0, max: 11000, rate: 10 },
        { min: 11000, max: 44725, rate: 12 },
        { min: 44725, max: 95375, rate: 22 },
        { min: 95375, max: 182050, rate: 24 },
        { min: 182050, max: 231250, rate: 32 },
        { min: 231250, max: 578125, rate: 35 },
        { min: 578125, max: null, rate: 37 }
      ]
    },
    'CA': {
      country: 'Canada',
      currency: 'CAD',
      standardDeduction: 15000,
      brackets: [
        { min: 0, max: 53359, rate: 15 },
        { min: 53359, max: 106717, rate: 20.5 },
        { min: 106717, max: 165430, rate: 26 },
        { min: 165430, max: 235675, rate: 29 },
        { min: 235675, max: null, rate: 33 }
      ]
    },
    'GB': {
      country: 'United Kingdom',
      currency: 'GBP',
      standardDeduction: 12570, // Personal allowance
      brackets: [
        { min: 0, max: 37700, rate: 20 },
        { min: 37700, max: 125140, rate: 40 },
        { min: 125140, max: null, rate: 45 }
      ]
    },
    'DE': {
      country: 'Germany',
      currency: 'EUR',
      standardDeduction: 10908,
      brackets: [
        { min: 0, max: 10908, rate: 0 },
        { min: 10908, max: 62810, rate: 14 }, // Progressive from 14% to 42%
        { min: 62810, max: 277826, rate: 42 },
        { min: 277826, max: null, rate: 45 }
      ]
    },
    'AU': {
      country: 'Australia',
      currency: 'AUD',
      standardDeduction: 18200,
      brackets: [
        { min: 0, max: 18200, rate: 0 },
        { min: 18200, max: 45000, rate: 19 },
        { min: 45000, max: 120000, rate: 32.5 },
        { min: 120000, max: 180000, rate: 37 },
        { min: 180000, max: null, rate: 45 }
      ]
    },
    'IN': {
      country: 'India',
      currency: 'INR',
      standardDeduction: 50000,
      brackets: [
        { min: 0, max: 250000, rate: 0 },
        { min: 250000, max: 500000, rate: 5 },
        { min: 500000, max: 1000000, rate: 20 },
        { min: 1000000, max: null, rate: 30 }
      ]
    },
    'JP': {
      country: 'Japan',
      currency: 'JPY',
      standardDeduction: 480000,
      brackets: [
        { min: 0, max: 1950000, rate: 5 },
        { min: 1950000, max: 3300000, rate: 10 },
        { min: 3300000, max: 6950000, rate: 20 },
        { min: 6950000, max: 9000000, rate: 23 },
        { min: 9000000, max: 18000000, rate: 33 },
        { min: 18000000, max: 40000000, rate: 40 },
        { min: 40000000, max: null, rate: 45 }
      ]
    }
  };

  const currentTaxConfig = taxConfigs[region.countryCode] || taxConfigs['US'];

  const taxCalculation = useMemo(() => {
    if (!income || income <= 0) {
      return {
        grossIncome: 0,
        taxableIncome: 0,
        federalTax: 0,
        socialSecurity: 0,
        medicare: 0,
        totalTax: 0,
        netIncome: 0,
        effectiveRate: 0,
        marginalRate: 0,
        breakdown: []
      };
    }

    const grossIncome = income;
    const standardDeduction = currentTaxConfig.standardDeduction || 0;
    const taxableIncome = Math.max(0, grossIncome - standardDeduction);

    let federalTax = 0;
    let marginalRate = 0;
    const breakdown: Array<{bracket: string, taxableAmount: number, rate: number, tax: number}> = [];

    // Calculate federal income tax using brackets
    for (const bracket of currentTaxConfig.brackets) {
      if (taxableIncome > bracket.min) {
        const taxableInBracket = bracket.max 
          ? Math.min(taxableIncome - bracket.min, bracket.max - bracket.min)
          : taxableIncome - bracket.min;
        
        const taxInBracket = taxableInBracket * (bracket.rate / 100);
        federalTax += taxInBracket;
        marginalRate = bracket.rate;

        if (taxableInBracket > 0) {
          breakdown.push({
            bracket: bracket.max 
              ? `${formatCurrency(bracket.min)} - ${formatCurrency(bracket.max)}`
              : `${formatCurrency(bracket.min)}+`,
            taxableAmount: taxableInBracket,
            rate: bracket.rate,
            tax: taxInBracket
          });
        }

        if (bracket.max && taxableIncome <= bracket.max) break;
      }
    }

    // Calculate payroll taxes (for US)
    const socialSecurity = currentTaxConfig.socialSecurity 
      ? Math.min(grossIncome * (currentTaxConfig.socialSecurity / 100), 160200 * 0.062) // 2023 SS wage base
      : 0;
    
    const medicare = currentTaxConfig.medicare 
      ? grossIncome * (currentTaxConfig.medicare / 100)
      : 0;

    const totalTax = federalTax + socialSecurity + medicare;
    const netIncome = grossIncome - totalTax;
    const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;

    return {
      grossIncome,
      taxableIncome,
      federalTax,
      socialSecurity,
      medicare,
      totalTax,
      netIncome,
      effectiveRate,
      marginalRate,
      breakdown
    };
  }, [income, currentTaxConfig, formatCurrency]);

  return (
    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-500/20 rounded-lg">
            <Calculator size={20} className="text-primary-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Tax Calculator</h3>
            <p className="text-sm text-gray-400">{currentTaxConfig.country} - {new Date().getFullYear()}</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Info size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Income Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Annual Gross Income
        </label>
        <div className="relative">
          <DollarSign size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="number"
            value={income || ''}
            onChange={(e) => setIncome(Number(e.target.value))}
            placeholder="Enter your annual income"
            className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400"
          />
        </div>
      </div>

      {income > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-black/20 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Net Income</p>
              <p className="text-lg font-bold text-success-400">
                {formatCurrency(taxCalculation.netIncome)}
              </p>
              <p className="text-xs text-gray-500">After taxes</p>
            </div>
            
            <div className="bg-black/20 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Total Tax</p>
              <p className="text-lg font-bold text-error-400">
                {formatCurrency(taxCalculation.totalTax)}
              </p>
              <p className="text-xs text-gray-500">
                {taxCalculation.effectiveRate.toFixed(1)}% effective rate
              </p>
            </div>
          </div>

          {/* Tax Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
              <span className="text-gray-300">Gross Income</span>
              <span className="font-medium text-white">{formatCurrency(taxCalculation.grossIncome)}</span>
            </div>
            
            {currentTaxConfig.standardDeduction && (
              <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                <span className="text-gray-300">Standard Deduction</span>
                <span className="font-medium text-success-400">
                  -{formatCurrency(currentTaxConfig.standardDeduction)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
              <span className="text-gray-300">Taxable Income</span>
              <span className="font-medium text-white">{formatCurrency(taxCalculation.taxableIncome)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
              <span className="text-gray-300">Federal Income Tax</span>
              <span className="font-medium text-error-400">{formatCurrency(taxCalculation.federalTax)}</span>
            </div>
            
            {taxCalculation.socialSecurity > 0 && (
              <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                <span className="text-gray-300">Social Security</span>
                <span className="font-medium text-error-400">{formatCurrency(taxCalculation.socialSecurity)}</span>
              </div>
            )}
            
            {taxCalculation.medicare > 0 && (
              <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                <span className="text-gray-300">Medicare</span>
                <span className="font-medium text-error-400">{formatCurrency(taxCalculation.medicare)}</span>
              </div>
            )}
          </div>

          {/* Detailed Breakdown */}
          {showDetails && taxCalculation.breakdown.length > 0 && (
            <div className="mt-6 p-4 bg-black/30 rounded-lg">
              <h4 className="font-medium text-white mb-3 flex items-center">
                <Percent size={16} className="mr-2" />
                Tax Bracket Breakdown
              </h4>
              <div className="space-y-2">
                {taxCalculation.breakdown.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">{item.bracket} ({item.rate}%)</span>
                    <span className="text-white">{formatCurrency(item.tax)}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-3 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Marginal Tax Rate</span>
                  <span className="font-medium text-warning-400">{taxCalculation.marginalRate}%</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-300">Effective Tax Rate</span>
                  <span className="font-medium text-primary-400">{taxCalculation.effectiveRate.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-4 p-3 bg-warning-500/20 border border-warning-500/30 rounded-lg">
            <p className="text-warning-400 text-xs">
              <Info size={12} className="inline mr-1" />
              This is an estimate for {currentTaxConfig.country}. Actual taxes may vary based on deductions, 
              credits, and local taxes. Consult a tax professional for accurate calculations.
            </p>
          </div>
        </>
      )}
    </div>
  );
};