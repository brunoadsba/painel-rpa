import type { BotStatus } from '@torre-rpa/shared';

interface BeaconProps {
  status: BotStatus;
}

const colors: Record<BotStatus, string> = {
  idle: 'bg-muted-2',
  running: 'bg-teal shadow-[0_0_10px_rgba(58,166,166,0.8)] animate-pulse',
  done: 'bg-green-400 shadow-[0_0_8px_rgba(63,203,147,0.8)]',
  error: 'bg-red-400 shadow-[0_0_8px_rgba(255,107,107,0.8)]',
};

export function Beacon({ status }: BeaconProps) {
  return (
    <span
      className={`inline-block w-3 h-3 rounded-full transition-colors duration-200 ${colors[status]}`}
    />
  );
}
