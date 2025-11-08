// src/features/auth/pages/LoginPage.tsx
import { LoginForm } from '../components/LoginForm';
import { Award } from 'lucide-react';

export const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-highlight flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
        {/* Logo e Título */}
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-accent to-highlight rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Award className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary text-center">
            Fortal Energia Solar
          </h1>
          <p className="text-gray-600 mt-2 text-center text-sm sm:text-base">
            Sistema de Gestão de Vendas
          </p>
        </div>

        {/* Formulário */}
        <LoginForm />

        {/* Link de Cadastro */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Não tem conta?{' '}
            <a 
              href="/register" 
              className="text-primary hover:text-highlight font-semibold hover:underline transition-colors"
            >
              Cadastre-se
            </a>
          </p>
        </div>

        {/* Informação Adicional */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            Ao entrar, você concorda com nossos{' '}
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
