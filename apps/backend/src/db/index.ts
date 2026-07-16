import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { bots } from './schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', '..', 'data', 'torre-rpa.db');

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
export type Db = typeof db;

export function initDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS bots (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'idle' CHECK(status IN ('idle','running','done','error')),
      last_run TEXT,
      script_path TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS executions (
      id TEXT PRIMARY KEY,
      bot_id TEXT NOT NULL REFERENCES bots(id),
      bot_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('idle','running','done','error')),
      started_at TEXT NOT NULL,
      finished_at TEXT,
      triggered_by TEXT NOT NULL DEFAULT '',
      result TEXT
    );
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      execution_id TEXT NOT NULL REFERENCES executions(id),
      level TEXT NOT NULL CHECK(level IN ('info','success','warn','error')),
      message TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);

  const row = sqlite.prepare('SELECT COUNT(*) AS count FROM bots').get() as { count: number };
  if (!row || row.count === 0) {
    db.insert(bots).values(SEED_BOTS).run();
    console.log('[DB] Seed inserido: 7 bots');
  } else {
    console.log('[DB] Banco já possui dados. Seed ignorado.');
  }
}

const SEED_BOTS = [
  {
    id: 'paralisacao',
    name: 'Paralisação',
    description: 'Registra paralisações de navio no OpenPort a partir de planilha .xlsx',
    status: 'idle' as const,
    lastRun: null,
    scriptPath: 'paralisacao/run.py',
  },
  {
    id: 'openport-relatorio',
    name: 'OpenPort Relatório',
    description: 'Escalas de navio, ocupação de berço e volume por agência',
    status: 'done' as const,
    lastRun: '2026-07-16T06:12:00.000Z',
    scriptPath: 'openport-relatorio/main.py',
  },
  {
    id: 'movimentacao-diaria',
    name: 'Movimentação Diária',
    description: 'Consolida planilha de movimentação e gera dashboard executivo',
    status: 'done' as const,
    lastRun: '2026-07-16T05:47:00.000Z',
    scriptPath: 'movimentacao-diaria/main.py',
  },
  {
    id: 'fechamento-tos',
    name: 'Fechamento TOS',
    description: 'Extrai fechamento diário do sistema TOS/Openport',
    status: 'idle' as const,
    lastRun: '2026-07-15T22:03:00.000Z',
    scriptPath: 'fechamento-tos/main.py',
  },
  {
    id: 'manifesto-carga',
    name: 'Extração de Manifesto',
    description: 'Baixa e organiza manifestos de carga do dia',
    status: 'idle' as const,
    lastRun: '2026-07-15T18:30:00.000Z',
    scriptPath: 'manifesto-carga/main.py',
  },
  {
    id: 'consolidacao-atracacao',
    name: 'Consolidação de Atracação',
    description: 'Reúne dados de atracação para o boletim diário',
    status: 'error' as const,
    lastRun: '2026-07-14T22:15:00.000Z',
    scriptPath: 'consolidacao-atracacao/main.py',
  },
  {
    id: 'boletim-diretoria',
    name: 'Boletim para Diretoria',
    description: 'Compila indicadores-chave em PDF para envio matinal',
    status: 'idle' as const,
    lastRun: '2026-07-14T06:30:00.000Z',
    scriptPath: 'boletim-diretoria/main.py',
  },
];
