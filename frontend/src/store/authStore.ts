import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'director' | 'master_consultant' | 'consultant';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (user: User, token: string) => {
        console.log('📝 Fazendo login no store:', { user, token: token.substring(0, 20) });
        localStorage.setItem('token', token);
        
        set({ 
          user, 
          token, 
          isAuthenticated: true 
        });
        
        console.log('✅ Login concluído. Estado:', useAuthStore.getState());
      },
      
      logout: () => {
        console.log('🚪 Fazendo logout...');
        localStorage.removeItem('token');
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
