import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5050/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from auth session on every request
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('xeno_user');
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      localStorage.removeItem('xeno_user');
    }
  }
  return config;
});

// Handle 401 — clear session and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('xeno_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
