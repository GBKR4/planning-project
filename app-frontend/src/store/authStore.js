import { create } from 'zustand';
import { getUser, setUser, getAccessToken, setAccessToken, clearAuthData } from '../utils/localStorage';
import { mockUser } from '../api/mockData';
import { USE_MOCK_DATA } from '../utils/useMockData';

// Initialize from localStorage
const storedUser = getUser();
const storedToken = getAccessToken();

console.log('Auth store initializing:', { hasUser: !!storedUser, hasToken: !!storedToken });

const useAuthStore = create((set) => ({
  user: USE_MOCK_DATA ? mockUser : storedUser,
  token: USE_MOCK_DATA ? 'mock-token-123' : storedToken,
  isAuthenticated: USE_MOCK_DATA ? true : !!(storedToken && storedUser),
  
  // Set user and token after login/register
  login: (user, token) => {
    console.log('Setting auth - user:', user?.email, 'token:', !!token);
    setUser(user);
    setAccessToken(token);
    set({ user, token, isAuthenticated: true });
    console.log('Auth set complete - isAuthenticated:', true);
  },
  
  // Clear auth data on logout
  logout: () => {
    clearAuthData();
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  // Update user data
  updateUser: (userData) => {
    const updatedUser = { ...getUser(), ...userData };
    setUser(updatedUser);
    set({ user: updatedUser });
  },
}));

export default useAuthStore;
