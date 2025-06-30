import React, { useState, useEffect } from 'react';
import { Wallet, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import Balatro from '../components/background/Balatro';
import { useAuth } from '../contexts/AuthContext';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { user, authStatus, needsOnboarding } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      // Add a small delay to ensure complete authentication
      const redirectTimer = setTimeout(() => {
      if (needsOnboarding) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
      }, 1000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [user, needsOnboarding, navigate]);

  // Redirect to onboarding after successful registration
  useEffect(() => {
    if (authStatus === 'success' && !isLogin) {
      // Extend timeout to ensure backend operations complete
      const timer = setTimeout(() => {
        navigate('/onboarding');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [authStatus, isLogin, navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Balatro 
          spinRotation={-1.5}
          spinSpeed={3.0}
          color1="#14b8a6"
          color2="#0d9488"
          color3="#0f172a"
          contrast={2.5}
          lighting={0.5}
          spinAmount={0.3}
          isRotate={true}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
            <Wallet size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Finspire</h1>
          <p className="text-gray-300 text-lg">
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xl">
          {isLogin ? (
            <LoginForm onToggleMode={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onToggleMode={() => setIsLogin(true)} />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Finspire. All rights reserved.
          </p>
          <div className="flex justify-center space-x-4 mt-2">
            <a href="#" className="text-xs text-gray-500 hover:text-primary-400">Privacy Policy</a>
            <a href="#" className="text-xs text-gray-500 hover:text-primary-400">Terms of Service</a>
            <a href="#" className="text-xs text-gray-500 hover:text-primary-400">Contact</a>
          </div>
        </div>
      </div>
    </div>
  );
};