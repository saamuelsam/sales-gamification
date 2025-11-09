
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import  api  from '@/services/api';
import { RefreshCw, Search, Clock, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface ActivityLog {
  id: string;
  user_name: string;
  user_email: string;
  action: string;
  details: Record<string, any>;
  created_at: string;
}

export function AdminLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/logs', {
        params: { search: filter, action: actionFilter },
      });
      setLogs(res.data?.data || []);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toast.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs e Auditoria</h1>
          <p className="text-gray-600 text-sm">Histórico de ações executadas no sistema</p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </button>
      </div>

      {/* Filtros */}
      <Card className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm w-64"
            />
          </div>
          <input
            type="text"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="Filtrar por ação..."
            className="pl-3 pr-3 py-2 border border-gray-300 rounded-md text-sm w-48"
          />
        </div>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Aplicar filtros
        </button>
      </Card>

      {/* Lista de logs */}
      <Card className="p-4 sm:p-6 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 border-b">
              <th className="p-3 text-left font-semibold">Usuário</th>
              <th className="p-3 text-left font-semibold">Ação</th>
              <th className="p-3 text-left font-semibold">Detalhes</th>
              <th className="p-3 text-center font-semibold">Data</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                className="border-b hover:bg-gray-50 transition-colors text-gray-800"
              >
                <td className="p-3">
                  <p className="font-medium">{log.user_name || '---'}</p>
                  <p className="text-xs text-gray-500">{log.user_email || '---'}</p>
                </td>
                <td className="p-3">{log.action}</td>
                <td className="p-3 text-xs text-gray-600">
                  {Object.keys(log.details || {}).length > 0
                    ? JSON.stringify(log.details)
                    : '—'}
                </td>
                <td className="p-3 text-center text-gray-500">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {new Date(log.created_at).toLocaleString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Nenhuma atividade registrada</p>
          </div>
        )}
      </Card>
    </div>
  );
}
