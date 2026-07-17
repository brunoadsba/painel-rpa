import type { Bot } from '@torre-rpa/shared';
import { apiRequest } from './api';

export async function fetchBots(): Promise<Bot[]> {
  return apiRequest<Bot[]>('/bots');
}

export async function fetchBotById(id: string): Promise<Bot> {
  return apiRequest<Bot>(`/bots/${id}`);
}
