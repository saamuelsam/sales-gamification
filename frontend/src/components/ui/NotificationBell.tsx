import { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2 } from 'lucide-react';
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showDropdown) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
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
      const { data } = await api.get('/notifications?limit=20');
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

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      fetchUnreadCount();
      toast.success('Notificação removida');
    } catch (error) {
      toast.error('Erro ao remover notificação');
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
      case 'reward': return '🎁';
      case 'level_up': return '🆙';
      case 'goal_achieved': return '🎯';
      case 'commission': return '💰';
      case 'achievement': return '🏆';
      default: return '📢';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Agora';
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days}d`;

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200 active:bg-gray-200"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setShowDropdown(false)}
            aria-hidden="true"
          />

          <div
            className={`
              fixed z-50 bg-white shadow-2xl border border-gray-200
              flex flex-col overflow-hidden
              ${
                isMobile
                  ? 'inset-x-3 bottom-0 rounded-t-3xl max-h-[85vh] sm:max-h-[80vh]'
                  : 'absolute right-0 top-full mt-2 rounded-xl w-96 max-h-96'
              }
            `}
          >
            <div className="shrink-0 flex justify-between items-center px-4 py-3 sm:py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-3xl sm:rounded-t-none">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 text-xs sm:text-sm truncate">Notificações</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] sm:text-xs text-blue-600 font-medium">
                      {unreadCount} {unreadCount === 1 ? 'nova' : 'novas'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5 px-1.5 sm:px-2 py-1 rounded hover:bg-blue-100 transition-colors active:scale-95"
                    title="Marcar todas como lidas"
                  >
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden xs:inline">Marcar</span>
                  </button>
                )}
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-1 sm:p-1.5 hover:bg-gray-200 rounded-full transition-colors active:scale-95"
                  aria-label="Fechar notificações"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-6 sm:p-8">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-3 border-gray-200 border-t-blue-600"></div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-3">Carregando...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 sm:p-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1">Tudo limpo!</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`
                        p-3 sm:p-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer 
                        transition-colors duration-150 flex gap-3
                        ${!notif.is_read ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : ''}
                      `}
                    >
                      <div className="text-2xl sm:text-3xl shrink-0 leading-none">
                        {getNotificationIcon(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="font-semibold text-xs sm:text-sm text-gray-900 leading-tight line-clamp-2">
                            {notif.title}
                          </h4>
                          {!notif.is_read && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-1.5"></span>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed mb-2 line-clamp-2">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-1.5 text-[9px] sm:text-xs text-gray-400">
                          <span>🕐</span>
                          <span>{formatDate(notif.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 shrink-0">
                        {!notif.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notif.id);
                            }}
                            className="p-1.5 hover:bg-blue-100 rounded transition-colors active:scale-95"
                            title="Marcar como lida"
                          >
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="p-1.5 hover:bg-red-100 rounded transition-colors active:scale-95"
                          title="Remover"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="shrink-0 bg-gray-50 border-t border-gray-200 p-3 sm:p-4 pb-safe sm:pb-4">
              <button
                onClick={() => setShowDropdown(false)}
                className="w-full py-2 sm:py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors active:scale-95"
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
