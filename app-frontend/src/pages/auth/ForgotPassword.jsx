import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { forgotPassword } from '../../api/authApi';
import { forgotPasswordSchema } from '../../utils/validation';
import Button from '../../components/common/Button';

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await forgotPassword(data);
      setEmailSent(true);
      toast.success('Password reset link sent to your email!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset link. Please try again.';
      toast.error(message);
      console.error('Forgot password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-24 w-24 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 hover:rotate-6 transition-all duration-500 animate-float">
            <svg
              className="h-14 w-14 text-white drop-shadow-lg"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h2 className="mt-8 text-5xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm animate-fadeIn">
            Forgot Password? 🔑
          </h2>
          <p className="mt-4 text-lg text-gray-700 font-semibold animate-fadeIn animation-delay-200">
            {emailSent 
              ? "Check your email for reset instructions"
              : "Enter your email and we'll send you a reset link"
            }
          </p>
        </div>

        {emailSent ? (
          /* Success Message */
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border-2 border-white/50 p-10 space-y-6 animate-fadeIn animation-delay-200">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center mb-6 shadow-2xl animate-float">
                <svg className="w-12 h-12 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">Email Sent! ✨</h3>
              <p className="text-gray-700 mb-6 text-base font-semibold">
                We've sent a password reset link to <strong className="text-indigo-600">{getValues('email')}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-6 font-medium">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setEmailSent(false)}
                  className="w-full px-6 py-4 border-2 border-indigo-500 text-indigo-600 rounded-2xl hover:bg-indigo-50 transition-all duration-300 font-bold shadow-md hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  🔄 Send Again
                </button>
                <Link to="/login">
                  <button className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5">
                    ← Back to Login
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Forgot Password Form */
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border-2 border-white/50 p-10 space-y-6 animate-fadeIn animation-delay-200">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-2">
                📧 Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`w-full px-5 py-4 border-2 ${
                  errors.email ? 'border-red-400' : 'border-gray-200'
                } rounded-2xl placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 hover:border-indigo-400 bg-gray-50 hover:bg-white font-medium shadow-sm hover:shadow-md`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              Send Reset Link 🚀
            </Button>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-colors hover:underline"
              >
                ← Back to Login
              </Link>
            </div>
          </form>
        )}

        {/* Help Text */}
        <p className="text-center text-sm text-gray-700 font-semibold animate-fadeIn animation-delay-4000">
          💬 Need help? Contact support@planningapp.com
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
