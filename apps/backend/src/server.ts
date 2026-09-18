import 'dotenv/config';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import { initDatabase, sqlite } from './db/index.js';
import { authRoutes } from './routes/auth.routes.js';
import { botsRoutes } from './routes/bots.routes.js';
import { executionRoutes } from './routes/execution.routes.js';
import { resetOrphanBots } from './services/executor.js';

initDatabase();

// Fail-fast de segredos — impede subir com default em prod
// (relaxado sob VITEST/NODE_ENV=test para os E2Es usarem segredo curto)
const isTest = process.env.VITEST || process.env.NODE_ENV === 'test';
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === 'change-me-in-production' || (!isTest && jwtSecret.length < 32)) {
  console.error(
    '[Boot] JWT_SECRET ausente, default ou fraco (<32 chars). Gere com: openssl rand -base64 32',
  );
  process.exit(1);
}
if (process.env.OPENPORT_MOCK === 'true' && process.env.NODE_ENV === 'production') {
  console.error(
    '[Boot] OPENPORT_MOCK=true com NODE_ENV=production — recuse subir para evitar auth fake em prod.',
  );
  process.exit(1);
}
if (process.env.OPENPORT_MOCK === 'true') {
  console.warn('[Boot] OPENPORT_MOCK=true — autenticação fake ativa (ok apenas para UAT local).');
}

// Resetar bots órfãos presos em 'running' após crash/reinício
const resetCount = resetOrphanBots();
if (resetCount > 0) {
  console.log(`[Boot] Reset ${resetCount} bot(s) de 'running' para 'idle'`);
}

export async function buildApp() {
  const server = Fastify({ logger: true });

  await server.register(cors, { origin: true });

  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  server.setErrorHandler((error, _request, reply) => {
    server.log.error(error);
    const statusCode =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? Number((error as { statusCode: unknown }).statusCode)
        : 500;
    reply.status(statusCode).send({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
    });
  });

  await server.register(authRoutes, { prefix: '/api/auth' });
  await server.register(botsRoutes, { prefix: '/api/bots' });
  await server.register(executionRoutes, { prefix: '/api/bots' });

  server.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return server;
}

async function startServer() {
  const server = await buildApp();
  const port = Number(process.env.BACKEND_PORT) || 3001;

  const shutdown = async () => {
    server.log.info('Shutting down gracefully...');
    await server.close();
    sqlite.close();
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  try {
    const host = process.env.BACKEND_HOST || '0.0.0.0';
    await server.listen({ port, host });
    server.log.info(`Torre RPA Backend running on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

startServer();
