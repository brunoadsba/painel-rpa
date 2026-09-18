import type { Bot } from '@torre-rpa/shared';
import { Badge } from '../ui/badge';
import { Beacon } from '../ui/beacon';
import { Button } from '../ui/button';

function formatLastRun(iso: string | null): string {
  if (!iso) return 'Nunca executado';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) return `Hoje · ${time}`;
  if (diffDays === 1) return `Ontem · ${time}`;
  if (diffDays < 30) return `${diffDays}d atrás · ${time}`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

interface BotCardProps {
  bot: Bot;
  onExecute: (bot: Bot) => void;
}

export function BotCard({ bot, onExecute }: BotCardProps) {
  const isRunning = bot.status === 'running';

  return (
    <article className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-200 hover:border-teal/40 hover:bg-white/[0.05]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Beacon status={bot.status} />
          <h3 className="font-display text-[15px] font-bold text-white">{bot.name}</h3>
        </div>
        <Badge status={bot.status} />
      </div>

      <p className="mt-2 line-clamp-2 min-h-[36px] font-body text-[13px] leading-5 text-muted">
        {bot.description}
      </p>

      <p className="tabular mt-3 font-body text-[12px] text-muted-2">
        Última execução: <span className="text-muted">{formatLastRun(bot.lastRun)}</span>
      </p>

      <div className="mt-4">
        <Button
          type="button"
          variant="primary"
          loading={isRunning}
          disabled={isRunning}
          onClick={() => onExecute(bot)}
          aria-label={isRunning ? `${bot.name} em execução` : `Executar ${bot.name}`}
          className="w-full"
        >
          {isRunning ? 'Em execução…' : 'Executar'}
        </Button>
      </div>
    </article>
  );
}
