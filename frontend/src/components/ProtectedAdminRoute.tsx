import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import React from 'react';

export function ProtectedAdminRoute({ children }: { children: React.ReactElement }) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'ceo';

  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
