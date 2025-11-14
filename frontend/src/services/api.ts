import axios from 'axios';

const getApiUrl = (): string => {
  const explicitUrl = import.meta.env.VITE_API_URL;
  if (explicitUrl) {
    return explicitUrl;
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:4000/api';
  }

  return '/api';
};

const baseURL = getApiUrl().replace(/\/+$/, '');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// ✅ Interceptor para adicionar token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Interceptor global para erros HTTP
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    if (status === 401 && url !== '/auth/login') {
      localStorage.removeItem('token');
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
