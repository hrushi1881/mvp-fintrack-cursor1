import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
}) => {
  const { formatCurrency } = useInternationalization();
  const changeColors = {
    positive: 'text-success-500',
    negative: 'text-error-500',
    neutral: 'text-gray-500',
  };

  return (
    <GlassCard className="p-6 hover">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${changeColors[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        <div className="p-3 bg-primary-100 rounded-full">
          <Icon size={24} className="text-primary-500" />
        </div>
      </div>
    </GlassCard>
  );
};