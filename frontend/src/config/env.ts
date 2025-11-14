// Configuração de ambiente detectada automaticamente
export const getApiUrl = (): string => {
  // 1. Tenta usar variável de ambiente do Vite (se definida no build)
  const viteApiUrl = import.meta.env.VITE_API_URL;
  if (viteApiUrl) {
    console.log('🔧 Usando VITE_API_URL:', viteApiUrl);
    return viteApiUrl;
  }

  // 2. Detecta ambiente baseado no hostname
  const hostname = window.location.hostname;
  console.log('🌐 Hostname detectado:', hostname);
  
  // Desenvolvimento local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('💻 Ambiente: DESENVOLVIMENTO');
    return 'http://localhost:4000/api';
  }
  
  // Produção - usa URL relativa para o Nginx fazer o proxy
  console.log('🚀 Ambiente: PRODUÇÃO - usando /api');
  return '/api';
};

export const API_URL = getApiUrl();
console.log('✅ API_URL configurado:', API_URL);
