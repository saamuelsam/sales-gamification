// frontend/src/features/ceo/components/UserEmailManagement.tsx
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import api from '@/services/api';
import toast from 'react-hot-toast';
import {
  Mail,
  MailCheck,
  MailX,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Shield,
  AlertCircle
} from 'lucide-react';

interface UserEmailStatus {
  id: string;
  name: string;
  email: string;
  role: string;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  parent_name?: string;
}

export function UserEmailManagement() {
  const [users, setUsers] = useState<UserEmailStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [selectedUser, setSelectedUser] = useState<UserEmailStatus | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<'verify' | 'unverify'>('verify');

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    ceo: 'CEO',
    diretor_comercial: 'Diretor Comercial',
    director: 'Diretor',
    executive: 'Executivo',
    prime_consultant: 'Consultor Prime',
    senior_consultant: 'Consultor Senior',
    master_consultant: 'Consultor Master',
    consultant: 'Consultor',
    financeiro: 'Financeiro'
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, verifiedFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (roleFilter) params.role = roleFilter;
      if (verifiedFilter === 'verified') params.verified = true;
      if (verifiedFilter === 'unverified') params.verified = false;
      if (searchTerm) params.search = searchTerm;

      const res = await api.get('/ceo/users/email-verification', { params });
      setUsers(res.data?.data || []);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!selectedUser) return;

    try {
      const endpoint = actionType === 'verify' 
        ? `/ceo/users/${selectedUser.id}/verify-email`
        : `/ceo/users/${selectedUser.id}/unverify-email`;

      await api.patch(endpoint);
      
      toast.success(
        actionType === 'verify' 
          ? `Email de ${selectedUser.name} verificado com sucesso!`
          : `Verificação de email de ${selectedUser.name} removida!`
      );
      
      setShowConfirmModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao processar solicitação');
    }
  };

  const openConfirmModal = (user: UserEmailStatus, action: 'verify' | 'unverify') => {
    setSelectedUser(user);
    setActionType(action);
    setShowConfirmModal(true);
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: users.length,
    verified: users.filter(u => u.email_verified).length,
    unverified: users.filter(u => !u.email_verified).length,
    inactive: users.filter(u => !u.is_active).length
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Usuários</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Verificados</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.verified}</p>
            </div>
            <MailCheck className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Não Verificados</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.unverified}</p>
            </div>
            <MailX className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Inativos</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.inactive}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Search className="w-4 h-4 inline mr-2" />
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nome ou email..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Filter className="w-4 h-4 inline mr-2" />
              Cargo
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Todos os cargos</option>
              <option value="consultant">Consultores</option>
              <option value="master_consultant">Consultores Master</option>
              <option value="senior_consultant">Consultores Senior</option>
              <option value="diretor_comercial">Diretores Comerciais</option>
              <option value="ceo">CEOs</option>
              <option value="admin">Admins</option>
              <option value="financeiro">Financeiro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Status de Verificação
            </label>
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value as any)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">Todos</option>
              <option value="verified">Verificados</option>
              <option value="unverified">Não Verificados</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>
      </Card>

      {/* Lista de Usuários */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Verificação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Carregando usuários...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        {user.parent_name && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Patrocinador: {user.parent_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {user.email_verified ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              Verificado
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">
                              Não Verificado
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.email_verified ? (
                        <button
                          onClick={() => openConfirmModal(user, 'unverify')}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Remover verificação"
                        >
                          <MailX className="w-4 h-4" />
                          Remover
                        </button>
                      ) : (
                        <button
                          onClick={() => openConfirmModal(user, 'verify')}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Verificar email"
                        >
                          <MailCheck className="w-4 h-4" />
                          Verificar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Confirmação */}
      {showConfirmModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              {actionType === 'verify' ? (
                <MailCheck className="w-8 h-8 text-green-500" />
              ) : (
                <MailX className="w-8 h-8 text-red-500" />
              )}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {actionType === 'verify' ? 'Verificar Email' : 'Remover Verificação'}
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {actionType === 'verify'
                  ? 'Você está prestes a aprovar manualmente o email deste usuário:'
                  : 'Você está prestes a remover a verificação do email deste usuário:'}
              </p>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white">{selectedUser.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {roleLabels[selectedUser.role] || selectedUser.role}
                </p>
              </div>
              {actionType === 'verify' && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    ⚠️ Esta ação será registrada nos logs de auditoria.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleVerifyEmail}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium ${
                  actionType === 'verify'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionType === 'verify' ? 'Verificar' : 'Remover'}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
