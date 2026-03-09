import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { forgotPassword } from '../../api/authApi';
import { forgotPasswordSchema } from '../../utils/validation';
import Button from '../../components/common/Button';
import { MdOutlineEmail } from 'react-icons/md';

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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-sm border border-gray-200">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Reset Password</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {emailSent 
              ? "Check your email for reset instructions"
              : "Enter your email and we'll send you a reset link"
            }
          </p>
        </div>

        {emailSent ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-center">
              <h3 className="text-sm font-medium text-gray-900">Email Sent</h3>
              <div className="mt-2 text-sm text-gray-700">
                <p>We've sent a password reset link to <span className="font-semibold">{getValues('email')}</span>.</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setEmailSent(false)}
                className="w-full justify-center rounded-md border border-gray-300 bg-white py-2.5 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                Try a different email
              </button>
              <Link to="/login" className="w-full">
                <button
                  type="button"
                  className="w-full justify-center rounded-md border border-transparent bg-gray-900 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  Back to login
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MdOutlineEmail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="block w-full rounded-md border border-gray-300 py-2.5 pl-10 pr-3 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 sm:text-sm"
                    placeholder="Email address"
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md border border-transparent bg-gray-900 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
            
            <div className="text-center text-sm border-t border-gray-200 mt-6 pt-6">
               <Link to="/login" className="font-medium text-gray-900 hover:text-gray-700">
                  Cancel and go back
               </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
