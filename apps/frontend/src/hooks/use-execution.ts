import { useQueryClient } from '@tanstack/react-query';
import type { AuthCredentials, LogEntry } from '@torre-rpa/shared';
import { useCallback, useRef, useState } from 'react';
import { useUIStore } from '../stores/ui-store';

export function useExecutionStream() {
  const abortRef = useRef<AbortController | null>(null);
  const { addLog, openDrawer } = useUIStore();
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const startStream = useCallback(
    (botId: string, botName: string, credentials: AuthCredentials, token: string) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setError(null);

      openDrawer(botName);

      // Invalidar bots para refletir status 'running' imediatamente
      queryClient.invalidateQueries({ queryKey: ['bots'] });

      const url = `/api/bots/${botId}/stream`;

      fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
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
                  // Refetch bots para atualizar status done/error + lastRun
                  queryClient.invalidateQueries({ queryKey: ['bots'] });
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
                  // Refetch bots para atualizar status após erro
                  queryClient.invalidateQueries({ queryKey: ['bots'] });
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
          // Refetch bots em caso de erro de rede
          queryClient.invalidateQueries({ queryKey: ['bots'] });
        });
    },
    [addLog, openDrawer, queryClient],
  );

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { startStream, stopStream, error };
}
