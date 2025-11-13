import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import  api  from '@/services/api';
import { User, ShieldCheck, UserX, ArrowUpCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data?.data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await api.patch(`/admin/users/${id}/status`, { is_active: !active });
      toast.success(active ? 'Usuário desativado' : 'Usuário reativado');
      fetchUsers();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const changeRole = async (id: string, newRole: string) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role: newRole });
      toast.success('Função atualizada com sucesso');
      fetchUsers();
    } catch (error) {
      toast.error('Erro ao atualizar função');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 space-y-6 pb-20 sm:pb-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestão de Usuários</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Gerencie contas, funções e status</p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </button>
      </div>

      <Card className="p-4 sm:p-6 overflow-x-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-b dark:border-gray-600">
              <th className="p-3 text-left font-semibold">Nome</th>
              <th className="p-3 text-left font-semibold">Email</th>
              <th className="p-3 text-left font-semibold">Função</th>
              <th className="p-3 text-center font-semibold">Status</th>
              <th className="p-3 text-center font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-gray-800 dark:text-gray-200"
              >
                <td className="p-3 font-medium">{user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">
                  <select
                    value={user.role}
                    onChange={(e) => changeRole(user.id, e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md px-2 py-1 text-sm"
                  >
                    <option value="consultant">Consultor</option>
                    <option value="master_consultant">Master</option>
                    <option value="senior_consultant">Sênior</option>
                    <option value="executive">Executivo</option>
                    <option value="admin">Admin</option>
                    <option value="ceo">CEO</option>
                  </select>
                </td>
                <td className="p-3 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {user.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-3 text-center flex justify-center gap-3">
                  <button
                    onClick={() => toggleActive(user.id, user.is_active)}
                    className="p-2 rounded-md hover:bg-gray-100"
                    title={user.is_active ? 'Desativar' : 'Reativar'}
                  >
                    {user.is_active ? (
                      <UserX className="w-4 h-4 text-red-500" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                    )}
                  </button>
                  {user.role !== 'ceo' && (
                    <button
                      onClick={() => changeRole(user.id, 'ceo')}
                      className="p-2 rounded-md hover:bg-gray-100"
                      title="Promover a CEO"
                    >
                      <ArrowUpCircle className="w-4 h-4 text-blue-500" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <User className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Nenhum usuário encontrado</p>
          </div>
        )}
      </Card>
    </div>
  );
}
