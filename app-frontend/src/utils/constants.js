// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  VERIFY_EMAIL: '/api/auth/verify-email',
  RESEND_VERIFICATION: '/api/auth/resend-verification',
  
  // Tasks
  TASKS: '/api/tasks',
  TASK_BY_ID: (id) => `/api/tasks/${id}`,
  
  // Busy Blocks
  BUSY_BLOCKS: '/api/busy-blocks',
  BUSY_BLOCK_BY_ID: (id) => `/api/busy-blocks/${id}`,
  
  // Plans
  PLANS: '/api/plans',
  GENERATE_PLAN: '/api/plans/generate',
  PLAN_BLOCKS: '/api/plan/blocks',
  BLOCK_DONE: (blockId) => `/api/plan/blocks/${blockId}/done`,
  BLOCK_MISSED: (blockId) => `/api/plan/blocks/${blockId}/missed`,
  
  // Users
  USER_PROFILE: '/api/users/profile',
};

// Task Priority Levels
export const TASK_PRIORITY = {
  LOW: 1,
  MEDIUM: 2,
  NORMAL: 3,
  HIGH: 4,
  URGENT: 5
};

export const PRIORITY_LABELS = {
  1: 'Low',
  2: 'Medium',
  3: 'Normal',
  4: 'High',
  5: 'Urgent'
};

export const PRIORITY_COLORS = {
  1: 'bg-gray-100 text-gray-800 border-gray-300',
  2: 'bg-blue-100 text-blue-800 border-blue-300',
  3: 'bg-green-100 text-green-800 border-green-300',
  4: 'bg-orange-100 text-orange-800 border-orange-300',
  5: 'bg-red-100 text-red-800 border-red-300'
};

// Task Status
export const TASK_STATUS = {
  TODO: 'todo',
  DONE: 'done'
};

// Block Types
export const BLOCK_TYPE = {
  TASK: 'task',
  BREAK: 'break'
};

// Block Status
export const BLOCK_STATUS = {
  SCHEDULED: 'scheduled',
  DONE: 'done',
  MISSED: 'missed'
};

// Time Constants
export const DEFAULT_WORK_START = '09:00';
export const DEFAULT_WORK_END = '22:00';

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user'
};
