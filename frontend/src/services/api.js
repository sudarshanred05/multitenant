import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getOrdersByDate: (params) => api.get('/analytics/orders-by-date', { params }),
  getTopCustomers: (params) => api.get('/analytics/top-customers', { params }),
  getRevenue: (params) => api.get('/analytics/revenue', { params }),
  getProducts: (params) => api.get('/analytics/products', { params }),
};

export const syncAPI = {
  triggerSync: () => api.post('/sync/sync'),
  getStatus: () => api.get('/sync/status'),
};

export default api;
