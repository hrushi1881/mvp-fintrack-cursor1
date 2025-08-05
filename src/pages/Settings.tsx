import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Moon, Sun, Globe, DollarSign, Smartphone, Zap, ToggleLeft, ToggleRight, ArrowLeft, Trash2, AlertTriangle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopNavigation } from '../components/layout/TopNavigation';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { Capacitor } from '@capacitor/core';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { detectUserLocation } = useInternationalization();
  
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    goalReminders: true,
    billReminders: true,
    weeklyReports: false,
  });
  
  const isNative = Capacitor.isNativePlatform();

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

  const handleDeleteAccount = () => {
    // In a real app, this would call an API to delete the user's account
    alert('Account deletion would be processed here');
    setShowDeleteAccountModal(false);
    navigate('/');
  };

  const handleClearData = () => {
    // In a real app, this would call an API to clear the user's data
    alert('Data clearing would be processed here');
    setShowClearDataModal(false);
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAutoDetectLocation = async () => {
    try {
      await detectUserLocation();
    } catch (error) {
      console.error('Auto-detection failed:', error);
    }
  };

  return (
    <div className="min-h-screen text-white pb-20">
      <TopNavigation title="Settings" />
      
      <div className="px-4 py-4 sm:py-6 space-y-6">
        <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
          Customize your app experience and preferences
        </p>

        {/* Appearance */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Moon size={20} className="text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Appearance</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Dark Mode</p>
                <p className="text-sm text-gray-400">Use dark theme throughout the app</p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="text-primary-400"
              >
                {darkMode ? (
                  <ToggleRight size={28} />
                ) : (
                  <ToggleLeft size={28} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Bell size={20} className="text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Budget Alerts</p>
                <p className="text-sm text-gray-400">Get notified when approaching budget limits</p>
              </div>
              <button
                onClick={() => toggleNotification('budgetAlerts')}
                className="text-primary-400"
              >
                {notifications.budgetAlerts ? (
                  <ToggleRight size={28} />
                ) : (
                  <ToggleLeft size={28} />
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Goal Reminders</p>
                <p className="text-sm text-gray-400">Periodic reminders about your financial goals</p>
              </div>
              <button
                onClick={() => toggleNotification('goalReminders')}
                className="text-primary-400"
              >
                {notifications.goalReminders ? (
                  <ToggleRight size={28} />
                ) : (
                  <ToggleLeft size={28} />
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Bill Reminders</p>
                <p className="text-sm text-gray-400">Never miss a payment deadline</p>
              </div>
              <button
                onClick={() => toggleNotification('billReminders')}
                className="text-primary-400"
              >
                {notifications.billReminders ? (
                  <ToggleRight size={28} />
                ) : (
                  <ToggleLeft size={28} />
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Weekly Reports</p>
                <p className="text-sm text-gray-400">Summary of your financial activity</p>
              </div>
              <button
                onClick={() => toggleNotification('weeklyReports')}
                className="text-primary-400"
              >
                {notifications.weeklyReports ? (
                  <ToggleRight size={28} />
                ) : (
                  <ToggleLeft size={28} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Globe size={20} className="text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Regional Settings</h2>
            </div>
            
            <Button
              onClick={handleAutoDetectLocation}
              size="sm"
              variant="outline"
              className="border-primary-500/30 text-primary-400 hover:bg-primary-500/10"
            >
              <Zap size={14} className="mr-2" />
              Auto-detect
            </Button>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-black/40 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Globe size={18} className="text-gray-400" />
                <span className="text-white">Language & Region</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
            
            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-black/40 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <DollarSign size={18} className="text-gray-400" />
                <span className="text-white">Currency</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </div>

        {/* Mobile App Settings */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <Smartphone size={20} className="text-orange-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Mobile App</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Offline Mode</p>
                <p className="text-sm text-gray-400">Access your data without internet</p>
              </div>
              <button className="text-primary-400">
                <ToggleRight size={28} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">App Lock</p>
                <p className="text-sm text-gray-400">Require authentication when opening app</p>
              </div>
              <button className="text-primary-400">
                <ToggleRight size={28} />
              </button>
            </div>
          </div>
        </div>

        {/* Account Management */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <SettingsIcon size={20} className="text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Account Management</h2>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-black/40 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <LogOut size={18} className="text-error-400" />
                <span className="text-white">Sign Out</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
            
            <button
              onClick={() => setShowClearDataModal(true)}
              className="w-full flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-black/40 transition-colors"
            >
              <span className="text-yellow-400">Clear All Data</span>
              <span className="text-gray-400">›</span>
            </button>
            
            <button
              onClick={() => setShowDeleteAccountModal(true)}
              className="w-full flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-black/40 transition-colors"
            >
              <span className="text-red-400">Delete Account</span>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </div>

        {/* Links */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/privacy')}
            className="w-full flex items-center justify-between p-4 bg-black/20 backdrop-blur-md rounded-xl border border-white/10 hover:bg-black/30 transition-colors"
          >
            <span className="text-white">Privacy Policy</span>
            <span className="text-gray-400">›</span>
          </button>
          
          <button
            onClick={() => navigate('/about')}
            className="w-full flex items-center justify-between p-4 bg-black/20 backdrop-blur-md rounded-xl border border-white/10 hover:bg-black/30 transition-colors"
          >
            <span className="text-white">About Finspire</span>
            <span className="text-gray-400">›</span>
          </button>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-primary-400 hover:text-primary-300 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Profile</span>
        </button>
      </div>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        title="Delete Account"
      >
        <div className="space-y-4">
          <div className="bg-red-500/20 rounded-lg p-4 border border-red-500/30">
            <div className="flex items-start space-x-3">
              <AlertTriangle size={20} className="text-red-400 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Warning: This action cannot be undone</p>
                <p className="text-red-300 text-sm mt-1">
                  Deleting your account will permanently remove all your data, including transactions, goals, budgets, and settings.
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-gray-300">
            Are you sure you want to delete your account? This action is permanent and cannot be reversed.
          </p>
          
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteAccountModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>

      {/* Clear Data Modal */}
      <Modal
        isOpen={showClearDataModal}
        onClose={() => setShowClearDataModal(false)}
        title="Clear All Data"
      >
        <div className="space-y-4">
          <div className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-500/30">
            <div className="flex items-start space-x-3">
              <AlertTriangle size={20} className="text-yellow-400 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium">Warning: This action cannot be undone</p>
                <p className="text-yellow-300 text-sm mt-1">
                  Clearing your data will remove all your transactions, goals, budgets, and settings, but will keep your account.
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-gray-300">
            Are you sure you want to clear all your data? This action is permanent and cannot be reversed.
          </p>
          
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowClearDataModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleClearData}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600"
            >
              Clear All Data
            </Button>
          </div>
        </div>
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