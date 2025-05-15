import getEnvVars from './env';

// Get environment configuration
const currentEnv = getEnvVars();

// Backend API bilgileri
export const API_BASE_URL = currentEnv.API_GATEWAY_URL;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: '/user/auth/signup',
    LOGIN: '/user/auth/login',
    GOOGLE_SIGNUP: '/user/auth/google-signup',
  },
  USERS: {
    PROFILE: '/user/users/profile',
  },
  ISSUES: {
    LIST: '/issue/issues',
    CREATE: '/issue/issues/report',
    DETAIL: (id: string) => `/issue/issues/${id}`,
    USER_ISSUES: '/issue/issues/user',
    UPDATE_STATUS: (id: string) => `/issue/issues/${id}/status`,
    STATISTICS: '/issue/statistics',
  },
  DEPARTMENTS: {
    LIST: '/department/departments',
  },
  NOTIFICATIONS: {
    LIST: '/notification/notifications',
    MARK_READ: (id: string, userId: string) => `/notification/notifications/${userId}/read/${id}`,
    DELETE: (id: string, userId: string) => `/notification/notifications/${userId}/${id}`,
  }
};

// API istek headers
export const getAuthHeaders = (token: string) => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
}; 