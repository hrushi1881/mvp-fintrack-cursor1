import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface SimplifiedStatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
}

export const SimplifiedStatsCard: React.FC<SimplifiedStatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend = 'neutral',
}) => {
  const { formatCurrency } = useInternationalization();
  const trendColors = {
    up: 'text-success-500',
    down: 'text-error-500',
    neutral: 'text-gray-500',
  };

  return (
    <GlassCard className="p-4 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="p-2 bg-primary-50 rounded-xl">
          <Icon size={20} className="text-primary-500" />
        </div>
      </div>
    </GlassCard>
  );
};