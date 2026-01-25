import apiClient from './client';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Get current user (me)
 */
export const getMe = async () => {
  const response = await apiClient.get(API_ENDPOINTS.ME);
  return response.data;
};

/**
 * Get all users
 */
export const getUsers = async () => {
  const response = await apiClient.get(API_ENDPOINTS.USERS);
  return response.data;
};

/**
 * Get user by ID
 * @param {number} userId
 */
export const getUserById = async (userId) => {
  const response = await apiClient.get(API_ENDPOINTS.USER_BY_ID(userId));
  return response.data;
};

/**
 * Delete user account
 * @param {number} userId
 */
export const deleteUser = async (userId) => {
  const response = await apiClient.delete(API_ENDPOINTS.USER_BY_ID(userId));
  return response.data;
};

/**
 * Update user profile
 * @param {Object} data - { name, email }
 */
export const updateProfile = async (data) => {
  const response = await apiClient.put(API_ENDPOINTS.ME, data);
  return response.data;
};

/**
 * Change password
 * @param {Object} data - { currentPassword, newPassword }
 */
export const changePassword = async (data) => {
  const response = await apiClient.post(`${API_ENDPOINTS.ME}/password`, data);
  return response.data;
};

/**
 * Delete current user account
 * @param {Object} data - { password }
 */
export const deleteAccount = async (data) => {
  const response = await apiClient.post(`${API_ENDPOINTS.ME}/delete`, data);
  return response.data;
};
