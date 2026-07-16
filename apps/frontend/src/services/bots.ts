import type { Bot } from '@torre-rpa/shared';
import { apiRequest } from './api';

export async function fetchBots(): Promise<Bot[]> {
  return apiRequest<Bot[]>('/bots');
}

export async function fetchBotById(id: string): Promise<Bot> {
  return apiRequest<Bot>(`/bots/${id}`);
}

export async function executeBot(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/bots/${id}/execute`, {
    method: 'POST',
  });
}
