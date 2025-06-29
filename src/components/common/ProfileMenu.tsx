import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Moon, Sun, HelpCircle, Shield, Bell, CreditCard, Target, Wallet, RefreshCw, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNotifications: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ 
  isOpen, 
  onClose,
  onOpenNotifications
}) => {
  const { user, logout, startOnboarding } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      onClose();
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  const handleStartOnboarding = () => {
    startOnboarding();
    navigate('/onboarding');
    onClose();
  };

  const menuItems = [
    { 
      icon: User, 
      label: 'Profile', 
      onClick: () => {
        navigate('/profile');
        onClose();
      }
    },
    { 
      icon: Bell, 
      label: 'Notifications', 
      onClick: () => {
        onOpenNotifications();
        onClose();
      }
    },
    { 
      icon: Target, 
      label: 'Goals', 
      onClick: () => {
        navigate('/goals');
        onClose();
      }
    },
    { 
      icon: CreditCard, 
      label: 'Liabilities', 
      onClick: () => {
        navigate('/liabilities');
        onClose();
      }
    },
    { 
      icon: Wallet, 
      label: 'Budgets', 
      onClick: () => {
        navigate('/budgets');
        onClose();
      }
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      onClick: () => {
        navigate('/settings');
        onClose();
      }
    },
    { 
      icon: RefreshCw, 
      label: 'Restart Onboarding', 
      onClick: handleStartOnboarding
    },
    { 
      icon: Info, 
      label: 'About', 
      onClick: () => {
        navigate('/about');
        onClose();
      }
    },
    { 
      icon: Shield, 
      label: 'Privacy & Security', 
      onClick: () => {
        navigate('/privacy');
        onClose();
      }
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div 
        ref={menuRef}
        className="absolute top-16 right-4 w-64 bg-black/90 backdrop-blur-md rounded-xl border border-white/10 shadow-xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* User Info */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User size={20} className="text-primary-400" />
              )}
            </div>
            <div>
              <p className="font-medium text-white">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>
        
        {/* Menu Items */}
        <div className="py-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-white/10 transition-colors text-left"
            >
              <item.icon size={18} className="text-gray-400" />
              <span className="text-sm text-white">{item.label}</span>
            </button>
          ))}
          
          <div className="border-t border-white/10 mt-2 pt-2">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-error-500/20 transition-colors text-left"
            >
              <LogOut size={18} className="text-error-400" />
              <span className="text-sm text-error-400">
                {isLoggingOut ? 'Signing out...' : t('logout')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};