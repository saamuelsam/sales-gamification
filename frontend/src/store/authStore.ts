import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  email_verified?: boolean;
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
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        console.log('🧠 Zustand.login() CHAMADO');
        console.log('🧠 Estado ANTES:', get());
        console.log('🧠 Novos dados:', {
          user,
          token: token.substring(0, 20) + '...',
          isAuthenticated: true
        });
        
        // Salvar token separadamente também
        localStorage.setItem('token', token);
        console.log('✅ Token salvo no localStorage separadamente');
        
        // Atualizar estado do Zustand
        set({ user, token, isAuthenticated: true });
        
        console.log('🧠 Estado DEPOIS:', get());
        
        // Verificar persistência após um tick
        setTimeout(() => {
          const stored = localStorage.getItem('auth-storage');
          const currentState = get();
          console.log('🧠 [100ms depois] Estado atual:', currentState);
          console.log('🧠 [100ms depois] LocalStorage auth-storage:', stored ? JSON.parse(stored) : 'VAZIO');
        }, 100);
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
