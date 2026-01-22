import { create } from 'zustand';
import { getUser, setUser, getAccessToken, setAccessToken, clearAuthData } from '../utils/localStorage';

const useAuthStore = create((set) => ({
  user: getUser(),
  token: getAccessToken(),
  isAuthenticated: !!getAccessToken(),
  
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
