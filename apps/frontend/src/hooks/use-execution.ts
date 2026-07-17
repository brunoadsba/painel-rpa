import type { LogEntry } from '@torre-rpa/shared';
import { useCallback, useRef, useState } from 'react';
import { getToken } from '../lib/auth-token';
import { useUIStore } from '../stores/ui-store';

export function useExecutionStream() {
  const abortRef = useRef<AbortController | null>(null);
  const { addLog, openDrawer } = useUIStore();
  const [error, setError] = useState<string | null>(null);

  const startStream = useCallback(
    (botId: string, botName: string) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setError(null);

      openDrawer(botName);

      const token = getToken();
      const url = `/api/bots/${botId}/stream`;

      fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: abortRef.current.signal,
      })
        .then(async (response) => {
          if (!response.ok || !response.body) {
            const text = `Erro ao conectar SSE: ${response.status} ${response.statusText}`;
            setError(text);
            addLog({
              id: crypto.randomUUID(),
              executionId: '',
              timestamp: new Date().toISOString(),
              level: 'error',
              message: text,
            });
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            let eventType = 'message';

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                eventType = line.slice(7).trim();
                continue;
              }
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (eventType === 'done') {
                  addLog({
                    id: crypto.randomUUID(),
                    executionId: '',
                    timestamp: new Date().toISOString(),
                    level: 'success',
                    message: 'Execução concluída.',
                  });
                } else if (eventType === 'error') {
                  try {
                    const { error: msg } = JSON.parse(data) as { error: string };
                    setError(msg);
                    addLog({
                      id: crypto.randomUUID(),
                      executionId: '',
                      timestamp: new Date().toISOString(),
                      level: 'error',
                      message: msg,
                    });
                  } catch {}
                } else {
                  try {
                    const entry = JSON.parse(data) as LogEntry;
                    addLog(entry);
                  } catch {}
                }
                eventType = 'message';
              }
            }
          }
        })
        .catch((err: Error) => {
          if (err.name === 'AbortError') return;
          const msg = `Erro na conexão: ${err.message}`;
          setError(msg);
          addLog({
            id: crypto.randomUUID(),
            executionId: '',
            timestamp: new Date().toISOString(),
            level: 'error',
            message: msg,
          });
        });
    },
    [addLog, openDrawer],
  );

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { startStream, stopStream, error };
}