// src/features/auth/pages/RegisterPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Award, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      toast.success('Cadastro realizado! Verifique seu email antes de fazer login.');
      navigate('/login', { state: { message: 'Por favor, verifique seu email antes de fazer login.' } });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  // Validação visual da senha
  const passwordStrength = {
    hasMinLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-highlight flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 border dark:border-gray-700">
        {/* Logo e Título */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-accent to-highlight rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Award className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary dark:text-white">Criar Conta</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-center text-sm">
            Junte-se à equipe Fortal Energia Solar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome Completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
              placeholder="João Silva"
              required
              autoFocus
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
              placeholder="seu@email.com"
              required
            />
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Senha *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Indicadores de força da senha */}
            {formData.password && (
              <div className="mt-2 space-y-1.5">
                <div className={`flex items-center gap-2 text-xs ${passwordStrength.hasMinLength ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${passwordStrength.hasMinLength ? 'text-green-600' : 'text-gray-400'}`} />
                  Mínimo 8 caracteres
                </div>
                <div className={`flex items-center gap-2 text-xs ${passwordStrength.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${passwordStrength.hasUpperCase ? 'text-green-600' : 'text-gray-400'}`} />
                  Letra maiúscula
                </div>
                <div className={`flex items-center gap-2 text-xs ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-400'}`} />
                  Número
                </div>
              </div>
            )}
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Senha *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 transition-all text-base ${
                  formData.confirmPassword && !passwordsMatch
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-primary focus:border-primary'
                }`}
                placeholder="Digite a senha novamente"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Feedback de senhas correspondentes */}
            {formData.confirmPassword && (
              <div className="mt-2">
                {passwordsMatch ? (
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    As senhas coincidem
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-red-600">
                    <span className="w-3.5 h-3.5 flex items-center justify-center">✕</span>
                    As senhas não coincidem
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botão de Cadastro */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-highlight text-white py-3 rounded-lg font-semibold text-base shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Cadastrando...
              </span>
            ) : (
              'Criar Conta'
            )}
          </Button>
        </form>

        {/* Link de Login */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Já tem conta?{' '}
            <a href="/login" className="text-primary hover:text-highlight font-semibold hover:underline transition-colors">
              Fazer Login
            </a>
          </p>
        </div>

        {/* Termos e Condições */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            Ao criar uma conta, você concorda com nossos{' '}
            <a href="#" className="text-primary hover:text-highlight hover:underline transition-colors">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href="#" className="text-primary hover:text-highlight hover:underline transition-colors">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
