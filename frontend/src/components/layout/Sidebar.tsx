// src/components/layout/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Target,
  Gift,
  Award,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/utils/cn';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['all'] },
  { path: '/sales', label: 'Vendas', icon: ShoppingCart, roles: ['all'] },
  { path: '/team', label: 'Minha Equipe', icon: Users, roles: ['all'] },
  { path: '/goals', label: 'Metas', icon: Target, roles: ['all'] },
  { path: '/commissions', label: 'Comissões', icon: DollarSign, roles: ['all'] },
  { path: '/benefits', label: 'Benefícios', icon: Gift, roles: ['all'] },
  { path: '/levels', label: 'Plano de Carreira', icon: Award, roles: ['all'] },
  { path: '/reports', label: 'Relatórios', icon: BarChart3, roles: ['admin', 'director'] },
];

export const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuthStore();

  const filteredMenu = menuItems.filter(
    (item) => item.roles.includes('all') || item.roles.includes(user?.role || '')
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Fortal</h1>
            <p className="text-xs text-gray-600">Energia Solar</p>
          </div>
        </div>

        <nav className="space-y-1">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
