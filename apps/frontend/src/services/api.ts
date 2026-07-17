import type { ApiResponse } from '@torre-rpa/shared';
import { getToken } from '../lib/auth-token';

const BASE_URL = '/api';

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new Error(json.error || 'Erro desconhecido');
  }

  return json.data;
}
