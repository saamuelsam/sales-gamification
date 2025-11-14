// src/services/api.ts
import axios from 'axios';
import { API_URL } from '@/config/env';

const baseURL = API_URL.replace(/\/+$/, ''); // remove barras duplicadas no final

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

    // ❌ NÃO redirecionar se for erro na rota de login
    if (status === 401 && url !== '/auth/login') {
      console.warn('⚠️ Token expirado ou inválido. Redirecionando para login.');
      localStorage.removeItem('token');
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    } else if (status === 401 && url === '/auth/login') {
      console.error('❌ Credenciais inválidas no login');
    } else if (status === 404) {
      console.warn(`🚫 Rota não encontrada: ${error.config?.url}`);
    } else if (status >= 500) {
      console.error('💥 Erro interno do servidor:', error.response?.data);
    }

    return Promise.reject(error);
  }
);

export default api;
