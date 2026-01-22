import { STORAGE_KEYS } from './constants';

/**
 * Get access token from localStorage
 */
export const getAccessToken = () => {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

/**
 * Set access token in localStorage
 */
export const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = () => {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
};

/**
 * Set refresh token in localStorage
 */
export const setRefreshToken = (token) => {
  if (token) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }
};

/**
 * Get user data from localStorage
 */
export const getUser = () => {
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Set user data in localStorage
 */
export const setUser = (user) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }
};

/**
 * Clear all auth data from localStorage
 */
export const clearAuthData = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
};

/**
 * Check if user is authenticated (has access token)
 */
export const isAuthenticated = () => {
  return !!getAccessToken();
};
