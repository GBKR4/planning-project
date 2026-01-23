import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { logout as logoutApi } from '../api/authApi';
import toast from 'react-hot-toast';

/**
 * Custom hook for authentication
 */
const useAuth = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, login: setAuth, logout: clearAuth } = useAuthStore();

  /**
   * Login user
   */
  const login = (userData, token) => {
    setAuth(userData, token);
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      navigate('/login');
      toast.success('Logged out successfully');
    }
  };

  /**
   * Check if user is authenticated
   */
  const checkAuth = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return false;
    }
    return true;
  };

  return {
    user,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };
};

export { useAuth };
export default useAuth;
