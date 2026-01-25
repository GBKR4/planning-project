import { create } from 'zustand';
import { getUser, setUser, getAccessToken, setAccessToken, clearAuthData } from '../utils/localStorage';
import { mockUser } from '../api/mockData';
import { USE_MOCK_DATA } from '../utils/useMockData';

const useAuthStore = create((set) => ({
  user: USE_MOCK_DATA ? mockUser : getUser(),
  token: USE_MOCK_DATA ? 'mock-token-123' : getAccessToken(),
  isAuthenticated: USE_MOCK_DATA ? true : !!getAccessToken(),
  
  // Set user and token after login/register
  login: (user, token) => {
    setUser(user);
    setAccessToken(token);
    set({ user, token, isAuthenticated: true });
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
