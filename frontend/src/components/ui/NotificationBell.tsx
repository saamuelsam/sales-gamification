import { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata?: any;
}

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showDropdown) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showDropdown]);

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.data.count);
    } catch (error) {
      console.error('Erro ao buscar notificações');
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifications?limit=15');
      setNotifications(data.data);
    } catch (error) {
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      fetchNotifications();
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      fetchUnreadCount();
    } catch (error) {
      toast.error('Erro ao marcar como lida');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('Todas marcadas como lidas');
    } catch (error) {
      toast.error('Erro');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reward':
        return '🎁';
      case 'level_up':
        return '🆙';
      case 'goal_achieved':
        return '🎯';
      default:
        return '📢';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Agora';
    if (hours < 24) return `${hours}h atrás`;
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short' 
    });
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-bold px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" 
            onClick={() => setShowDropdown(false)} 
          />
          
          {/* Dropdown - Mobile First */}
          <div className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-auto sm:right-0 sm:left-auto sm:top-full sm:mt-2 bg-white rounded-t-3xl sm:rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col max-h-[85vh] sm:max-h-[500px] w-full sm:w-96 overflow-hidden">
            
            {/* Header */}
            <div className="shrink-0 flex justify-between items-center px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-3xl sm:rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Notificações</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs text-blue-600 font-medium">
                      {unreadCount} {unreadCount === 1 ? 'nova' : 'novas'}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    <span className="hidden sm:inline">Marcar</span>
                  </button>
                )}
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lista de Notificações */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-3">Carregando...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Tudo limpo!</p>
                  <p className="text-xs text-gray-500">Nenhuma notificação no momento</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors active:scale-[0.99] ${
                        !notif.is_read ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : ''
                      }`}
                      onClick={() => !notif.is_read && markAsRead(notif.id)}
                    >
                      <div className="flex gap-3">
                        <div className="text-3xl shrink-0 leading-none">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h4 className="font-semibold text-sm text-gray-900 leading-tight">
                              {notif.title}
                            </h4>
                            {!notif.is_read && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-1"></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed mb-2">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <span className="text-sm">🕐</span>
                            <span>{formatDate(notif.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Mobile Safe Area */}
            <div className="shrink-0 bg-gray-50 border-t border-gray-200 p-4 pb-safe sm:pb-4">
              <button 
                onClick={() => setShowDropdown(false)}
                className="w-full py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors active:scale-95"
              >
                Fechar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
