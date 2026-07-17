import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../src/db/index.js';
import { bots, executions } from '../src/db/schema.js';
import { resetOrphanBots } from '../src/services/executor.js';

let app: FastifyInstance;
let dbPath: string;

beforeAll(async () => {
  dbPath = join(mkdtempSync(join(tmpdir(), 'torre-rpa-e2e-')), 'test.db');
  process.env.DATABASE_PATH = dbPath;
  process.env.JWT_SECRET = 'test-secret';
  process.env.EXECUTION_TIMEOUT_MS = '5000';
  process.env.OPENPORT_MOCK = 'true';

  const { buildApp } = await import('../src/server.js');
  app = await buildApp();
});

afterAll(async () => {
  await app?.close();
  for (const suffix of ['', '-wal', '-shm']) {
    try {
      rmSync(`${dbPath}${suffix}`);
    } catch {}
  }
});

describe('E2E: API Torre RPA', () => {
  it('GET /api/health → 200', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeTruthy();
  });

  it('GET /api/bots → lista pública com 1 bot (paralisacao)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/bots' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.length).toBe(1);
    expect(body.data[0].id).toBe('paralisacao');
    expect(body.data[0].name).toBe('Paralisação');
    expect(body.data[0].status).toBe('idle');
  });

  it('GET /api/bots/:id → 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/bots/paralisacao' });
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).success).toBe(false);
  });

  it('GET /api/bots/:id → 404 para bot inexistente', async () => {
    const token = await getToken(app, 'operador');
    const res = await app.inject({
      method: 'GET',
      url: '/api/bots/nao-existe',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('POST /api/auth/openport → 200 (mock)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/openport',
      payload: { username: 'operador', password: '123' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.token).toBeTruthy();
    expect(body.data.expiresAt).toBeTruthy();
  });

  it('POST /api/auth/openport → 400 sem credenciais', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/openport',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/bots/:id/stream → SSE com auth e payload correto', async () => {
    const token = await getToken(app, 'operador');
    const res = await app.inject({
      method: 'POST',
      url: '/api/bots/paralisacao/stream',
      headers: { authorization: `Bearer ${token}` },
      payload: { username: 'operador', password: '123' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');

    // Verificar se a execução foi registrada com triggeredBy correto
    const execs = db.select().from(executions).where(eq(executions.botId, 'paralisacao')).all();
    expect(execs.length).toBeGreaterThan(0);
    expect(execs[0].triggeredBy).toBe('operador');
  });

  it('POST /api/bots/:id/stream → 403 se username no body divergir do sub no JWT', async () => {
    const token = await getToken(app, 'operador');
    const res = await app.inject({
      method: 'POST',
      url: '/api/bots/paralisacao/stream',
      headers: { authorization: `Bearer ${token}` },
      payload: { username: 'outro_operador', password: '123' },
    });
    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error).toContain('não corresponde ao token JWT');
  });

  it('POST /api/bots/:id/stream → 400 se body incompleto', async () => {
    const token = await getToken(app, 'operador');
    const res = await app.inject({
      method: 'POST',
      url: '/api/bots/paralisacao/stream',
      headers: { authorization: `Bearer ${token}` },
      payload: { username: 'operador' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/bots/:id/stream → 401 sem token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/bots/paralisacao/stream',
      payload: { username: 'operador', password: '123' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('resetOrphanBots → reseta bots com status running para idle', () => {
    // Forçar bot para running no banco
    db.update(bots).set({ status: 'running' }).where(eq(bots.id, 'paralisacao')).run();

    const initialBot = db.select().from(bots).where(eq(bots.id, 'paralisacao')).get();
    expect(initialBot?.status).toBe('running');

    // Executar reset
    const changes = resetOrphanBots();
    expect(changes).toBe(1);

    const updatedBot = db.select().from(bots).where(eq(bots.id, 'paralisacao')).get();
    expect(updatedBot?.status).toBe('idle');
  });
});

async function getToken(testApp: FastifyInstance, username = 'test'): Promise<string> {
  const res = await testApp.inject({
    method: 'POST',
    url: '/api/auth/openport',
    payload: { username, password: 'test' },
  });
  return JSON.parse(res.body).data.token;
}
