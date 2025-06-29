import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Calendar, Plus } from 'lucide-react';

export const PageNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Overview', icon: null },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/add-transaction', label: 'Add Transaction', icon: Plus },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path;
  };

  return (
    <div className="flex space-x-4 sm:space-x-6 overflow-x-auto">
      {navItems.map(({ path, label, icon: Icon }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          className={`pb-2 whitespace-nowrap text-sm sm:text-base flex items-center space-x-1 transition-colors ${
            isActive(path)
              ? 'text-primary-400 font-semibold border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {Icon && <Icon size={16} />}
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};