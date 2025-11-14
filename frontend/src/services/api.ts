// src/services/api.ts
import axios from 'axios';

// ✅ Detecta automaticamente o ambiente
// Em produção (sem VITE_API_URL definido), usa /api (relativo ao domínio)
// Em desenvolvimento, usa http://localhost:4000/api
const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_URL;
  
  // Se VITE_API_URL está definido, usa ele
  if (envURL) {
    return envURL.endsWith('/api') ? envURL : `${envURL}/api`;
  }
  
  // Se está em localhost (desenvolvimento), usa http://localhost:4000/api
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:4000/api';
  }
  
  // Em produção (qualquer outro domínio), usa /api relativo
  return '/api';
};

const baseURL = getBaseURL().replace(/\/+$/, ''); // remove barras duplicadas no final

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
