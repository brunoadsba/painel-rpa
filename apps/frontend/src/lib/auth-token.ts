export function getToken(): string | null {
  try {
    const stored = localStorage.getItem('auth');
    if (stored) return JSON.parse(stored).token;
  } catch {}
  return null;
}
