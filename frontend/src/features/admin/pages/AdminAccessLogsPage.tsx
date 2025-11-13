import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import api from '@/services/api';
import {
  RefreshCw,
  Clock,
  LogIn,
  LogOut,
  Globe,
  Search,
  Filter,
  User,
  Download,
  Shield,
  MapPin,
  Monitor,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AccessLog {
  id: string;
  user_name: string;
  user_email: string;
  email: string;
  role: string;
  ip_address: string;
  user_agent: string;
  action: 'login' | 'logout';
  created_at: string;
}

export function AdminAccessLogsPage() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | 'login' | 'logout'>('all');

  const fetchAccessLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/access-logs', {
        params: { search: filter },
      });
      setLogs(res.data?.data || []);
      setFilteredLogs(res.data?.data || []);
      toast.success('Logs carregados com sucesso');
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

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...logs];

    if (filter) {
      filtered = filtered.filter(
        (log) =>
          log.user_name?.toLowerCase().includes(filter.toLowerCase()) ||
          log.user_email?.toLowerCase().includes(filter.toLowerCase()) ||
          log.email?.toLowerCase().includes(filter.toLowerCase()) ||
          log.ip_address?.toLowerCase().includes(filter.toLowerCase())
      );
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    setFilteredLogs(filtered);
  }, [filter, actionFilter, logs]);

  // Estatísticas
  const stats = {
    total: logs.length,
    logins: logs.filter((l) => l.action === 'login').length,
    logouts: logs.filter((l) => l.action === 'logout').length,
    uniqueUsers: new Set(logs.map((l) => l.user_email || l.email)).size,
    uniqueIPs: new Set(logs.map((l) => l.ip_address)).size,
  };

  // Exportar CSV
  const exportCSV = () => {
    const csv = [
      ['Data', 'Usuário', 'Email', 'Ação', 'IP', 'Dispositivo'].join(','),
      ...filteredLogs.map((log) =>
        [
          new Date(log.created_at).toLocaleString('pt-BR'),
          log.user_name || '---',
          log.user_email || log.email || '---',
          log.action === 'login' ? 'Login' : 'Logout',
          log.ip_address || '---',
          (log.user_agent || '---').replace(/,/g, ';'),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `access-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exportados com sucesso');
  };

  // Extrair informações do user agent
  const getBrowserInfo = (userAgent: string) => {
    if (!userAgent) return 'Desconhecido';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Outro';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield className="w-7 h-7" />
            Logs de Acesso
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Histórico de logins e logouts dos usuários
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 text-gray-700 dark:text-gray-300"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button
            onClick={fetchAccessLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 text-gray-700 dark:text-gray-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Logins</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.logins}
              </p>
            </div>
            <LogIn className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Logouts</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.logouts}</p>
            </div>
            <LogOut className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Usuários</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.uniqueUsers}
              </p>
            </div>
            <User className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">IPs Únicos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.uniqueIPs}
              </p>
            </div>
            <MapPin className="w-8 h-8 text-orange-500" />
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
              placeholder="Buscar por nome, email ou IP..."
              className="pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActionFilter('all')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                actionFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActionFilter('login')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                actionFilter === 'login'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <LogIn className="w-4 h-4" /> Logins
            </button>
            <button
              onClick={() => setActionFilter('logout')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                actionFilter === 'logout'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <LogOut className="w-4 h-4" /> Logouts
            </button>
          </div>
        </div>
      </Card>

      {/* Tabela de Logs */}
      <Card className="p-0 overflow-hidden bg-white dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Usuário
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                  Ação
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                  IP
                </th>
                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">
                  Dispositivo
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                  Data
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
                          {log.user_name || 'Usuário'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {log.user_email || log.email || '---'}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="p-3 text-center">
                    {log.action === 'login' ? (
                      <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full text-xs font-medium">
                        <LogIn className="w-3 h-3" /> Login
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full text-xs font-medium">
                        <LogOut className="w-3 h-3" /> Logout
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-700 dark:text-gray-300">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="font-mono text-xs">{log.ip_address || '—'}</span>
                    </div>
                  </td>

                  <td className="p-3 text-xs text-gray-600 dark:text-gray-400 hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      <Monitor className="w-3 h-3 text-gray-400" />
                      <span className="truncate max-w-xs">
                        {getBrowserInfo(log.user_agent)}
                      </span>
                    </div>
                  </td>

                  <td className="p-3 text-center text-gray-600 dark:text-gray-400">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs whitespace-nowrap">
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
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <Shield className="w-16 h-16 mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium">Nenhum registro de acesso</p>
              <p className="text-sm mt-1">
                {logs.length === 0
                  ? 'Ainda não há logs de acesso no sistema'
                  : 'Nenhum log encontrado com os filtros aplicados'}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
