/**
 * @deprecated Token não é mais persistido em localStorage.
 * O token agora é passado diretamente por parâmetro para startStream().
 * Esta função mantida apenas para compatibilidade com apiRequest() em
 * chamadas que não são de stream (ex: /api/bots, /api/auth/openport).
 */
import { useAuthStore } from '../stores/auth-store';

export function getToken(): string | null {
  return useAuthStore.getState().token;
}
