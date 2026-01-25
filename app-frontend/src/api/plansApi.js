import apiClient from './client';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Generate a plan for a specific date
 * @param {Object} data - Plan data (date, workStart, workEnd)
 */
export const generatePlan = async (data) => {
  const response = await apiClient.post(API_ENDPOINTS.GENERATE_PLAN, data);
  return response.data;
};

/**
 * Get plan for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 */
export const getPlan = async (date) => {
  const response = await apiClient.get(API_ENDPOINTS.PLANS, {
    params: { date }
  });
  return response.data;
};

/**
 * Create a daily plan
 * @param {Object} data - Plan data (plan_date, work_start, work_end)
 */
export const createDailyPlan = async (data) => {
  const response = await apiClient.post(API_ENDPOINTS.PLANS, data);
  return response.data;
};

/**
 * Add a plan block
 * @param {Object} data - Block data (plan_id, task_id, block_type, start_at, end_at)
 */
export const addPlanBlock = async (data) => {
  const response = await apiClient.post(API_ENDPOINTS.ADD_PLAN_BLOCK, data);
  return response.data;
};

/**
 * Mark a plan block as done
 * @param {number} blockId
 * @param {boolean} markTaskDone - Whether to mark the associated task as done
 */
export const markBlockDone = async (blockId, markTaskDone = true) => {
  const response = await apiClient.post(API_ENDPOINTS.BLOCK_DONE(blockId), {
    markTaskDone
  });
  return response.data;
};

/**
 * Mark a plan block as missed and automatically reschedule the task
 * @param {number} blockId
 */
export const markBlockMissed = async (blockId) => {
  const response = await apiClient.post(API_ENDPOINTS.BLOCK_MISSED(blockId));
  return response.data;
};
