import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import  api  from '@/services/api';
import { Bell, Trash2, Send, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'info',
    target: 'all',
  });

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/notifications');
      setNotifications(res.data?.data || []);
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
      toast.success('Notificação enviada com sucesso!');
      setForm({ title: '', message: '', type: 'info', target: 'all' });
      fetchNotifications();
    } catch {
      toast.error('Erro ao enviar notificação');
    } finally {
      setSending(false);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/admin/notifications/${id}`);
      toast.success('Notificação deletada');
      fetchNotifications();
    } catch {
      toast.error('Erro ao deletar notificação');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Central de Notificações</h1>
          <p className="text-gray-600 text-sm">Envie notificações globais ou segmentadas</p>
        </div>

        <button
          onClick={fetchNotifications}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </button>
      </div>

      {/* Formulário de envio */}
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" /> Enviar Nova Notificação
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Título</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="info">Informativo</option>
              <option value="alert">Alerta</option>
              <option value="promo">Promoção</option>
              <option value="update">Atualização</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-600">Mensagem</label>
            <textarea
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Público Alvo</label>
            <select
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="leaders">Líderes</option>
              <option value="consultants">Consultores</option>
            </select>
          </div>

          <div className="flex justify-end items-center">
            <button
              onClick={sendNotification}
              disabled={sending}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${sending ? 'animate-pulse' : ''}`} />
              Enviar
            </button>
          </div>
        </div>
      </Card>

      {/* Lista de notificações */}
      <Card className="p-4 sm:p-6 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 border-b">
              <th className="p-3 text-left font-semibold">Título</th>
              <th className="p-3 text-left font-semibold">Mensagem</th>
              <th className="p-3 text-center font-semibold">Tipo</th>
              <th className="p-3 text-center font-semibold">Data</th>
              <th className="p-3 text-center font-semibold">Ação</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((n) => (
              <tr key={n.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{n.title}</td>
                <td className="p-3">{n.message}</td>
                <td className="p-3 text-center">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    {n.type}
                  </span>
                </td>
                <td className="p-3 text-center">
                  {new Date(n.created_at).toLocaleString('pt-BR')}
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {notifications.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Nenhuma notificação enviada</p>
          </div>
        )}
      </Card>
    </div>
  );
}
