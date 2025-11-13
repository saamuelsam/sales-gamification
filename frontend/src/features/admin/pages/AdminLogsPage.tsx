import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import api from '@/services/api';
import {
  RefreshCw,
  Search,
  Clock,
  FileText,
  Filter,
  User,
  Activity,
  Calendar,
  Download,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
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
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/logs', {
        params: { search: filter, action: actionFilter },
      });
      setLogs(res.data?.data || []);
      setFilteredLogs(res.data?.data || []);
      toast.success('Logs carregados com sucesso');
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toast.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros locais
  useEffect(() => {
    let filtered = [...logs];

    if (filter) {
      filtered = filtered.filter(
        (log) =>
          log.user_name?.toLowerCase().includes(filter.toLowerCase()) ||
          log.user_email?.toLowerCase().includes(filter.toLowerCase())
      );
    }

    if (actionFilter) {
      filtered = filtered.filter((log) =>
        log.action?.toLowerCase().includes(actionFilter.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [filter, actionFilter, logs]);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, []);

  // Estatísticas dos logs
  const stats = {
    total: logs.length,
    filtered: filteredLogs.length,
    users: new Set(logs.map((l) => l.user_email)).size,
    actions: new Set(logs.map((l) => l.action)).size,
  };

  // Função para exportar logs (básico)
  const exportLogs = () => {
    const csv = [
      ['Data', 'Usuário', 'Email', 'Ação', 'Detalhes'].join(','),
      ...filteredLogs.map((log) =>
        [
          new Date(log.created_at).toLocaleString('pt-BR'),
          log.user_name || '---',
          log.user_email || '---',
          log.action,
          JSON.stringify(log.details || {}),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exportados com sucesso');
  };

  // Abrir modal de detalhes
  const viewDetails = (log: ActivityLog) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  // Obter ícone baseado no tipo de ação
  const getActionIcon = (action: string) => {
    if (action.includes('login') || action.includes('Login')) return <User className="w-4 h-4" />;
    if (action.includes('venda') || action.includes('Venda') || action.includes('Sale'))
      return <CheckCircle className="w-4 h-4" />;
    if (action.includes('erro') || action.includes('Erro') || action.includes('falhou'))
      return <AlertCircle className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  // Obter cor baseada no tipo de ação
  const getActionColor = (action: string) => {
    if (action.includes('login') || action.includes('Login'))
      return 'text-blue-600 dark:text-blue-400';
    if (action.includes('venda') || action.includes('Venda') || action.includes('Sale'))
      return 'text-green-600 dark:text-green-400';
    if (action.includes('erro') || action.includes('Erro') || action.includes('falhou'))
      return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText className="w-7 h-7" />
            Logs e Auditoria
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Histórico de ações executadas no sistema
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportLogs}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 text-gray-700 dark:text-gray-300"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 text-gray-700 dark:text-gray-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total de Logs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Filtrados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.filtered}
              </p>
            </div>
            <Filter className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Usuários</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.users}</p>
            </div>
            <User className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tipos de Ações</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.actions}</p>
            </div>
            <Activity className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4 bg-white dark:bg-gray-800">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative w-full sm:w-auto flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="relative w-full sm:w-auto flex-1">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="Filtrar por ação..."
              className="pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <button
            onClick={() => {
              setFilter('');
              setActionFilter('');
            }}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 whitespace-nowrap"
          >
            Limpar filtros
          </button>
        </div>
      </Card>

      {/* Lista de logs */}
      <Card className="p-0 sm:p-0 overflow-hidden bg-white dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Usuário
                </th>
                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Ação
                </th>
                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">
                  Detalhes
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                  Data
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {log.user_name || 'Sistema'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {log.user_email || '---'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className={`flex items-center gap-2 ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                      <span className="font-medium">{log.action}</span>
                    </div>
                  </td>
                  <td className="p-3 text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate hidden md:table-cell">
                    {Object.keys(log.details || {}).length > 0
                      ? JSON.stringify(log.details).substring(0, 100) + '...'
                      : '—'}
                  </td>
                  <td className="p-3 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs">
                        {new Date(log.created_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => viewDetails(log)}
                      className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <FileText className="w-16 h-16 mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium">Nenhuma atividade registrada</p>
              <p className="text-sm mt-1">
                {logs.length === 0
                  ? 'O sistema ainda não possui logs de atividades'
                  : 'Nenhum log encontrado com os filtros aplicados'}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl bg-white dark:bg-gray-800 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Info className="w-6 h-6" />
                  Detalhes do Log
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Usuário
                  </label>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {selectedLog.user_name || 'Sistema'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedLog.user_email || '---'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Ação
                  </label>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {selectedLog.action}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Data e Hora
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {new Date(selectedLog.created_at).toLocaleString('pt-BR', {
                      dateStyle: 'full',
                      timeStyle: 'medium',
                    })}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 block">
                    Detalhes (JSON)
                  </label>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-x-auto text-gray-800 dark:text-gray-200">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Fechar
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
