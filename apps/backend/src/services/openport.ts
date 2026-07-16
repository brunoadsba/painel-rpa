// Mock do serviço OpenPort — será substituído pela integração real
import type { AuthCredentials, AuthResponse } from '@torre-rpa/shared';

const MOCK_SESSION = 'mock-openport-session-token';

export async function authenticateOpenPort(credentials: AuthCredentials): Promise<AuthResponse> {
  // Simula delay de rede
  await new Promise((r) => setTimeout(r, 800));

  if (!credentials.username || !credentials.password) {
    throw new Error('Credenciais inválidas');
  }

  return {
    token: MOCK_SESSION,
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  };
}
