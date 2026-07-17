import type { Bot } from '@torre-rpa/shared';
import { Badge } from '../ui/badge';
import { Beacon } from '../ui/beacon';

function formatLastRun(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) return `Hoje ${time}`;
  if (diffDays === 1) return `Ontem ${time}`;
  return `${diffDays} dias atrás`;
}

interface BotRowProps {
  bot: Bot;
  onExecute: (bot: Bot) => void;
}

export function BotRow({ bot, onExecute }: BotRowProps) {
  const isRunning = bot.status === 'running';

  return (
    <div className="grid grid-cols-[28px_1.6fr_1fr_0.9fr_130px] gap-4 items-center px-5 py-[18px] border-b border-navy-600 last:border-b-0 transition-colors duration-200 hover:bg-teal/5">
      <Beacon status={bot.status} />
      <div>
        <div className="font-display text-[15px] font-bold">{bot.name}</div>
        <div className="font-body text-[12.5px] text-muted mt-0.5">{bot.description}</div>
      </div>
      <div className="font-mono text-[12px] text-muted">{formatLastRun(bot.lastRun)}</div>
      <Badge status={bot.status} />
      <button
        type="button"
        disabled={isRunning}
        onClick={() => onExecute(bot)}
        className={`font-mono text-[12px] font-semibold rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 transition-all duration-150 ${
          isRunning
            ? 'bg-navy-700 text-teal-light border border-teal cursor-not-allowed'
            : 'bg-teal text-navy-950 hover:translate-y-[-1px] hover:shadow-[0_4px_16px_rgba(58,166,166,0.35)] active:translate-y-0'
        }`}
      >
        {isRunning ? 'Em execução…' : '▶ Executar'}
      </button>
    </div>
  );
}