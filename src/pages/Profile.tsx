import React, { useState } from 'react';
import { User, Settings, Bell, Shield, HelpCircle, Info, LogOut, Repeat, DollarSign, Globe, Calculator, RefreshCw, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopNavigation } from '../components/layout/TopNavigation';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { CurrencySelector } from '../components/common/CurrencySelector';
import { RegionSelector } from '../components/common/RegionSelector';
import { TaxCalculator } from '../components/common/TaxCalculator';
import { NotificationsPanel } from '../components/common/NotificationsPanel';
import { CategoryManagement } from '../components/settings/CategoryManagement';
import { useAuth } from '../contexts/AuthContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const { detectUserLocation } = useInternationalization();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const handleRestartOnboarding = () => {
    navigate('/onboarding');
  };

  const handleAutoDetectLocation = async () => {
    try {
      await detectUserLocation();
    } catch (error) {
      console.error('Auto-detection failed:', error);
    }
  };

  const menuItems = [
    { 
      icon: Repeat, 
      label: 'Recurring Transactions', 
      description: 'Manage automatic transactions',
      onClick: () => navigate('/recurring-transactions')
    },
    { 
      icon: Bell, 
      label: 'Notifications', 
      description: 'Manage alerts and reminders',
      onClick: () => setShowNotifications(true)
    },
    {
      icon: Tag,
      label: 'Categories',
      description: 'Customize transaction categories',
      onClick: () => setShowCategoryModal(true)
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      description: 'App preferences and configuration',
      onClick: () => navigate('/settings')
    },
    { 
      icon: Shield, 
      label: 'Privacy', 
      description: 'Security and privacy settings',
      onClick: () => navigate('/privacy')
    },
    { 
      icon: Info, 
      label: 'About', 
      description: 'About Finspire',
      onClick: () => navigate('/about')
    },
  ];

  return (
    <div className="min-h-screen text-white pb-20">
      <TopNavigation title={t('profile_title')} />
      
      <div className="px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* User Info */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 text-center border border-white/10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User size={24} className="text-primary-400 sm:w-8 sm:h-8" />
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-1">
            {user?.name || 'User'}
          </h2>
          <p className="text-gray-400 text-sm sm:text-base">{user?.email}</p>
          <p className="text-xs text-gray-500 mt-2">
            Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
          </p>
          
          {/* Restart Onboarding Button */}
          <Button
            onClick={handleRestartOnboarding}
            variant="outline"
            size="sm"
            className="mt-4 border-primary-500/30 text-primary-400 hover:bg-primary-500/10"
          >
            <RefreshCw size={14} className="mr-2" />
            Go to Onboarding
          </Button>
        </div>

        {/* International Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">International Settings</h3>
            <Button
              onClick={handleAutoDetectLocation}
              size="sm"
              variant="outline"
              className="border-primary-500/30 text-primary-400 hover:bg-primary-500/10"
            >
              <Globe size={14} className="mr-2" />
              Auto-detect
            </Button>
          </div>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Currency Selector */}
          <CurrencySelector />

          {/* Region Selector */}
          <RegionSelector />
        </div>

        {/* Tax Calculator */}
        <TaxCalculator />

        {/* Menu Items */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Settings</h3>
          {menuItems.map((item) => (
            <div key={item.label} className="bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-black/30 transition-all duration-200">
              <button 
                className="w-full p-4 flex items-center space-x-4 text-left"
                onClick={item.onClick}
              >
                <div className="p-2 bg-white/10 rounded-lg">
                  <item.icon size={18} className="text-gray-400 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white text-sm sm:text-base">{item.label}</p>
                  <p className="text-xs sm:text-sm text-gray-400">{item.description}</p>
                </div>
                <span className="text-gray-400 text-lg">›</span>
              </button>
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div className="pt-4">
          <Button
            onClick={() => setShowLogoutConfirm(true)}
            variant="outline"
            className="w-full border-error-500 text-error-400 hover:bg-error-500/10"
          >
            <LogOut size={18} className="mr-2" />
            {t('logout')}
          </Button>
        </div>

        {/* App Info */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10">
          <div className="flex items-center space-x-3 text-gray-400">
            <Info size={14} className="sm:w-4 sm:h-4" />
            <div className="text-xs sm:text-sm">
              <p className="text-white">Finance Tracker v1.0.0</p>
              <p className="text-gray-400">Built for global financial management</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      <NotificationsPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />

      {/* Category Management Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Manage Categories"
      >
        <CategoryManagement />
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Sign Out"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to sign out? You'll need to sign in again to access your account.
          </p>
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogout}
              className="flex-1 bg-error-500 hover:bg-error-600"
              loading={isLoggingOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};