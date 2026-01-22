import apiClient from './client';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Get all busy blocks
 */
export const getBusyBlocks = async () => {
  const response = await apiClient.get(API_ENDPOINTS.BUSY_BLOCKS);
  return response.data;
};

/**
 * Create a new busy block
 * @param {Object} data - Busy block data (title, start_at, end_at)
 */
export const createBusyBlock = async (data) => {
  // Convert camelCase to snake_case for backend
  const payload = {
    title: data.title,
    start_at: data.startAt || data.start_at,
    end_at: data.endAt || data.end_at,
  };
  const response = await apiClient.post(API_ENDPOINTS.BUSY_BLOCKS, payload);
  return response.data;
};

/**
 * Delete a busy block
 * @param {number} blockId
 */
export const deleteBusyBlock = async (blockId) => {
  const response = await apiClient.delete(API_ENDPOINTS.BUSY_BLOCK_BY_ID(blockId));
  return response.data;
};
