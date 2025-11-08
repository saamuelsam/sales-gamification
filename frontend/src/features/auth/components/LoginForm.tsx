// src/features/auth/components/LoginForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import api from '@/services/api';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
  // ✅ Chamada ao backend
  const { data } = await api.post('/auth/login', { email, password });

  console.log('🔎 Resposta completa:', data);
  console.log('🔎 Resposta data:', data?.data);

  const response = data?.data;

  if (!response?.user || !response?.token) {
    throw new Error('Resposta inválida do servidor. Verifique o backend.');
  }

  // ✅ Atualiza o estado global com user/token
  login(response.user, response.token);

  toast.success('Login realizado com sucesso!');

  // ✅ Adiciona aqui o delay de 200ms antes do redirecionamento
  setTimeout(() => {
    navigate('/dashboard');
  }, 200);

} catch (error: any) {
  console.error('❌ Erro no login:', error);
  toast.error(
    error?.response?.data?.message ||
      error?.message ||
      'Erro ao fazer login. Verifique o servidor.'
  );
} finally {
  setLoading(false);
}
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
          placeholder="seu@email.com"
          required
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Senha
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center">
          <input
            type="checkbox"
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="ml-2 text-gray-600">Lembrar-me</span>
        </label>
        <a
          href="/forgot-password"
          className="text-primary hover:text-highlight font-medium hover:underline transition-colors"
        >
          Esqueceu a senha?
        </a>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-highlight text-white py-3 rounded-lg font-semibold text-base shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Entrando...
          </span>
        ) : (
          'Entrar'
        )}
      </Button>
    </form>
  );
};
