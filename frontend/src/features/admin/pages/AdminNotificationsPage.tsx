import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import  api  from '@/services/api';
import { 
  Bell, 
  Trash2, 
  Send, 
  RefreshCw, 
  Filter,
  User,
  Users,
  Award,
  TrendingUp,
  AlertCircle,
  Info,
  Megaphone,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'custom',
    target: 'all',
  });

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/notifications');
      setNotifications(res.data?.data || []);
      setFilteredNotifications(res.data?.data || []);
    } catch {
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async () => {
    if (!form.title || !form.message) {
      toast.error('Preencha o título e a mensagem');
      return;
    }

    setSending(true);
    try {
      await api.post('/admin/notifications', form);
      toast.success('✅ Notificação enviada com sucesso!');
      setForm({ title: '', message: '', type: 'custom', target: 'all' });
      fetchNotifications();
    } catch {
      toast.error('Erro ao enviar notificação');
    } finally {
      setSending(false);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar esta notificação?')) return;
    
    try {
      await api.delete(`/admin/notifications/${id}`);
      toast.success('✅ Notificação deletada');
      fetchNotifications();
    } catch {
      toast.error('Erro ao deletar notificação');
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm('⚠️ Tem certeza que deseja limpar TODAS as notificações? Esta ação não pode ser desfeita!')) return;
    
    try {
      // Deleta todas as notificações
      await Promise.all(notifications.map(n => api.delete(`/admin/notifications/${n.id}`)));
      toast.success('✅ Todas as notificações foram removidas');
      fetchNotifications();
    } catch {
      toast.error('Erro ao limpar notificações');
    }
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...notifications];

    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType);
    }

    if (filterRead === 'read') {
      filtered = filtered.filter(n => n.is_read === true);
    } else if (filterRead === 'unread') {
      filtered = filtered.filter(n => n.is_read === false);
    }

    setFilteredNotifications(filtered);
  }, [filterType, filterRead, notifications]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Estatísticas
  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    byType: {
      reward: notifications.filter(n => n.type === 'reward').length,
      level_up: notifications.filter(n => n.type === 'level_up').length,
      goal_achieved: notifications.filter(n => n.type === 'goal_achieved').length,
      custom: notifications.filter(n => n.type === 'custom').length,
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reward': return <Award className="w-4 h-4" />;
      case 'level_up': return <TrendingUp className="w-4 h-4" />;
      case 'goal_achieved': return <TrendingUp className="w-4 h-4" />;
      case 'custom': return <Megaphone className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      reward: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      level_up: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      goal_achieved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      custom: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return badges[type as keyof typeof badges] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      reward: 'Recompensa',
      level_up: 'Promoção',
      goal_achieved: 'Meta Atingida',
      custom: 'Personalizada',
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bell className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Central de Notificações
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Envie notificações para usuários e gerencie o histórico
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={clearAllNotifications}
            disabled={loading || notifications.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> Limpar Tudo
          </button>
          
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Enviadas</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.unread}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Não Lidas</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.byType.reward}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Recompensas</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.byType.level_up}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Promoções</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Formulário de envio */}
      <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Enviar Nova Notificação
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Nova Recompensa Disponível"
              className="mt-1 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="mt-1 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="custom">🔔 Personalizada</option>
              <option value="reward">🎁 Recompensa</option>
              <option value="level_up">📈 Promoção de Nível</option>
              <option value="goal_achieved">🎯 Meta Atingida</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mensagem</label>
            <textarea
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Digite a mensagem que será enviada aos usuários..."
              className="mt-1 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Público Alvo</label>
            <select
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })}
              className="mt-1 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">🌐 Todos os Usuários</option>
              <option value="leaders">👥 Apenas Líderes</option>
              <option value="consultants">👤 Apenas Consultores</option>
            </select>
          </div>

          <div className="flex justify-end items-end">
            <button
              onClick={sendNotification}
              disabled={sending}
              className="flex items-center gap-2 px-6 py-2 text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              <Send className={`w-4 h-4 ${sending ? 'animate-pulse' : ''}`} />
              {sending ? 'Enviando...' : 'Enviar Notificação'}
            </button>
          </div>
        </div>
      </Card>

      {/* Filtros */}
      <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filterType === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterType('reward')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filterType === 'reward' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Recompensas
            </button>
            <button
              onClick={() => setFilterType('level_up')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filterType === 'level_up' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Promoções
            </button>
            <button
              onClick={() => setFilterType('custom')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filterType === 'custom' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Personalizadas
            </button>
          </div>

          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block" />

          <div className="flex gap-2">
            <button
              onClick={() => setFilterRead('all')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filterRead === 'all' 
                  ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterRead('read')}
              className={`px-3 py-1 text-xs rounded-full transition-colors flex items-center gap-1 ${
                filterRead === 'read' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Eye className="w-3 h-3" /> Lidas
            </button>
            <button
              onClick={() => setFilterRead('unread')}
              className={`px-3 py-1 text-xs rounded-full transition-colors flex items-center gap-1 ${
                filterRead === 'unread' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <EyeOff className="w-3 h-3" /> Não Lidas
            </button>
          </div>
        </div>
      </Card>

      {/* Lista de notificações */}
      <Card className="p-4 sm:p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 overflow-x-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Histórico de Notificações ({filteredNotifications.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300">Usuário</th>
                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300">Título</th>
                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300">Mensagem</th>
                <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-300">Tipo</th>
                <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-300">Data</th>
                <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-300">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredNotifications.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                        <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">{n.user_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{n.user_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
                  </td>
                  <td className="p-3 max-w-xs">
                    <p className="text-gray-600 dark:text-gray-400 truncate">{n.message}</p>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getTypeBadge(n.type)}`}>
                      {getTypeIcon(n.type)}
                      {getTypeLabel(n.type)}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {n.is_read ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <Eye className="w-3 h-3" /> Lida
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <EyeOff className="w-3 h-3" /> Não Lida
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-xs">
                    {new Date(n.created_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      title="Deletar notificação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-16">
              <Bell className="w-16 h-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {filterType !== 'all' || filterRead !== 'all' 
                  ? 'Nenhuma notificação encontrada com os filtros aplicados' 
                  : 'Nenhuma notificação enviada ainda'}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                Envie sua primeira notificação usando o formulário acima
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
