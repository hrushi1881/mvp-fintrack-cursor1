import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginFormProps {
  onToggleMode: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, authError, clearAuthError, authStatus } = useAuth();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<LoginFormData>({
    defaultValues: {
      rememberMe: true,
    }
  });
  
  const rememberMe = watch('rememberMe');

  // Clear auth errors when component unmounts or mode changes
  useEffect(() => {
    return () => {
      clearAuthError();
    };
  }, [clearAuthError]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
    } catch (error: any) {
      console.error('Login failed:', error);
      // Error is handled in the auth context
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {authError && (
        <div className="bg-error-500/20 border border-error-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle size={18} className="text-error-400" />
            <p className="text-error-400 text-sm">{authError}</p>
          </div>
        </div>
      )}

      {authStatus === 'success' && (
        <div className="bg-success-500/20 border border-success-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle size={18} className="text-success-400" />
            <p className="text-success-400 text-sm">Login successful! Redirecting...</p>
          </div>
        </div>
      )}

      <Input
        label="Email"
        type="email"
        icon={<Mail size={18} className="text-gray-400" />}
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^\S+@\S+$/i,
            message: 'Please enter a valid email',
          },
        })}
        error={errors.email?.message}
      />

      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          icon={<Lock size={18} className="text-gray-400" />}
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters',
            },
          })}
          error={errors.password?.message}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-9 text-gray-400 hover:text-gray-300"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="rememberMe"
            {...register('rememberMe')}
            className="h-4 w-4 rounded border-gray-600 text-primary-500 focus:ring-primary-500 bg-black/20"
          />
          <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-300">
            Remember me
          </label>
        </div>
        <a href="#" className="text-sm text-primary-400 hover:text-primary-300">
          Forgot password?
        </a>
      </div>

      <Button type="submit" className="w-full" loading={loading || authStatus === 'loading'}>
        Sign In
      </Button>

      <div className="text-center">
        <p className="text-sm text-gray-300">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-primary-400 hover:text-primary-300 font-medium"
          >
            Sign up
          </button>
        </p>
      </div>
    </form>
  );
};