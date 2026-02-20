import apiClient from './client';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Get all tasks
 */
export const getTasks = async () => {
  const response = await apiClient.get(API_ENDPOINTS.TASKS);
  return response.data;
};

/**
 * Get a single task by ID
 * @param {number} taskId
 */
export const getTask = async (taskId) => {
  const response = await apiClient.get(API_ENDPOINTS.TASK_BY_ID(taskId));
  return response.data;
};

/**
 * Create a new task
 * @param {Object} data - Task data
 */
export const createTask = async (data) => {
  // Convert camelCase to snake_case for backend
  const payload = {
    title: data.title,
    notes: data.notes,
    estimated_minutes: data.estimatedMinutes || data.estimated_minutes,
    deadline_at: data.deadlineAt || data.deadline_at || null,
    priority: data.priority || 3,
    time_preference: data.timePreference || data.time_preference || 'anytime',
  };
  const response = await apiClient.post(API_ENDPOINTS.TASKS, payload);
  return response.data;
};

/**
 * Update a task
 * @param {number} taskId
 * @param {Object} data - Updated task data
 */
export const updateTask = async (taskId, data) => {
  // Convert camelCase to snake_case for backend
  const payload = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.notes !== undefined) payload.notes = data.notes;
  if (data.estimatedMinutes !== undefined) payload.estimated_minutes = data.estimatedMinutes;
  if (data.estimated_minutes !== undefined) payload.estimated_minutes = data.estimated_minutes;
  if (data.deadlineAt !== undefined) payload.deadline_at = data.deadlineAt;
  if (data.deadline_at !== undefined) payload.deadline_at = data.deadline_at;
  if (data.priority !== undefined) payload.priority = data.priority;
  if (data.status !== undefined) payload.status = data.status;
  if (data.timePreference !== undefined) payload.time_preference = data.timePreference;
  if (data.time_preference !== undefined) payload.time_preference = data.time_preference;
  
  const response = await apiClient.patch(API_ENDPOINTS.TASK_BY_ID(taskId), payload);
  return response.data;
};

/**
 * Delete a task
 * @param {number} taskId
 */
export const deleteTask = async (taskId) => {
  const response = await apiClient.delete(API_ENDPOINTS.TASK_BY_ID(taskId));
  return response.data;
};

/**
 * Mark task as done
 * @param {number} taskId
 */
export const markTaskDone = async (taskId) => {
  const response = await apiClient.patch(API_ENDPOINTS.TASK_BY_ID(taskId), {
    status: 'done'
  });
  return response.data;
};

/**
 * Mark task as todo
 * @param {number} taskId
 */
export const markTaskTodo = async (taskId) => {
  const response = await apiClient.patch(API_ENDPOINTS.TASK_BY_ID(taskId), {
    status: 'todo'
  });
  return response.data;
};
