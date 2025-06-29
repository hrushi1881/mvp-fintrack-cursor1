import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterFormProps {
  onToggleMode: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleMode }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, loading, authError, clearAuthError, authStatus } = useAuth();
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterFormData>();

  const password = watch('password');

  // Clear auth errors when component unmounts or mode changes
  useEffect(() => {
    return () => {
      clearAuthError();
    };
  }, [clearAuthError]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data.email, data.password, data.name);
    } catch (error: any) {
      console.error('Registration failed:', error);
      // Error is handled in the auth context
    }
  };

  if (authStatus === 'success') {
    return (
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-success-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-success-400" />
        </div>
        
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Registration Successful!
          </h3>
          <p className="text-gray-300 text-sm mb-4">
            Your account has been created successfully. You'll be redirected to the onboarding process shortly.
          </p>
        </div>
      </div>
    );
  }

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

      <Input
        label="Full Name"
        type="text"
        placeholder="e.g., John Doe"
        icon={<User size={18} className="text-gray-400" />}
        {...register('name', {
          required: 'Full name is required',
          minLength: {
            value: 2,
            message: 'Name must be at least 2 characters',
          },
        })}
        error={errors.name?.message}
      />

      <Input
        label="Email"
        type="email"
        placeholder="your.email@example.com"
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

      <div className="relative">
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          icon={<Lock size={18} className="text-gray-400" />}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: value => value === password || 'Passwords do not match',
          })}
          error={errors.confirmPassword?.message}
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-9 text-gray-400 hover:text-gray-300"
        >
          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Mail size={16} className="text-blue-400 mt-0.5" />
          <div className="text-sm">
            <p className="text-blue-400 font-medium">Account Creation</p>
            <p className="text-blue-300">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        loading={loading || authStatus === 'loading'}
      >
        Create Account
      </Button>

      <div className="text-center">
        <p className="text-sm text-gray-300">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-primary-400 hover:text-primary-300 font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </form>
  );
};