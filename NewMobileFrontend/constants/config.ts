// Backend API bilgileri
export const API_BASE_URL = 'http://192.168.1.105:8000'; // IP adresinizi buraya yazın (ipconfig ile öğrenebilirsiniz)

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
  },
  USERS: {
    PROFILE: '/users/profile',
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