import type { LogEntry } from '@torre-rpa/shared';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { bots } from '../db/schema.js';
import { type AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { executeBot } from '../services/executor.js';

export async function executionRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>(
    '/:id/stream',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params;
      if (!id || typeof id !== 'string' || id.trim() === '') {
        return reply.status(400).send({ success: false, error: 'ID do bot inválido' });
      }
      const bot = db.select().from(bots).where(eq(bots.id, id)).get();
      if (!bot) {
        return reply.status(404).send({ success: false, error: 'Bot não encontrado' });
      }

      const user = (request as AuthenticatedRequest).user;
      const session = typeof user.session === 'string' ? user.session : '';
      const triggeredBy = typeof user.sub === 'string' ? user.sub : '';

      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      const sendEvent = (entry: LogEntry) => {
        try {
          reply.raw.write(`data: ${JSON.stringify(entry)}\n\n`);
        } catch {
          // Client may have disconnected
        }
      };

      let killProcess: (() => void) | null = null;

      const onClose = () => {
        killProcess?.();
      };
      request.raw.on('close', onClose);

      try {
        const result = executeBot(bot, sendEvent, session, triggeredBy);
        killProcess = result.kill;

        const executionId = await result.promise;

        reply.raw.write(`event: done\ndata: ${JSON.stringify({ executionId })}\n\n`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`);
      } finally {
        request.raw.removeListener('close', onClose);
        reply.raw.end();
      }
    },
  );
}