import { spawn, spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Bot, LogEntry } from '@torre-rpa/shared';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { executions, logs } from '../db/schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = join(__dirname, '..', '..', '..', '..', 'scripts');

function findPython(): string {
  const candidates = ['python', 'python3', 'py'];
  for (const cmd of candidates) {
    try {
      const result = spawnSync(cmd, ['--version'], { stdio: 'ignore', timeout: 2000 });
      if (result.status === 0) return cmd;
    } catch {}
  }
  return 'python';
}

export async function executeBot(
  bot: Bot & { scriptPath: string },
  onLog: (entry: LogEntry) => void,
  token?: string,
  triggeredBy?: string,
): Promise<string> {
  const executionId = crypto.randomUUID();
  const now = new Date().toISOString();

  db.insert(executions)
    .values({
      id: executionId,
      botId: bot.id,
      botName: bot.name,
      status: 'running',
      startedAt: now,
      triggeredBy: triggeredBy ?? '',
    })
    .run();

  const botScript = join(SCRIPTS_DIR, bot.scriptPath);
  const python = findPython();

  const persistLog = (entry: LogEntry) => {
    db.insert(logs)
      .values({
        id: entry.id,
        executionId,
        level: entry.level,
        message: entry.message,
        timestamp: entry.timestamp,
      })
      .run();
    onLog(entry);
  };

  return new Promise((resolve, reject) => {
    const proc = spawn(python, [
      botScript,
      '--bot-id',
      executionId,
      '--openport-token',
      token ?? 'mock-token',
    ]);

    let buffer = '';

    proc.stdout.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed) as LogEntry;
          persistLog({
            ...parsed,
            id: crypto.randomUUID(),
            executionId,
          });
        } catch {
          persistLog({
            id: crypto.randomUUID(),
            executionId,
            timestamp: new Date().toISOString(),
            level: 'info',
            message: trimmed,
          });
        }
      }
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      persistLog({
        id: crypto.randomUUID(),
        executionId,
        timestamp: new Date().toISOString(),
        level: 'error',
        message: chunk.toString().trim(),
      });
    });

    proc.on('close', (code) => {
      const finishedAt = new Date().toISOString();
      if (code === 0) {
        const entry: LogEntry = {
          id: crypto.randomUUID(),
          executionId,
          timestamp: finishedAt,
          level: 'success',
          message: '✓ Rotina concluída com sucesso.',
        };
        persistLog(entry);
        db.update(executions)
          .set({ status: 'done', finishedAt, result: entry.message })
          .where(eq(executions.id, executionId))
          .run();
        resolve(executionId);
      } else {
        const entry: LogEntry = {
          id: crypto.randomUUID(),
          executionId,
          timestamp: finishedAt,
          level: 'error',
          message: `Processo encerrado com código ${code}`,
        };
        persistLog(entry);
        db.update(executions)
          .set({ status: 'error', finishedAt, result: entry.message })
          .where(eq(executions.id, executionId))
          .run();
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      const timestamp = new Date().toISOString();
      const entry: LogEntry = {
        id: crypto.randomUUID(),
        executionId,
        timestamp,
        level: 'error',
        message: `Erro ao iniciar script: ${err.message}`,
      };
      persistLog(entry);
      db.update(executions)
        .set({ status: 'error', finishedAt: timestamp, result: entry.message })
        .where(eq(executions.id, executionId))
        .run();
      reject(err);
    });
  });
}
