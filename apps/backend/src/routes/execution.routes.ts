import type { LogEntry } from '@torre-rpa/shared';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { bots } from '../db/schema.js';
import { type AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { executeBot } from '../services/executor.js';

export async function executionRoutes(app: FastifyInstance) {
  app.post<{ Params: { id: string } }>(
    '/:id/execute',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const bot = db.select().from(bots).where(eq(bots.id, request.params.id)).get();
      if (!bot) {
        return reply.status(404).send({ success: false, error: 'Bot não encontrado' });
      }
      return reply.send({
        success: true,
        data: { message: 'Execução iniciada', botId: bot.id },
      });
    },
  );

  app.get<{ Params: { id: string } }>(
    '/:id/stream',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const bot = db.select().from(bots).where(eq(bots.id, request.params.id)).get();
      if (!bot) {
        return reply.status(404).send({ success: false, error: 'Bot não encontrado' });
      }

      const userSession = (request as AuthenticatedRequest).user;

      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      const sendEvent = (entry: LogEntry) => {
        reply.raw.write(`data: ${JSON.stringify(entry)}\n\n`);
      };

      try {
        const executionId = await executeBot(
          bot,
          sendEvent,
          (userSession?.session as string) ?? '',
          (userSession?.sub as string) ?? '',
        );

        reply.raw.write(`event: done\ndata: ${JSON.stringify({ executionId })}\n\n`);
      } catch (err) {
        reply.raw.write(
          `event: error\ndata: ${JSON.stringify({ error: (err as Error).message })}\n\n`,
        );
      }

      reply.raw.end();
    },
  );
}
