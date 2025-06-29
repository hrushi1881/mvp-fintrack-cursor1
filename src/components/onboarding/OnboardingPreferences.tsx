import React from 'react';
import { Settings, Bell, Calendar, TrendingUp, Fingerprint } from 'lucide-react';
import { Button } from '../common/Button';
import { useForm } from 'react-hook-form';
import { Capacitor } from '@capacitor/core';

interface PreferencesData {
  budgetPeriod: 'weekly' | 'monthly' | 'yearly';
  notifications: {
    budgetAlerts: boolean;
    goalReminders: boolean;
    billReminders: boolean;
    weeklyReports: boolean;
  };
  startOfWeek: 'sunday' | 'monday';
  theme: 'light' | 'dark' | 'auto';
  biometricEnabled?: boolean;
}

interface OnboardingPreferencesProps {
  onNext: (data: PreferencesData) => void;
  onPrev: () => void;
  initialData?: Partial<PreferencesData>;
  canGoBack?: boolean;
}

export const OnboardingPreferences: React.FC<OnboardingPreferencesProps> = ({ 
  onNext, 
  onPrev, 
  initialData,
  canGoBack = true
}) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<PreferencesData>({
    defaultValues: {
      budgetPeriod: 'monthly',
      notifications: {
        budgetAlerts: true,
        goalReminders: true,
        billReminders: true,
        weeklyReports: false,
      },
      startOfWeek: 'monday',
      theme: 'auto',
      biometricEnabled: false,
      ...initialData
    }
  });

  const budgetPeriod = watch('budgetPeriod');
  const theme = watch('theme');
  const startOfWeek = watch('startOfWeek');
  const biometricEnabled = watch('biometricEnabled');
  const isNative = Capacitor.isNativePlatform();

  const budgetPeriods = [
    { value: 'weekly', label: 'Weekly', description: 'Track weekly spending' },
    { value: 'monthly', label: 'Monthly', description: 'Most common choice' },
    { value: 'yearly', label: 'Yearly', description: 'Annual planning' },
  ];

  const themeOptions = [
    { value: 'light', label: 'Light', description: 'Clean and bright', icon: '☀️' },
    { value: 'dark', label: 'Dark', description: 'Easy on the eyes', icon: '🌙' },
    { value: 'auto', label: 'Auto', description: 'Follow system setting', icon: '🔄' },
  ];

  const onSubmit = (data: PreferencesData) => {
    onNext(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings size={32} className="text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Customize your experience</h2>
        <p className="text-gray-400">Set your preferences for the best experience</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Budget Period */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            <Calendar size={18} className="inline mr-2" />
            Default Budget Period
          </label>
          <div className="space-y-2">
            {budgetPeriods.map((period) => (
              <label key={period.value} className="cursor-pointer">
                <input
                  type="radio"
                  value={period.value}
                  {...register('budgetPeriod')}
                  className="sr-only"
                />
                <div className={`p-3 rounded-lg border-2 transition-colors ${
                  budgetPeriod === period.value 
                    ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                    : 'border-white/20 hover:border-white/30 text-gray-300'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{period.label}</p>
                      <p className="text-sm opacity-80">{period.description}</p>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            <Bell size={18} className="inline mr-2" />
            Notification Preferences
          </label>
          <div className="space-y-3 bg-black/20 rounded-lg p-4 border border-white/10">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-white">Budget Alerts</p>
                <p className="text-sm text-gray-400">Get notified when approaching budget limits</p>
              </div>
              <input
                type="checkbox"
                {...register('notifications.budgetAlerts')}
                className="rounded border-gray-600 text-primary-500 focus:ring-primary-500 bg-black/20"
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-white">Goal Reminders</p>
                <p className="text-sm text-gray-400">Periodic reminders about your financial goals</p>
              </div>
              <input
                type="checkbox"
                {...register('notifications.goalReminders')}
                className="rounded border-gray-600 text-primary-500 focus:ring-primary-500 bg-black/20"
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-white">Bill Reminders</p>
                <p className="text-sm text-gray-400">Never miss a payment deadline</p>
              </div>
              <input
                type="checkbox"
                {...register('notifications.billReminders')}
                className="rounded border-gray-600 text-primary-500 focus:ring-primary-500 bg-black/20"
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-white">Weekly Reports</p>
                <p className="text-sm text-gray-400">Summary of your financial activity</p>
              </div>
              <input
                type="checkbox"
                {...register('notifications.weeklyReports')}
                className="rounded border-gray-600 text-primary-500 focus:ring-primary-500 bg-black/20"
              />
            </label>
          </div>
        </div>

        {/* Week Start */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Week Starts On
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="cursor-pointer">
              <input
                type="radio"
                value="sunday"
                {...register('startOfWeek')}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                startOfWeek === 'sunday' 
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <p className="font-medium">Sunday</p>
              </div>
            </label>
            
            <label className="cursor-pointer">
              <input
                type="radio"
                value="monday"
                {...register('startOfWeek')}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                startOfWeek === 'monday' 
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <p className="font-medium">Monday</p>
              </div>
            </label>
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            App Theme
          </label>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => (
              <label key={option.value} className="cursor-pointer">
                <input
                  type="radio"
                  value={option.value}
                  {...register('theme')}
                  className="sr-only"
                />
                <div className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  theme === option.value 
                    ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                    : 'border-white/20 hover:border-white/30 text-gray-300'
                }`}>
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs opacity-80">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Biometric Authentication - Only for mobile */}
        {isNative && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              <Fingerprint size={18} className="inline mr-2" />
              Biometric Authentication
            </label>
            <label className="cursor-pointer">
              <input
                type="checkbox"
                {...register('biometricEnabled')}
                className="sr-only"
              />
              <div className={`p-3 rounded-lg border-2 transition-colors ${
                biometricEnabled
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                  : 'border-white/20 hover:border-white/30 text-gray-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Biometrics</p>
                    <p className="text-sm opacity-80">Sign in with fingerprint or face ID</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    biometricEnabled ? 'bg-primary-500' : 'bg-gray-600'
                  }`}>
                    {biometricEnabled ? '✓' : ''}
                  </div>
                </div>
              </div>
            </label>
          </div>
        )}

        {/* Navigation */}
        <div className="flex space-x-3 pt-4">
          {canGoBack && (
            <Button type="button" variant="outline" onClick={onPrev} className="flex-1">
              Back
            </Button>
          )}
          <Button type="submit" className="flex-1">
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
};