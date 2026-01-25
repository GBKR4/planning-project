import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, token, login } = useAuthStore();
  
  // Check localStorage directly as fallback
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('accessToken');
  
  console.log('=== PROTECTED ROUTE CHECK ===');
  console.log('Zustand state:', { isAuthenticated, hasUser: !!user, hasToken: !!token });
  console.log('LocalStorage:', { hasUser: !!storedUser, hasToken: !!storedToken });

  // If not authenticated in Zustand but we have data in localStorage, restore it
  if (!isAuthenticated && storedUser && storedToken) {
    console.log('🔄 Restoring auth from localStorage');
    try {
      const parsedUser = JSON.parse(storedUser);
      login(parsedUser, storedToken);
      console.log('✅ Auth restored, rendering protected content');
      return children;
    } catch (error) {
      console.error('Failed to parse stored user:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    }
  }

  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ Authenticated, rendering protected content');
  return children;
};

export default ProtectedRoute;
