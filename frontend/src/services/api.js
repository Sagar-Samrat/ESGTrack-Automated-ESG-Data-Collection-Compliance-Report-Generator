import axios from 'axios';

// Detect whether to connect directly to FastAPI backend on port 8000 or use relative /api
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname || 'localhost';
    // If running in development Vite port 5173, connect directly to backend port 8000
    if (window.location.port === '5173') {
      return `http://${hostname}:8000/api`;
    }
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('esgtrack_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/signup') {
        localStorage.removeItem('esgtrack_token');
        localStorage.removeItem('esgtrack_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
