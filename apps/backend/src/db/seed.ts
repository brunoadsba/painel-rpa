import type { InferInsertModel } from 'drizzle-orm';
import type { bots } from './schema.js';

type BotInsert = InferInsertModel<typeof bots>;

export const SEED_BOTS: BotInsert[] = [
  {
    id: 'paralisacao',
    name: 'Paralisação',
    description: 'Registra paralisações de navio no OpenPort a partir de planilha .xlsx',
    status: 'idle',
    lastRun: null,
    scriptPath: 'paralisacao/run.py',
  },
];
