import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { login as loginApi } from '../../api/authApi';
import useAuthStore from '../../store/authStore';
import { loginSchema } from '../../utils/validation';
import Button from '../../components/common/Button';

const Login = () => {
  const navigate = useNavigate();
  const { login: setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await loginApi(data);
      
      console.log('=== LOGIN FLOW START ===');
      console.log('1. Login API response:', response);
      
      // Ensure we have the required data
      if (!response.user || !response.accessToken) {
        throw new Error('Invalid login response - missing user or token');
      }
      
      console.log('2. Calling setAuth with:', { email: response.user.email, hasToken: !!response.accessToken });
      
      // Store user and token (backend returns accessToken)
      setAuth(response.user, response.accessToken);
      
      // Verify localStorage was updated
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('accessToken');
      console.log('3. LocalStorage check:', { 
        userStored: !!storedUser, 
        tokenStored: !!storedToken,
        userEmail: storedUser ? JSON.parse(storedUser).email : 'none'
      });
      
      toast.success('Login successful! Redirecting...');
      
      console.log('4. About to redirect to /dashboard');
      
      // Use window.location for hard navigation to ensure fresh state load
      setTimeout(() => {
        console.log('5. Redirecting with window.location...');
        window.location.href = '/dashboard';
      }, 100);
      
    } catch (error) {
      setIsLoading(false);
      const message = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      toast.error(message);
      console.error('Login error:', error);
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="mt-8 text-5xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm animate-fadeIn">
            Welcome Back ✨
          </h2>
          <p className="mt-4 text-lg text-gray-700 font-semibold animate-fadeIn animation-delay-200">
            Sign in to continue your journey
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-lg py-10 px-8 shadow-2xl rounded-3xl border-2 border-white/50 animate-fadeIn animation-delay-200 hover:shadow-3xl transition-shadow duration-300">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-2">
                📧 Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`appearance-none block w-full px-5 py-4 border-2 ${
                  errors.email ? 'border-red-400' : 'border-gray-200'
                } rounded-2xl placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 hover:border-indigo-400 bg-gray-50 hover:bg-white font-medium shadow-sm hover:shadow-md`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-800 mb-2">
                🔐 Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className={`appearance-none block w-full px-5 py-4 border-2 ${
                  errors.password ? 'border-red-400' : 'border-gray-200'
                } rounded-2xl placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 hover:border-indigo-400 bg-gray-50 hover:bg-white font-medium shadow-sm hover:shadow-md`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded-lg cursor-pointer transition-all duration-200 hover:scale-110"
                />
                <label htmlFor="remember-me" className="ml-3 block text-sm text-gray-700 font-semibold cursor-pointer hover:text-gray-900">
                  Remember me
                </label>
              </div>

              <Link
                to="/forgot-password"
                className="text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-colors hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-base text-gray-700 font-semibold animate-fadeIn animation-delay-4000">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors hover:underline"
          >
            Sign up now ✨
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
