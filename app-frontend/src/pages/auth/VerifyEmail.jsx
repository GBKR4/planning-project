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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 via-pink-500 to-rose-500 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-white backdrop-blur-sm">
          {/* Verifying State with Rainbow Animation */}
          {isVerifying && (
            <div className="text-center">
              <div className="mx-auto w-20 h-20 mb-6">
                <svg className="animate-spin h-20 w-20 text-transparent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="url(#gradient)" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="url(#gradient)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor: '#667eea'}} />
                      <stop offset="50%" style={{stopColor: '#f093fb'}} />
                      <stop offset="100%" style={{stopColor: '#4facfe'}} />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">Verifying Email...</h2>
              <p className="text-gray-600 font-medium text-lg">Please wait while we verify your email address</p>
            </div>
          )}

          {/* Success State with Vibrant Colors */}
          {!isVerifying && verificationStatus === 'success' && (
            <div className="text-center animate-fadeIn">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-6 shadow-2xl animate-bounce">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">Email Verified!</h2>
              <p className="text-gray-700 mb-6 text-lg font-medium">
                Your email has been successfully verified. You can now log in to your account.
              </p>
              <Link to="/login">
                <Button variant="primary" className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white font-bold py-4 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
                  🎉 Go to Login
                </Button>
              </Link>
              <p className="mt-4 text-sm text-gray-600 font-semibold">
                ⏱️ Redirecting automatically in 3 seconds...
              </p>
            </div>
          )}

          {/* Error State with Vibrant Design */}
          {!isVerifying && verificationStatus === 'error' && (
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-red-400 via-orange-500 to-pink-600 rounded-full flex items-center justify-center mb-6 shadow-2xl animate-pulse">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-red-600 via-orange-600 to-pink-600 bg-clip-text text-transparent mb-3">Verification Failed</h2>
              <p className="text-gray-700 mb-6 font-medium text-lg">
                {errorMessage}
              </p>

              {/* Resend Verification Form with Colorful Design */}
              <div className="space-y-4">
                <div className="text-left">
                  <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-2 flex items-center space-x-1">
                    <span>📧</span>
                    <span>Email Address</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm bg-white transition-all"
                    placeholder="Enter your email"
                  />
                </div>

                <Button
                  onClick={handleResendVerification}
                  variant="primary"
                  className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 text-white font-bold py-4 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
                  loading={isResending}
                  disabled={isResending}
                >
                  ✉️ Resend Verification Email
                </Button>

                <div className="flex space-x-3">
                  <Link to="/login" className="flex-1">
                    <button className="w-full px-4 py-3 border-2 border-purple-300 text-purple-700 rounded-xl hover:bg-purple-50 transition-all font-bold shadow-md hover:shadow-lg">
                      🔙 Back to Login
                    </button>
                  </Link>
                  <Link to="/register" className="flex-1">
                    <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-bold shadow-md hover:shadow-lg">
                      ✨ Create Account
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help Text with Better Styling */}
        <p className="text-center text-sm text-white font-semibold drop-shadow-lg">
          💬 Need help? Contact support@planningapp.com
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
