import type { Database } from 'better-sqlite3';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import DatabaseConstructor from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { bots } from './schema.js';
import { SEED_BOTS } from './seed.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_PATH || join(__dirname, '..', '..', 'data', 'torre-rpa.db');

const sqlite: Database = new DatabaseConstructor(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export { sqlite };

export const db = drizzle(sqlite, { schema });
export type Db = typeof db;

export function initDatabase() {
  // Mantido em sync manual com src/db/schema.ts (Drizzle ORM)
  // Ao alterar colunas aqui, atualizar também o schema Drizzle
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
    console.log(`[DB] Seed inserido: ${SEED_BOTS.length} bots`);
  } else {
    console.log('[DB] Banco já possui dados. Seed ignorado.');
  }
}
