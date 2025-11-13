// src/features/team/components/AddMemberForm.tsx
import { useState } from 'react';
import { UserPlus, Mail, User as UserIcon, X } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface AddMemberFormProps {
  onMemberAdded?: () => void;
}

export const AddMemberForm = ({ onMemberAdded }: AddMemberFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      toast.error('Preencha o email do consultor');
      return;
    }

    try {
      setLoading(true);

      // ✅ Envia nome (opcional) e email (obrigatório)
      await api.post('/users/team/add', {
        name: formData.name.trim() || undefined, // envia só se preenchido
        email: formData.email.trim(),
      });

      toast.success(
        formData.name.trim() 
          ? `${formData.name} adicionado à equipe!` 
          : 'Membro adicionado à equipe!'
      );
      
      setFormData({ name: '', email: '' });
      setIsOpen(false);
      onMemberAdded?.();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erro ao adicionar membro';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setIsOpen(false);
      setFormData({ name: '', email: '' });
    }
  };

  return (
    <>
      {/* Botão para Abrir Modal */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors active:scale-95 w-full sm:w-auto"
      >
        <UserPlus className="w-5 h-5" />
        <span className="hidden sm:inline">Adicionar Membro</span>
        <span className="sm:hidden">Adicionar</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal Content */}
          <div className="fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-11/12 sm:w-96 max-h-[90vh] overflow-y-auto left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Adicionar Membro</h3>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Nome (Opcional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nome Completo <span className="text-gray-400 dark:text-gray-500 text-xs">(opcional)</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: João Silva"
                    disabled={loading}
                    autoComplete="off"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 text-gray-900 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Email (Obrigatório) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email do Consultor <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    disabled={loading}
                    autoComplete="off"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 text-gray-900 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Info Message */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <span className="font-semibold">ℹ️ Nota:</span> O consultor deve já estar cadastrado no sistema.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Adicionar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
};
