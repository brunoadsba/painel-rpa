import { create } from 'zustand';

interface AuthState {
  token: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, expiresAt: string) => void;
  clearAuth: () => void;
}

// Token efêmero — in-memory apenas, sem localStorage
// Cada execução requer nova autenticação (credenciais por execução)
export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  expiresAt: null,
  isAuthenticated: false,
  setAuth: (token, expiresAt) => {
    set({ token, expiresAt, isAuthenticated: true });
  },
  clearAuth: () => {
    set({ token: null, expiresAt: null, isAuthenticated: false });
  },
}));
