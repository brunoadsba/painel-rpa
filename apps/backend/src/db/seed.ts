import type { InferInsertModel } from 'drizzle-orm';
import type { bots } from './schema.js';

type BotInsert = InferInsertModel<typeof bots>;

export const SEED_BOTS: BotInsert[] = [
  {
    id: 'sev-intermaritima',
    name: 'SEV Intermarítima ★',
    description:
      'Carro-chefe: emite SEV no TOS OpenPort (produto Windows on-premise, execução manual no cliente).',
    status: 'idle',
    lastRun: null,
    scriptPath: 'sev/run.py',
  },
  {
    id: 'paralisacao',
    name: 'Paralisação',
    description: 'Registra paralisações de navio no OpenPort a partir de planilha .xlsx',
    status: 'idle',
    lastRun: null,
    scriptPath: 'paralisacao/run.py',
  },
];
