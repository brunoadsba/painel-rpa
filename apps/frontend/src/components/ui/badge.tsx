import type { BotStatus } from '@torre-rpa/shared';
import { STATUS_LABEL } from '@torre-rpa/shared';

interface BadgeProps {
  status: BotStatus;
}

const colors: Record<BotStatus, string> = {
  idle: 'text-muted',
  running: 'text-teal-light',
  done: 'text-green-400',
  error: 'text-red-400',
};

export function Badge({ status }: BadgeProps) {
  return (
    <span className={`font-mono text-[11px] tracking-wide uppercase ${colors[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
