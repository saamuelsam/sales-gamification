import { useState } from 'react';
import { X, Mail, Loader2 } from 'lucide-react';
import { authService } from '../../../services/authService';
import { toast } from 'react-hot-toast';

interface ResendVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResendVerificationModal = ({ isOpen, onClose }: ResendVerificationModalProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Por favor, informe o email');
      return;
    }

    setLoading(true);

    try {
      await authService.resendVerification(email);
      toast.success('Email de verificação reenviado com sucesso! Verifique sua caixa de entrada.');
      setEmail('');
      onClose();
    } catch (error: any) {
      console.error('Erro ao reenviar email:', error);
      toast.error(
        error?.response?.data?.message || 
        error?.message || 
        'Erro ao reenviar email de verificação'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" />
            Reenviar Verificação
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Descrição */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Digite o email da sua conta para receber um novo link de verificação.
        </p>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:ring-2 focus:ring-primary focus:border-transparent
                       dark:bg-gray-700 dark:text-white
                       disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="seu@email.com"
              disabled={loading}
              required
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 
                       text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 
                       dark:hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary-600 text-white 
                       rounded-lg transition-colors disabled:opacity-50 
                       disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
