// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth (no /api prefix)
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  FORGOT_PASSWORD: '/auth/forgotpassword',
  RESET_PASSWORD: '/auth/resetpassword',
  VERIFY_EMAIL: '/auth/verifyemail',
  RESEND_VERIFICATION: '/auth/resend-verification',
  PROFILE: '/api/profile',
  CHANGE_PASSWORD: '/api/change-password',
  
  // Tasks
  TASKS: '/api/tasks',
  TASK_BY_ID: (id) => `/api/tasks/${id}`,
  
  // Busy Blocks (lowercase, no hyphen)
  BUSY_BLOCKS: '/api/busyblocks',
  BUSY_BLOCK_BY_ID: (id) => `/api/busyblocks/${id}`,
  
  // Plans
  PLANS: '/api/plans',
  GENERATE_PLAN: '/api/plans/generate',
  ADD_PLAN_BLOCK: '/api/plans/blockplan',
  BLOCK_DONE: (blockId) => `/api/plans/blocks/${blockId}/done`,
  BLOCK_MISSED: (blockId) => `/api/plans/blocks/${blockId}/missed`,
  
  // Users
  ME: '/api/me',
  USERS: '/api/users',
  USER_BY_ID: (id) => `/api/users/${id}`,
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

// Time Preference
export const TIME_PREFERENCE = {
  MORNING: 'morning',
  EVENING: 'evening',
  ANYTIME: 'anytime'
};

export const TIME_PREFERENCE_LABELS = {
  morning: 'Morning',
  evening: 'Evening',
  anytime: 'Anytime'
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
