import React, { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helpText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, helpText, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              "block w-full rounded-xl border-white/20 bg-black/20 backdrop-blur-sm text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors duration-200 placeholder-gray-500 py-3",
              icon && 'pl-10',
              error && 'border-error-500 focus:border-error-500 focus:ring-error-500',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-error-400">{error}</p>
        )}
        {helpText && !error && (
          <p className="text-xs text-gray-400">{helpText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';