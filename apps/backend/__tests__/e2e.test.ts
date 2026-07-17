import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let app: FastifyInstance;
let dbPath: string;

beforeAll(async () => {
  dbPath = join(mkdtempSync(join(tmpdir(), 'torre-rpa-e2e-')), 'test.db');
  process.env.DATABASE_PATH = dbPath;
  process.env.JWT_SECRET = 'test-secret';
  process.env.EXECUTION_TIMEOUT_MS = '5000';

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
    const token = await getToken(app);
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

  it('GET /api/bots/:id/stream → SSE com auth', async () => {
    const token = await getToken(app);
    const res = await app.inject({
      method: 'GET',
      url: '/api/bots/paralisacao/stream',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
  });

  it('GET /api/bots/:id/stream → 401 sem token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/bots/paralisacao/stream',
    });
    expect(res.statusCode).toBe(401);
  });

  it('fluxo completo: auth → list → SSE', async () => {
    const token = await getToken(app);
    const listRes = await app.inject({ method: 'GET', url: '/api/bots' });
    expect(JSON.parse(listRes.body).data.length).toBe(1);

    const streamRes = await app.inject({
      method: 'GET',
      url: '/api/bots/paralisacao/stream',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(streamRes.statusCode).toBe(200);
  });
});

async function getToken(testApp: FastifyInstance): Promise<string> {
  const res = await testApp.inject({
    method: 'POST',
    url: '/api/auth/openport',
    payload: { username: 'test', password: 'test' },
  });
  return JSON.parse(res.body).data.token;
}
