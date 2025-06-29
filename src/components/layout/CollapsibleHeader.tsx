import React, { ReactNode } from 'react';
import { useScrollDirection } from '../../hooks/useScrollDirection';

interface CollapsibleHeaderProps {
  children: ReactNode;
  className?: string;
  alwaysVisible?: boolean;
}

export const CollapsibleHeader: React.FC<CollapsibleHeaderProps> = ({ 
  children, 
  className = '',
  alwaysVisible = false 
}) => {
  const { scrollDirection, isAtTop } = useScrollDirection(5);

  const isVisible = alwaysVisible || isAtTop || scrollDirection === 'up';

  return (
    <header 
      className={`
        fixed top-0 left-0 right-0 z-50 
        transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-y-0' : '-translate-y-full'}
        ${!isAtTop ? 'backdrop-blur-xl bg-black/80 shadow-2xl' : 'backdrop-blur-md bg-black/20'}
        border-b border-white/10
        ${className}
      `}
    >
      {children}
    </header>
  );
};