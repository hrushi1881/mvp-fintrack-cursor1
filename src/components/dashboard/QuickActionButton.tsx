import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface QuickActionButtonProps {
  label: string;
  icon: LucideIcon;
  color: 'success' | 'error' | 'primary' | 'warning';
  onClick: () => void;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  label,
  icon: Icon,
  color,
  onClick,
}) => {
  const colorClasses = {
    success: 'border-success-200 bg-success-50 hover:bg-success-100 text-success-700',
    error: 'border-error-200 bg-error-50 hover:bg-error-100 text-error-700',
    primary: 'border-primary-200 bg-primary-50 hover:bg-primary-100 text-primary-700',
    warning: 'border-warning-200 bg-warning-50 hover:bg-warning-100 text-warning-700',
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${colorClasses[color]}`}
    >
      <Icon size={24} className="mb-2" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};