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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div
      className={`fixed bottom-3 right-3 w-[380px] max-w-[calc(100vw-24px)] bg-navy-800 border border-navy-600 rounded-xl overflow-hidden z-40 shadow-2xl transition-transform duration-300 ${
        isDrawerOpen ? 'translate-y-0' : 'translate-y-[120%]'
      }`}
    >
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-navy-600 font-mono text-[11px] text-teal-light">
        <div className="flex items-center gap-1.5">
          <span className="w-[6px] h-[6px] rounded-full bg-teal shadow-[0_0_6px_rgba(58,166,166,1)] animate-pulse" />
          <span>EXECUTANDO · {activeBotName.toUpperCase()}</span>
        </div>
        <Button variant="ghost" className="!p-0 !text-[14px]" onClick={closeDrawer}>
          ✕
        </Button>
      </div>

      <div className="h-40 overflow-y-auto px-3.5 py-3 font-mono text-[11.5px] flex flex-col gap-1.5">
        {logs.map((log) => (
          <div key={log.id} className="opacity-0 animate-[fadeIn_0.3s_ease_forwards]">
            <span className="text-white/80">
              [{new Date(log.timestamp).toLocaleTimeString('pt-BR')}]
            </span>{' '}
            <span className={LEVEL_COLORS[log.level] || 'text-muted'}>{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
