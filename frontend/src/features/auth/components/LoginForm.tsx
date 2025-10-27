import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import api from '@/services/api';
import toast from 'react-hot-toast';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔄 Tentando login...');
      
      const response = await api.post('/auth/login', { email, password });
      
      console.log('✅ Resposta:', response.data);
      
      const { user, accessToken } = response.data.data;
      
      console.log('👤 User:', user);
      console.log('🔑 Token:', accessToken.substring(0, 30) + '...');
      
      // Salvar no store
      login(user, accessToken);
      
      // Aguardar um pouco para garantir que salvou
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar se salvou
      const state = useAuthStore.getState();
      console.log('🔐 Estado atual:', state);
      
      if (state.isAuthenticated) {
        console.log('✅ Autenticado! Redirecionando...');
        toast.success(`Bem-vindo, ${user.name}!`);
        navigate('/dashboard', { replace: true });
      } else {
        console.error('❌ Falha ao autenticar');
        toast.error('Erro ao autenticar. Tente novamente.');
      }
      
    } catch (error: any) {
      console.error('❌ Erro:', error);
      toast.error(error.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          placeholder="seu@email.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Senha
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          placeholder="********"
          required
        />
      </div>

      <Button 
        type="submit" 
        className="w-full py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 mt-6" 
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Entrando...</span>
          </div>
        ) : (
          'Entrar'
        )}
      </Button>
    </form>
  );
};
