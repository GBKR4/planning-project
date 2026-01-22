import apiClient from './client';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Register a new user
 */
export const register = async (data) => {
  const response = await apiClient.post(API_ENDPOINTS.REGISTER, data);
  return response.data;
};

/**
 * Login user
 */
export const login = async (data) => {
  const response = await apiClient.post(API_ENDPOINTS.LOGIN, data);
  return response.data;
};

/**
 * Logout user
 */
export const logout = async () => {
  const response = await apiClient.post(API_ENDPOINTS.LOGOUT);
  return response.data;
};

/**
 * Forgot password - send reset email
 */
export const forgotPassword = async (email) => {
  const response = await apiClient.post(API_ENDPOINTS.FORGOT_PASSWORD, { email });
  return response.data;
};

/**
 * Reset password with token
 */
export const resetPassword = async (token, newPassword) => {
  const response = await apiClient.post(API_ENDPOINTS.RESET_PASSWORD, {
    token,
    newPassword
  });
  return response.data;
};

/**
 * Verify email with token
 */
export const verifyEmail = async (token) => {
  const response = await apiClient.post(API_ENDPOINTS.VERIFY_EMAIL, { token });
  return response.data;
};

/**
 * Resend verification email
 */
export const resendVerification = async () => {
  const response = await apiClient.post(API_ENDPOINTS.RESEND_VERIFICATION);
  return response.data;
};
