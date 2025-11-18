// src/features/auth/pages/LoginPage.tsx
import { useState } from 'react';
import { LoginForm } from '../components/LoginForm';
import { ResendVerificationModal } from '../components/ResendVerificationModal';
import { Award, Mail } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const LoginPage = () => {
  const location = useLocation();
  const message = location.state?.message;
  const [showResendModal, setShowResendModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-highlight dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
        {/* Logo e Título */}
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <img 
            src="/logo-fortal.svg" 
            alt="Fortal Engenharia Solar" 
            className="w-48 sm:w-64 h-auto mb-4"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-primary dark:text-primary-400 text-center">
            Fortal Energia Solar
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2 text-center text-sm sm:text-base">
            Sistema de Gestão de Vendas
          </p>
        </div>

        {/* Aviso de Verificação de Email */}
        {message && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">{message}</p>
            </div>
          </div>
        )}

        {/* Formulário */}
        <LoginForm />

        {/* Link de Cadastro */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Não tem conta?{' '}
            <a 
              href="/register" 
              className="text-primary dark:text-primary-400 hover:text-highlight dark:hover:text-highlight font-semibold hover:underline transition-colors"
            >
              Cadastre-se
            </a>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Não recebeu o email de verificação?{' '}
            <button
              onClick={() => setShowResendModal(true)}
              className="text-primary dark:text-primary-400 hover:text-highlight dark:hover:text-highlight font-semibold hover:underline transition-colors"
            >
              Reenviar
            </button>
          </p>
        </div>

        {/* Modal de Reenvio */}
        <ResendVerificationModal 
          isOpen={showResendModal} 
          onClose={() => setShowResendModal(false)} 
        />

        {/* Informação Adicional */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Ao entrar, você concorda com nossos{' '}
            <a href="#" className="text-primary dark:text-primary-400 hover:text-highlight dark:hover:text-highlight hover:underline transition-colors">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href="#" className="text-primary dark:text-primary-400 hover:text-highlight dark:hover:text-highlight hover:underline transition-colors">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
