import type { AuthCredentials, AuthResponse } from '@torre-rpa/shared';
import { apiRequest } from './api';

export async function authenticate(credentials: AuthCredentials): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/openport', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}
