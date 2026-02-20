import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { resetPassword } from '../../api/authApi';
import { resetPasswordSchema } from '../../utils/validation';
import Button from '../../components/common/Button';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  // Password strength calculator
  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 10) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return Math.min(strength, 4);
  };

  const passwordStrength = calculatePasswordStrength(password);

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength === 2) return 'bg-orange-500';
    if (passwordStrength === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength === 2) return 'Fair';
    if (passwordStrength === 3) return 'Good';
    return 'Strong';
  };

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Invalid or missing reset token');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ token, password: data.password });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password. Please try again.';
      toast.error(message);
      console.error('Reset password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if token is missing
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 via-orange-500 via-pink-500 to-rose-500 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        
        <div className="max-w-md w-full text-center relative z-10">
          <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-white">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-red-400 to-rose-600 rounded-full flex items-center justify-center mb-4 shadow-2xl animate-pulse">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-2">⚠️ Invalid Reset Link</h2>
            <p className="text-gray-700 mb-6 font-medium text-lg">
              This password reset link is invalid or has expired.
            </p>
            <Link to="/forgot-password">
              <button className="px-8 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all font-bold shadow-xl hover:shadow-2xl transform hover:scale-105">
                🔄 Request New Link
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 via-indigo-500 to-pink-500 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header with Vibrant Design */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
            <svg
              className="h-12 w-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            🔐 Reset Password
          </h2>
          <p className="mt-2 text-lg font-semibold text-white drop-shadow-lg">
            Enter your new password
          </p>
        </div>

        {/* Reset Password Form with Enhanced Design */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-3xl shadow-2xl p-8 space-y-6 border-4 border-white">
          {/* New Password with Colorful Design */}
          <div>
            <label htmlFor="password" className="block text-sm font-bold text-gray-800 mb-2 flex items-center space-x-1">
              <span>🔑</span>
              <span>New Password</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('password')}
                className={`w-full px-4 py-3 pr-12 border-2 ${
                  errors.password ? 'border-red-300' : 'border-purple-300'
                } rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-2xl hover:scale-110 transition-transform"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
            )}

            {/* Password Strength Indicator with Rainbow Colors */}
            {password && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700">💪 Password Strength</span>
                  <span className={`text-xs font-black ${
                    passwordStrength <= 1 ? 'text-red-600' :
                    passwordStrength === 2 ? 'text-orange-600' :
                    passwordStrength === 3 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {getStrengthLabel()}
                  </span>
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-3 flex-1 rounded-full transition-all duration-300 ${
                        level <= passwordStrength ? getStrengthColor() : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password with Enhanced Style */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-800 mb-2 flex items-center space-x-1">
              <span>✅</span>
              <span>Confirm Password</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
              className={`w-full px-4 py-3 border-2 ${
                errors.confirmPassword ? 'border-red-300' : 'border-purple-300'
              } rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm`}
              placeholder="Confirm new password"
            />
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit Button with Gradient */}
          <Button
            type="submit"
            variant="primary"
            className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
            loading={isLoading}
            disabled={isLoading}
          >
            ✨ Reset Password
          </Button>

          {/* Back to Login with Colorful Link */}
          <div className="text-center">
            <Link
              to="/login"
              className="text-base font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-pink-700 transition-all"
            >
             ← Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
