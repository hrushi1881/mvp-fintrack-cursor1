import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Receipt, BarChart3, Target, User } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const { t } = useTranslation();

  const navItems = [
    { path: '/', icon: Home, label: t('navigation.home') },
    { path: '/transactions', icon: Receipt, label: 'Transactions' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/goals', icon: Target, label: 'Goals' },
    { path: '/profile', icon: User, label: t('navigation.profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-charcoal-800/95 backdrop-blur-md border-t border-charcoal-700 safe-area-pb z-40">
      <div className="flex justify-around items-center py-1 sm:py-2">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 ${
                isActive
                  ? 'text-primary-400 bg-primary-500/10'
                  : 'text-gray-500 hover:text-primary-400 hover:bg-charcoal-700'
              }`
            }
          >
            <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="text-xs mt-1 font-medium truncate">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};