import type { LogEntry } from '@torre-rpa/shared';
import { useCallback, useRef } from 'react';
import { getToken } from '../lib/auth-token';
import { useUIStore } from '../stores/ui-store';

export function useExecutionStream() {
  const abortRef = useRef<AbortController | null>(null);
  const { addLog, openDrawer } = useUIStore();

  const startStream = useCallback(
    (botId: string, botName: string) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      openDrawer(botName);

      const token = getToken();
      const url = `/api/bots/${botId}/stream`;

      fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: abortRef.current.signal,
      })
        .then(async (response) => {
          const reader = response.body?.getReader();
          if (!reader) return;

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const entry = JSON.parse(line.slice(6)) as LogEntry;
                  addLog(entry);
                } catch {}
              }
            }
          }
        })
        .catch(() => {});
    },
    [addLog, openDrawer],
  );

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { startStream, stopStream };
}
