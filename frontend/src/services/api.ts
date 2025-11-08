// src/services/api.ts
import axios from 'axios';

// ✅ Detecta automaticamente o ambiente e adiciona o /api se faltar
const baseURL =
  (import.meta.env.VITE_API_URL?.endsWith('/api')
    ? import.meta.env.VITE_API_URL
    : `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`
  ).replace(/\/+$/, ''); // remove barras duplicadas no final

console.log('🌍 API Base URL:', baseURL);

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
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

    if (status === 401) {
      console.warn('⚠️ Token expirado ou inválido. Redirecionando para login.');
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (status === 404) {
      console.warn(`🚫 Rota não encontrada: ${error.config?.url}`);
    } else if (status >= 500) {
      console.error('💥 Erro interno do servidor:', error.response?.data);
    }

    return Promise.reject(error);
  }
);

export default api;
