import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Bot, LogEntry } from '@torre-rpa/shared';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { executions, logs } from '../db/schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = join(__dirname, '..', '..', '..', '..', 'scripts');
const EXECUTION_TIMEOUT_MS = Number(process.env.EXECUTION_TIMEOUT_MS) || 1_800_000;

const runningBots = new Set<string>();

let _pythonPath: string | null = null;

function findPython(): string {
  if (_pythonPath) return _pythonPath;
  const candidates = [
    join(SCRIPTS_DIR, '.venv', 'Scripts', 'python.exe'),
    join(SCRIPTS_DIR, '.venv', 'Scripts', 'python'),
    'python',
    'py',
    'python3',
  ];
  for (const cmd of candidates) {
    try {
      const result = spawnSync(cmd, ['--version'], { stdio: 'ignore', timeout: 2000 });
      if (result.status === 0) {
        _pythonPath = cmd;
        return cmd;
      }
    } catch {}
  }
  _pythonPath = 'python';
  return 'python';
}

export function isBotRunning(botId: string): boolean {
  return runningBots.has(botId);
}

export function executeBot(
  bot: Bot,
  onLog: (entry: LogEntry) => void,
  token?: string,
  triggeredBy?: string,
): { promise: Promise<string>; kill: () => void } {
  const botScript = join(SCRIPTS_DIR, bot.scriptPath);
  if (!existsSync(botScript)) {
    throw new Error(`Script não encontrado: ${botScript}`);
  }

  if (runningBots.has(bot.id)) {
    throw new Error(`Bot "${bot.name}" já está em execução.`);
  }

  const executionId = randomUUID();
  const now = new Date().toISOString();

  try {
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
  } catch (err) {
    throw new Error(
      `Falha ao registrar execução no banco: ${err instanceof Error ? err.message : 'erro desconhecido'}`,
    );
  }

  runningBots.add(bot.id);

  const python = findPython();

  const proc = spawn(python, [
    botScript,
    '--bot-id',
    executionId,
    '--openport-token',
    token ?? 'mock-token',
    ...(triggeredBy ? ['--triggered-by', triggeredBy] : []),
  ]);

  let finished = false;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let resolvePromise: (value: string) => void = () => {};
  let rejectPromise: (reason: Error) => void = () => {};

  const promise = new Promise<string>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  const persistLog = (entry: LogEntry) => {
    try {
      db.insert(logs)
        .values({
          id: entry.id,
          executionId,
          level: entry.level,
          message: entry.message,
          timestamp: entry.timestamp,
        })
        .run();
    } catch {
      // DB write failure should not crash the execution stream
    }
    try {
      onLog(entry);
    } catch {
      // SSE write failure (e.g. client disconnected) should not crash
    }
  };

  const finishOnce = (status: 'done' | 'error', result: string) => {
    if (finished) return;
    finished = true;
    if (timeout) clearTimeout(timeout);
    runningBots.delete(bot.id);
    try {
      const finishedAt = new Date().toISOString();
      db.update(executions)
        .set({ status, finishedAt, result })
        .where(eq(executions.id, executionId))
        .run();
    } catch {
      // DB update failure should not crash the process
    }
  };

  timeout = setTimeout(() => {
    proc.kill();
    finishOnce('error', 'Tempo limite de execução excedido.');
    rejectPromise(new Error('Tempo limite de execução excedido.'));
  }, EXECUTION_TIMEOUT_MS);

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
          id: randomUUID(),
          executionId,
        });
      } catch {
        persistLog({
          id: randomUUID(),
          executionId,
          timestamp: new Date().toISOString(),
          level: 'info',
          message: trimmed,
        });
      }
    }
  });

  proc.stderr.on('data', (chunk: Buffer) => {
    const text = chunk.toString();
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      persistLog({
        id: randomUUID(),
        executionId,
        timestamp: new Date().toISOString(),
        level: 'error',
        message: trimmed,
      });
    }
  });

  proc.on('close', (code) => {
    if (finished) return;
    const finishedAt = new Date().toISOString();
    if (code === 0) {
      const entry: LogEntry = {
        id: randomUUID(),
        executionId,
        timestamp: finishedAt,
        level: 'success',
        message: '✓ Rotina concluída com sucesso.',
      };
      persistLog(entry);
      finishOnce('done', entry.message);
      resolvePromise(executionId);
    } else {
      const entry: LogEntry = {
        id: randomUUID(),
        executionId,
        timestamp: finishedAt,
        level: 'error',
        message: `Processo encerrado com código ${code}.`,
      };
      persistLog(entry);
      finishOnce('error', entry.message);
      rejectPromise(new Error(`Process exited with code ${code}`));
    }
  });

  proc.on('error', (err) => {
    if (finished) return;
    const timestamp = new Date().toISOString();
    const entry: LogEntry = {
      id: randomUUID(),
      executionId,
      timestamp,
      level: 'error',
      message: `Erro ao iniciar script: ${err.message}`,
    };
    persistLog(entry);
    finishOnce('error', entry.message);
    rejectPromise(err);
  });

  const kill = () => {
    if (finished) return;
    proc.kill();
    finishOnce('error', 'Execução cancelada pelo usuário.');
    rejectPromise(new Error('Cancelado pelo usuário'));
  };

  return { promise, kill };
}