import { create } from 'zustand';

interface AuthState {
  token: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, expiresAt: string) => void;
  clearAuth: () => void;
}

const STORAGE_KEY = 'auth';

function loadFromStorage(): { token: string | null; expiresAt: string | null } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { token: null, expiresAt: null };
}

function saveToStorage(token: string, expiresAt: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, expiresAt }));
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

const initial = loadFromStorage();

export const useAuthStore = create<AuthState>((set) => ({
  token: initial.token,
  expiresAt: initial.expiresAt,
  isAuthenticated: !!initial.token,
  setAuth: (token, expiresAt) => {
    saveToStorage(token, expiresAt);
    set({ token, expiresAt, isAuthenticated: true });
  },
  clearAuth: () => {
    clearStorage();
    set({ token: null, expiresAt: null, isAuthenticated: false });
  },
}));
