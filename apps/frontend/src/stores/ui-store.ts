import type { Bot, LogEntry } from '@torre-rpa/shared';
import { create } from 'zustand';

interface UIState {
  // Modal
  isModalOpen: boolean;
  selectedBot: Bot | null;
  openModal: (bot: Bot) => void;
  closeModal: () => void;

  // Log drawer
  isDrawerOpen: boolean;
  activeBotName: string;
  logs: LogEntry[];
  openDrawer: (botName: string) => void;
  closeDrawer: () => void;
  addLog: (entry: LogEntry) => void;
  clearLogs: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isModalOpen: false,
  selectedBot: null,
  openModal: (bot) => set({ isModalOpen: true, selectedBot: bot }),
  closeModal: () => set({ isModalOpen: false, selectedBot: null }),

  isDrawerOpen: false,
  activeBotName: '',
  logs: [],
  openDrawer: (botName) => set({ isDrawerOpen: true, activeBotName: botName, logs: [] }),
  closeDrawer: () => set({ isDrawerOpen: false, activeBotName: '', logs: [] }),
  addLog: (entry) => set((state) => ({ logs: [...state.logs, entry] })),
  clearLogs: () => set({ logs: [] }),
}));
