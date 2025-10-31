// src/components/layout/Navbar.tsx
import { useAuthStore } from '@/store/authStore';
import { User, LogOut } from 'lucide-react';
import { NotificationBell } from '@/components/ui/NotificationBell';

export const Navbar = () => {
  const { user, logout } = useAuthStore();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fortal Energia Solar</h2>
          <p className="text-sm text-gray-600">Sistema de Gestão de Vendas</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Notificações - Componente Completo */}
          <NotificationBell />

          {/* Perfil */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-600 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 hover:bg-red-50 rounded-lg transition text-red-600"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};
