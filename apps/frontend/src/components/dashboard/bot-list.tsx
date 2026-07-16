import type { Bot } from '@torre-rpa/shared';
import { BotRow } from './bot-row';

interface BotListProps {
  bots: Bot[];
  onExecute: (bot: Bot) => void;
}

export function BotList({ bots, onExecute }: BotListProps) {
  return (
    <div className="border border-navy-600 rounded-xl overflow-hidden bg-gradient-to-b from-navy-700/35 to-navy-950/35">
      <div className="grid grid-cols-[28px_1.6fr_1fr_0.9fr_130px] gap-4 px-5 py-3 font-mono text-[10px] tracking-widest text-muted-2 uppercase border-b border-navy-600">
        <span />
        <span>Rotina</span>
        <span>Última execução</span>
        <span>Status</span>
        <span />
      </div>
      {bots.map((bot) => (
        <BotRow key={bot.id} bot={bot} onExecute={onExecute} />
      ))}
    </div>
  );
}
