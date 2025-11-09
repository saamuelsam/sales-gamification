import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import  api  from '@/services/api';
import { RefreshCw, Clock, LogIn, LogOut, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

interface AccessLog {
  id: string;
  user_name: string;
  email: string;
  ip_address: string;
  user_agent: string;
  action: 'login' | 'logout';
  created_at: string;
}

export function AdminAccessLogsPage() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAccessLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/access-logs');
      setLogs(res.data?.data || []);
    } catch (error) {
      console.error('Erro ao buscar logs de acesso:', error);
      toast.error('Erro ao carregar logs de acesso');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessLogs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs de Acesso</h1>
          <p className="text-gray-600 text-sm">Histórico de logins e logouts dos usuários</p>
        </div>

        <button
          onClick={fetchAccessLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </button>
      </div>

      <Card className="p-4 sm:p-6 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 border-b">
              <th className="p-3 text-left font-semibold">Usuário</th>
              <th className="p-3 text-center font-semibold">Ação</th>
              <th className="p-3 text-center font-semibold">Endereço IP</th>
              <th className="p-3 text-left font-semibold">Dispositivo</th>
              <th className="p-3 text-center font-semibold">Data</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="p-3">
                  <p className="font-medium text-gray-900">{log.user_name || '---'}</p>
                  <p className="text-xs text-gray-500">{log.email || '---'}</p>
                </td>

                <td className="p-3 text-center">
                  {log.action === 'login' ? (
                    <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-medium">
                      <LogIn className="w-3 h-3" /> Login
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-medium">
                      <LogOut className="w-3 h-3" /> Logout
                    </span>
                  )}
                </td>

                <td className="p-3 text-center text-gray-700">
                  {log.ip_address || '—'}
                </td>

                <td className="p-3 text-xs text-gray-500 truncate max-w-xs">
                  <Globe className="w-3 h-3 inline mr-1 text-gray-400" />
                  {log.user_agent || '—'}
                </td>

                <td className="p-3 text-center text-gray-500 whitespace-nowrap">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {new Date(log.created_at).toLocaleString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <LogIn className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Nenhum registro de acesso encontrado</p>
          </div>
        )}
      </Card>
    </div>
  );
}
