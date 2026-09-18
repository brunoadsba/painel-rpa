import type { BotStatus } from '@torre-rpa/shared';
import { STATUS_LABEL } from '@torre-rpa/shared';

interface BadgeProps {
  status: BotStatus;
}

const dot: Record<BotStatus, string> = {
  idle: 'bg-muted-2',
  running: 'bg-teal animate-pulse',
  done: 'bg-green-400',
  error: 'bg-red-400',
};

const pill: Record<BotStatus, string> = {
  idle: 'text-muted border-white/10 bg-white/5',
  running: 'text-teal-light border-teal/30 bg-teal/10',
  done: 'text-green-400 border-green-400/30 bg-green-400/10',
  error: 'text-red-400 border-red-400/30 bg-red-400/10',
};

export function Badge({ status }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-body text-[11px] font-semibold ${pill[status]}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dot[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}
