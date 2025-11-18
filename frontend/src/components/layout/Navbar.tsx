import { useAuthStore } from '@/store/authStore';
import { User, LogOut, Bell, Check, Trash2, Loader2, X, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { ThemeToggle } from '@/components/ThemeToggle';

export const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Detectar tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Controlar overflow quando dropdown está aberto
  useEffect(() => {
    if (notifOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [notifOpen, isMobile]);

  const loadNotifications = async () => {
    try {
      setNotifLoading(true);
      const [countRes, listRes] = await Promise.all([
        api.get('/notifications/unread-count'),
        api.get('/notifications?limit=10&offset=0'),
      ]);
      setUnreadCount(countRes.data?.data?.count || 0);
      setNotifications(listRes.data?.data || []);
    } catch (e) {
      console.error('Erro ao carregar notificações:', e);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const id = setInterval(loadNotifications, 30000);
    return () => clearInterval(id);
  }, []);

  // Carregar avatar do usuário
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await api.get('/users/profile');
        const profile = response.data.data;
        setAvatarUrl(profile?.personal_data?.avatar_url);
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      }
    };
    loadUserProfile();
  }, []);

  return (
    <nav className="bg-gradient-to-r from-highlight via-orange-600 to-gray-900 border-b border-orange-500/30 px-3 sm:px-6 py-3 sm:py-4 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Título */}
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-white truncate drop-shadow-md">Fortal Energia Solar</h2>
          <p className="text-xs sm:text-sm text-orange-100 truncate">Sistema de Gestão de Vendas</p>
        </div>

        {/* Direita */}
        <div className="flex items-center gap-2 sm:gap-4 ml-4">
          {/* ✅ Theme Toggle */}
          <ThemeToggle />
          
          {/* ✅ Ícone de Notificações - Responsivo */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                if (!notifOpen) loadNotifications();
              }}
              className="relative p-2 rounded-lg border border-white/30 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all active:bg-white/30"
              title="Notificações"
            >
              {notifLoading ? (
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin" />
              ) : (
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown - Responsivo Mobile/Desktop */}
            {notifOpen && (
              <>
                {/* Backdrop - Só em mobile */}
                {isMobile && (
                  <div
                    className="fixed inset-0 bg-black/30 z-40"
                    onClick={() => setNotifOpen(false)}
                  />
                )}

                {/* Dropdown Container */}
                <div
                  className={`
                    ${
                      isMobile
                        ? 'fixed inset-x-3 bottom-0 z-50 rounded-t-3xl max-h-[80vh]'
                        : 'absolute top-14 right-0 z-50 rounded-xl w-96'
                    }
                    bg-white border border-gray-200 shadow-2xl
                    flex flex-col overflow-hidden
                  `}
                >
                  {/* Header */}
                  <div className="shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b flex items-center justify-between rounded-t-3xl sm:rounded-t-none">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900">Notificações</h4>
                    <div className="flex items-center gap-1 sm:gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={async () => {
                            try {
                              await api.put('/notifications/mark-all-read');
                              await loadNotifications();
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                        >
                          <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Marcar</span>
                        </button>
                      )}
                      <button
                        onClick={() => setNotifOpen(false)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 overflow-y-auto overscroll-contain">
                    {notifications.length === 0 ? (
                      <div className="p-6 sm:p-8 text-center text-gray-500 text-sm">
                        Nenhuma notificação
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {notifications.map((n: any) => (
                          <li
                            key={n.id}
                            className={`
                              p-3 sm:p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors
                              ${!n.is_read ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : ''}
                            `}
                          >
                            <div className="flex gap-3">
                              {/* Conteúdo */}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2">
                                  {n.title}
                                </p>
                                <p className="text-[10px] sm:text-xs text-gray-600 line-clamp-2 mt-1">
                                  {n.message}
                                </p>
                                {n.created_at && (
                                  <p className="text-[9px] sm:text-[10px] text-gray-400 mt-1">
                                    {new Date(n.created_at).toLocaleString('pt-BR')}
                                  </p>
                                )}
                              </div>

                              {/* Botões */}
                              <div className="flex flex-col gap-1 flex-shrink-0">
                                {!n.is_read && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await api.put(`/notifications/${n.id}/read`);
                                        await loadNotifications();
                                      } catch (e) {
                                        console.error(e);
                                      }
                                    }}
                                    className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                                    title="Marcar como lida"
                                  >
                                    <Check className="w-4 h-4 sm:w-4 sm:h-4 text-blue-600" />
                                  </button>
                                )}
                                <button
                                  onClick={async () => {
                                    try {
                                      await api.delete(`/notifications/${n.id}`);
                                      await loadNotifications();
                                    } catch (e) {
                                      console.error(e);
                                    }
                                  }}
                                  className="p-1.5 hover:bg-red-100 rounded transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4 sm:w-4 sm:h-4 text-red-600" />
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="shrink-0 bg-gray-50 border-t border-gray-200 p-3 sm:p-4 pb-safe sm:pb-4">
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="w-full py-2 sm:py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Perfil */}
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-white/30">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white drop-shadow-md">{user?.name}</p>
              <p className="text-xs text-orange-100 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 hover:bg-white/30 transition-all overflow-hidden border-2 border-white/50 shadow-lg"
              title="Meu Perfil"
            >
              {avatarUrl ? (
                <img
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${avatarUrl}`}
                  alt={user?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              )}
            </button>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-all text-white border border-white/30 backdrop-blur-sm active:bg-red-500/30"
            title="Sair"
          >
            <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </nav>
  );
};
