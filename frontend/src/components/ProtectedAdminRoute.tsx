import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import React from 'react';

// Rota protegida para CEO apenas
export function ProtectedCEORoute({ children }: { children: React.ReactElement }) {
  const { user } = useAuthStore();
  const isCEO = user?.role === 'ceo';

  if (!isCEO) return <Navigate to="/" replace />;
  return children;
}

// Rota protegida para Financeiro (CEO + Financeiro)
export function ProtectedFinanceiroRoute({ children }: { children: React.ReactElement }) {
  const { user } = useAuthStore();
  const hasFinanceAccess = user?.role === 'ceo' || user?.role === 'financeiro';

  if (!hasFinanceAccess) return <Navigate to="/" replace />;
  return children;
}

// Rota protegida para Admin (CEO + Admin)
export function ProtectedAdminRoute({ children }: { children: React.ReactElement }) {
  const { user } = useAuthStore();
  const hasAdminAccess = user?.role === 'ceo' || user?.role === 'admin';

  if (!hasAdminAccess) return <Navigate to="/" replace />;
  return children;
}

// Rota protegida para visualizações amplas (CEO + Admin + Director)
export function ProtectedAdminViewRoute({ children }: { children: React.ReactElement }) {
  const { user } = useAuthStore();
  const hasViewAccess = user?.role === 'ceo' || user?.role === 'admin' || user?.role === 'director';

  if (!hasViewAccess) return <Navigate to="/" replace />;
  return children;
}
