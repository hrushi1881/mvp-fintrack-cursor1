import React from 'react';
import { Wallet, Sparkles } from 'lucide-react';
import Silk from '../background/Silk';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading your financial data...' 
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <Silk 
        speed={3}
        scale={2}
        color="#0f172a"
        noiseIntensity={0.8}
        rotation={0.1}
      />
      <div className="relative z-10 flex flex-col items-center text-center p-8">
        <div className="relative">
          <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Wallet size={40} className="text-primary-400" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles size={24} className="text-yellow-400 animate-pulse" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">Finspire</h2>
        <p className="text-gray-300 mb-6">{message}</p>
        
        <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
        
        <div className="mt-8 text-sm text-gray-400">
          <p>Your financial journey is loading...</p>
        </div>
      </div>
    </div>
  );
};