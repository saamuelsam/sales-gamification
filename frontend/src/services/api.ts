// src/services/api.ts
import axios from 'axios';

// Detecta ambiente automaticamente baseado no hostname
const getApiUrl = (): string => {
  const viteApiUrl = import.meta.env.VITE_API_URL;
  if (viteApiUrl) {
    console.log('🔧 Usando VITE_API_URL:', viteApiUrl);
    return viteApiUrl;
  }

  const hostname = window.location.hostname;
  console.log('🌐 Hostname detectado:', hostname);
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('💻 Ambiente: DESENVOLVIMENTO');
    return 'http://localhost:4000/api';
  }
  
  console.log('🚀 Ambiente: PRODUÇÃO - usando /api');
  return '/api';
};

const baseURL = getApiUrl().replace(/\/+$/, '');
console.log('✅ API baseURL configurado:', baseURL);

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
