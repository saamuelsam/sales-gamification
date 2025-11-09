// frontend/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { SalesPage } from './features/sales/pages/SalesPage';
import { TeamPage } from './features/team/pages/TeamPage';
import { BenefitsPage } from './features/benefits/pages/BenefitsPage';
import { GoalsPage } from '@/features/goals/pages/GoalsPage';

// ✅ Páginas de Admin
import { AdminPage } from '@/features/admin/pages/AdminPage';

// ✅ Rota Privada (apenas autenticado)
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 PrivateRoute - isAuthenticated:', isAuthenticated);
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// ✅ Rota Protegida (apenas admin/ceo)
const ProtectedRoute = ({ 
  children, 
  roles = ['admin', 'ceo'] 
}: { 
  children: React.ReactNode; 
  roles?: string[] 
}) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔒 ProtectedRoute - user:', user);
    console.log('🔒 ProtectedRoute - role:', user?.role);
  }
  
  // Verificar se está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Verificar se tem permissão
  const hasPermission = user?.role && roles.includes(user.role);
  
  if (!hasPermission) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⛔ Acesso negado - role necessária:', roles);
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      {/* ===== ROTAS PÚBLICAS ===== */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* ===== ROTAS PRIVADAS (USUÁRIOS AUTENTICADOS) ===== */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        {/* Redirecionar raiz para dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Rotas principais */}
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="benefits" element={<BenefitsPage />} />
        <Route path="goals" element={<GoalsPage />} />
        
        {/* ===== ROTAS DE ADMIN (APENAS ADMIN/CEO) ===== */}
        <Route
          path="admin/*"
          element={
            <ProtectedRoute roles={['admin', 'ceo']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Route>
      
      {/* ===== ROTA 404 ===== */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
