import type { Bot } from '@torre-rpa/shared';
import { BotCard } from './bot-card';

interface BotListProps {
  bots: Bot[];
  onExecute: (bot: Bot) => void;
}

export function BotList({ bots, onExecute }: BotListProps) {
  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
      {bots.map((bot) => (
        <BotCard key={bot.id} bot={bot} onExecute={onExecute} />
      ))}
    </div>
  );
}
