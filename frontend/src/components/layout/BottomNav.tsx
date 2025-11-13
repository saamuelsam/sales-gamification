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
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 lg:hidden z-50 pb-safe shadow-lg">
      <div className="grid grid-cols-4 h-16 max-w-screen-sm mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95',
                isActive 
                  ? 'text-primary dark:text-primary-400 bg-primary/5 dark:bg-primary/10' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-400'
              )}
            >
              <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6 transition-transform', isActive && 'scale-110')} />
              <span className={cn(
                'text-[10px] sm:text-xs font-medium',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
