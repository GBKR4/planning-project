import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { verifyEmail, resendVerification } from '../../api/authApi';
import Button from '../../components/common/Button';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (token) {
      handleVerifyEmail();
    } else {
      setVerificationStatus('error');
      setErrorMessage('No verification token provided');
    }
  }, [token]);

  const handleVerifyEmail = async () => {
    setIsVerifying(true);
    try {
      const response = await verifyEmail(token);
      setVerificationStatus('success');
      toast.success('Email verified successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setVerificationStatus('error');
      const message = error.response?.data?.message || 'Failed to verify email. The link may be invalid or expired.';
      setErrorMessage(message);
      toast.error(message);
      console.error('Email verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResending(true);
    try {
      await resendVerification({ email });
      toast.success('Verification email sent! Check your inbox.');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend verification email.';
      toast.error(message);
      console.error('Resend verification error:', error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Verifying State */}
          {isVerifying && (
            <div className="text-center">
              <div className="mx-auto w-16 h-16 mb-6">
                <svg className="animate-spin h-16 w-16 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email...</h2>
              <p className="text-gray-600">Please wait while we verify your email address</p>
            </div>
          )}

          {/* Success State */}
          {!isVerifying && verificationStatus === 'success' && (
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-gray-600 mb-6">
                Your email has been successfully verified. You can now log in to your account.
              </p>
              <Link to="/login">
                <Button variant="primary" className="w-full">
                  Go to Login
                </Button>
              </Link>
              <p className="mt-4 text-sm text-gray-500">
                Redirecting automatically in 3 seconds...
              </p>
            </div>
          )}

          {/* Error State */}
          {!isVerifying && verificationStatus === 'error' && (
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-gray-600 mb-6">
                {errorMessage}
              </p>

              {/* Resend Verification Form */}
              <div className="space-y-4">
                <div className="text-left">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                <Button
                  onClick={handleResendVerification}
                  variant="primary"
                  className="w-full"
                  loading={isResending}
                  disabled={isResending}
                >
                  Resend Verification Email
                </Button>

                <div className="flex space-x-3">
                  <Link to="/login" className="flex-1">
                    <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                      Back to Login
                    </button>
                  </Link>
                  <Link to="/register" className="flex-1">
                    <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                      Create Account
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help Text */}
        <p className="text-center text-xs text-gray-500">
          Need help? Contact support@planningapp.com
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
