import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  loading = false,
  disabled,
  icon,
  fullWidth = false,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black';
  
  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-xl focus:ring-primary-500',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white shadow-lg hover:shadow-xl focus:ring-secondary-500',
    outline: 'border-2 border-white/20 text-white hover:bg-white/10 focus:ring-white/30',
    ghost: 'text-gray-300 hover:bg-white/10 focus:ring-gray-500',
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>}
      {!loading && icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};