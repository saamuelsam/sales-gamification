// src/components/layout/BottomNav.tsx
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Users, Award } from 'lucide-react';
import { cn } from '@/utils/cn';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Início' },
  { path: '/sales', icon: ShoppingCart, label: 'Vendas' },
  { path: '/team', icon: Users, label: 'Equipe' },
  { path: '/benefits', icon: Award, label: 'Benefícios' },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 sm:hidden z-50">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors',
                isActive ? 'text-blue-600' : 'text-gray-600'
              )}
            >
              <Icon className={cn('w-6 h-6', isActive && 'scale-110')} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
