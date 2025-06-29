import React from 'react';
import { User, DollarSign, Briefcase, GraduationCap } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useForm } from 'react-hook-form';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface ProfileData {
  name: string;
  age: number;
  occupation: string;
  monthlyIncome: number;
  experience: 'beginner' | 'intermediate' | 'advanced';
}

interface OnboardingProfileProps {
  onNext: (data: ProfileData) => void;
  onPrev: () => void;
  initialData?: Partial<ProfileData>;
  canGoBack?: boolean;
}

export const OnboardingProfile: React.FC<OnboardingProfileProps> = ({ 
  onNext, 
  onPrev, 
  initialData,
  canGoBack = true
}) => {
  const { currency } = useInternationalization();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ProfileData>({
    defaultValues: initialData
  });

  const experience = watch('experience');

  const experienceOptions = [
    {
      value: 'beginner',
      label: 'Beginner',
      description: 'New to personal finance',
      icon: '🌱'
    },
    {
      value: 'intermediate',
      label: 'Intermediate',
      description: 'Some experience with budgeting',
      icon: '📈'
    },
    {
      value: 'advanced',
      label: 'Advanced',
      description: 'Experienced with investments',
      icon: '🎯'
    }
  ];

  const onSubmit = (data: ProfileData) => {
    onNext(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <User size={32} className="text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Tell us about yourself</h2>
        <p className="text-gray-400">This helps us personalize your experience</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="e.g., John Doe"
            icon={<User size={18} className="text-gray-400" />}
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' }
            })}
            error={errors.name?.message}
            className="bg-black/20 border-white/20 text-white"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Age"
              type="number"
              placeholder="25"
              {...register('age', {
                required: 'Age is required',
                min: { value: 16, message: 'Must be at least 16' },
                max: { value: 100, message: 'Must be less than 100' }
              })}
              error={errors.age?.message}
              className="bg-black/20 border-white/20 text-white"
            />

            <Input
              label="Occupation"
              type="text"
              placeholder="Software Engineer"
              icon={<Briefcase size={18} className="text-gray-400" />}
              {...register('occupation', {
                required: 'Occupation is required'
              })}
              error={errors.occupation?.message}
              className="bg-black/20 border-white/20 text-white"
            />
          </div>

          <Input
            label="Monthly Income"
            type="number"
            step="0.01"
            placeholder="5000"
            icon={<CurrencyIcon currencyCode={currency.code} className="text-gray-400" />}
            {...register('monthlyIncome', {
              required: 'Monthly income is required',
              min: { value: 0, message: 'Income cannot be negative' }
            })}
            error={errors.monthlyIncome?.message}
            className="bg-black/20 border-white/20 text-white"
          />
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            <GraduationCap size={18} className="inline mr-2" />
            Financial Experience Level
          </label>
          <div className="space-y-3">
            {experienceOptions.map((option) => (
              <label key={option.value} className="cursor-pointer">
                <input
                  type="radio"
                  value={option.value}
                  {...register('experience', { required: 'Please select your experience level' })}
                  className="sr-only"
                />
                <div className={`p-4 rounded-lg border-2 transition-colors ${
                  experience === option.value 
                    ? 'border-primary-500 bg-primary-500/20 text-primary-400' 
                    : 'border-white/20 hover:border-white/30 text-gray-300'
                }`}>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm opacity-80">{option.description}</p>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
          {errors.experience && (
            <p className="text-sm text-error-400 mt-1">{errors.experience.message}</p>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
          <div className="flex items-start space-x-2">
            <div className="text-blue-400 mt-0.5">💡</div>
            <div className="text-sm">
              <p className="text-blue-400 font-medium">Privacy First</p>
              <p className="text-blue-300">
                Your personal information is encrypted and never shared with third parties. 
                You can update or delete this information anytime.
              </p>
            </div>
          </div>
        </div>

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