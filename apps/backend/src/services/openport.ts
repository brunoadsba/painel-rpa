/**
 * Serviço de autenticação OpenPort.
 *
 * Comportamento controlado por OPENPORT_MOCK:
 * - OPENPORT_MOCK=true  → modo mock (aceita qualquer credencial não-vazia, padrão para UAT)
 * - OPENPORT_MOCK=false  → chamada HTTP real à API do OpenPort (requer OPENPORT_API_URL)
 *
 * IMPORTANTE: Este mock controla apenas a autenticação do backend (identificação do operador).
 * O login real do Playwright no OpenPort sempre acontece de verdade via OPENPORT_LOGIN/OPENPORT_SENHA.
 */
import type { AuthCredentials, AuthResponse } from '@torre-rpa/shared';

const MOCK_SESSION = 'mock-openport-session-token';
const API_URL = process.env.OPENPORT_API_URL;
const IS_MOCK = process.env.OPENPORT_MOCK === 'true';

async function realAuthenticate(credentials: AuthCredentials): Promise<AuthResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(`${API_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Falha na autenticação OpenPort: ${res.status}`);
    }

    const data = (await res.json()) as { token: string; expiresAt?: string };
    return {
      token: data.token,
      expiresAt: data.expiresAt ?? new Date(Date.now() + 3600_000).toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
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
  if (IS_MOCK) {
    return mockAuthenticate(credentials);
  }
  return realAuthenticate(credentials);
}
