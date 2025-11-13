import { useState } from 'react';
import { Mail, X, RefreshCw } from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';

export default function EmailVerificationBanner() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Não mostrar se email já foi verificado ou se foi dispensado
  if (!user || user.email_verified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setLoading(true);
    try {
      await api.post('/auth/resend-verification', { email: user.email });
      toast.success('Email de verificação reenviado! Verifique sua caixa de entrada.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao reenviar email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-1">
          <Mail className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            <strong>Verifique seu email!</strong> Enviamos um link de confirmação para{' '}
            <strong>{user.email}</strong>. Verifique sua caixa de entrada e spam.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResend}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Reenviar Email
              </>
            )}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Fechar banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
