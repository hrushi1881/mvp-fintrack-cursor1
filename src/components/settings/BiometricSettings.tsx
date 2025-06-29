import React, { useState } from 'react';
import { Fingerprint, ShieldCheck, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Capacitor } from '@capacitor/core';

export const BiometricSettings: React.FC = () => {
  const { biometricEnabled, toggleBiometric } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true); // In a real app, check device capability
  const isNative = Capacitor.isNativePlatform();

  const handleToggleBiometric = async () => {
    try {
      await toggleBiometric(!biometricEnabled);
    } catch (error) {
      console.error('Failed to toggle biometric authentication:', error);
    }
  };

  if (!isNative) {
    return (
      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-gray-500/20 rounded-lg">
            <Fingerprint size={20} className="text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Biometric Authentication</h2>
        </div>
        
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle size={16} className="text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-400 font-medium">Mobile Feature</p>
              <p className="text-blue-300">
                Biometric authentication is only available in the mobile app. Install the app on your device to use this feature.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-3 bg-purple-500/20 rounded-lg">
          <Fingerprint size={20} className="text-purple-400" />
        </div>
        <h2 className="text-lg font-semibold text-white">Biometric Authentication</h2>
      </div>
      
      <div className="space-y-4">
        {!isAvailable ? (
          <div className="bg-warning-500/20 border border-warning-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle size={16} className="text-warning-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-warning-400 font-medium">Not Available</p>
                <p className="text-warning-300">
                  Biometric authentication is not available on this device. Please ensure your device has fingerprint or face recognition capabilities.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Use Biometrics</p>
                <p className="text-sm text-gray-400">Sign in with fingerprint or face ID</p>
              </div>
              <button
                onClick={handleToggleBiometric}
                className="text-primary-400"
                disabled={!isAvailable}
              >
                {biometricEnabled ? (
                  <ToggleRight size={28} />
                ) : (
                  <ToggleLeft size={28} />
                )}
              </button>
            </div>
            
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <ShieldCheck size={16} className="text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-400 font-medium">Enhanced Security</p>
                  <p className="text-blue-300">
                    Biometric authentication provides an additional layer of security for your account. Your biometric data never leaves your device.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};