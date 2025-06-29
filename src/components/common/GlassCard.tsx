import React, { ReactNode } from 'react';
import { clsx } from 'clsx';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, hover = false }) => {
  return (
    <div
      className={clsx(
        'backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-xl',
        hover && 'hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:shadow-2xl hover:scale-105',
        className
      )}
    >
      {children}
    </div>
  );
};