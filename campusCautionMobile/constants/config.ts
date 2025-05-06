// Backend API bilgileri
export const API_BASE_URL = 'http://192.168.1.105:8000'; // Ev IP adresi

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
  },
  USERS: {
    PROFILE: '/users/profile',
  },
  ISSUES: {
    LIST: '/issues',
    CREATE: '/issues',
    DETAIL: (id: string) => `/issues/${id}`,
    USER_ISSUES: '/issues/user',
    UPDATE_STATUS: (id: string) => `/issues/${id}/status`,
  },
  DEPARTMENTS: {
    LIST: '/departments',
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
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