import { useEffect, useRef } from 'react';
import { useUIStore } from '../../stores/ui-store';
import { Button } from '../ui/button';

const LEVEL_COLORS: Record<string, string> = {
  info: 'text-muted',
  success: 'text-green-400',
  warn: 'text-amber',
  error: 'text-red-400',
};

export function LogDrawer() {
  const { isDrawerOpen, activeBotName, logs, closeDrawer } = useUIStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: logs is the trigger to auto-scroll
  useEffect(() => {
    if (stickRef.current) bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [logs]);

  return (
    <section
      aria-label={`Execução ${activeBotName}`}
      aria-live="polite"
      className={`fixed bottom-3 right-3 w-[480px] max-w-[calc(100vw-24px)] bg-navy-900 border border-white/10 rounded-2xl overflow-hidden z-40 shadow-2xl transition-transform duration-300 ${
        isDrawerOpen ? 'translate-y-0' : 'translate-y-[120%]'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 font-body text-[12px] text-teal-light">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" aria-hidden="true" />
          <span className="font-semibold">Execução · {activeBotName}</span>
          <span className="tabular text-muted-2">{logs.length} eventos</span>
        </div>
        <Button
          variant="ghost"
          aria-label="Fechar painel de logs"
          className="!p-1 !text-[14px]"
          onClick={closeDrawer}
        >
          ✕
        </Button>
      </div>

      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
        }}
        className="h-[46vh] min-h-[280px] overflow-y-auto px-4 py-3 font-mono text-[12px] flex flex-col gap-1.5"
      >
        {logs.length === 0 && <p className="text-muted-2">Aguardando eventos da execução…</p>}
        {logs.map((log) => (
          <div key={log.id} className="opacity-0 animate-[fadeIn_0.3s_ease_forwards]">
            <span className="tabular text-white/60">
              [{new Date(log.timestamp).toLocaleTimeString('pt-BR')}]
            </span>{' '}
            <span className={LEVEL_COLORS[log.level] || 'text-muted'}>{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </section>
  );
}
