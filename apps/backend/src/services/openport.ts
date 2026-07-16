/**
 * Serviço de autenticação OpenPort.
 *
 * Comportamento:
 * - Se OPENPORT_API_URL estiver definida no .env, fará chamada HTTP real
 * - Caso contrário, usa modo mock (para desenvolvimento)
 */
import type { AuthCredentials, AuthResponse } from '@torre-rpa/shared';

const MOCK_SESSION = 'mock-openport-session-token';
const API_URL = process.env.OPENPORT_API_URL;

async function realAuthenticate(credentials: AuthCredentials): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    throw new Error(`Falha na autenticação OpenPort: ${res.status}`);
  }

  const data = (await res.json()) as { token: string; expiresAt?: string };
  return {
    token: data.token,
    expiresAt: data.expiresAt ?? new Date(Date.now() + 3600_000).toISOString(),
  };
}

async function mockAuthenticate(credentials: AuthCredentials): Promise<AuthResponse> {
  await new Promise((r) => setTimeout(r, 800));

  if (!credentials.username || !credentials.password) {
    throw new Error('Credenciais inválidas');
  }

  return {
    token: MOCK_SESSION,
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  };
}

export async function authenticateOpenPort(credentials: AuthCredentials): Promise<AuthResponse> {
  if (API_URL && !API_URL.includes('example.com')) {
    return realAuthenticate(credentials);
  }
  return mockAuthenticate(credentials);
}
