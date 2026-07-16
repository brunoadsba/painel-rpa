import 'dotenv/config';
import cors from '@fastify/cors';
import Fastify from 'fastify';
import { initDatabase } from './db/index.js';
import { authRoutes } from './routes/auth.routes.js';
import { botsRoutes } from './routes/bots.routes.js';
import { executionRoutes } from './routes/execution.routes.js';

initDatabase();

const server = Fastify({ logger: true });

await server.register(cors, { origin: true });

await server.register(authRoutes, { prefix: '/api/auth' });
await server.register(botsRoutes, { prefix: '/api/bots' });
await server.register(executionRoutes, { prefix: '/api/bots' });

server.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

const port = Number(process.env.BACKEND_PORT) || 3001;

try {
  await server.listen({ port, host: '0.0.0.0' });
  console.log(`🚀 Torre RPA Backend running on http://localhost:${port}`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
