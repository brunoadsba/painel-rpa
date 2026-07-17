import type { LogEntry } from '@torre-rpa/shared';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { bots } from '../db/schema.js';
import { type AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { executeBot, isBotRunning } from '../services/executor.js';

const streamBodySchema = z.object({
  username: z.string().min(1, 'Usuário é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export async function executionRoutes(app: FastifyInstance) {
  app.post<{ Params: { id: string } }>(
    '/:id/stream',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params;
      if (!id || typeof id !== 'string' || id.trim() === '') {
        return reply.status(400).send({ success: false, error: 'ID do bot inválido' });
      }

      // Validar body com Zod
      const parsed = streamBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: parsed.error.errors.map((e) => e.message).join('; '),
        });
      }

      const user = (request as AuthenticatedRequest).user;
      const jwtSub = typeof user.sub === 'string' ? user.sub : '';

      // Validar que body.username === JWT.sub
      if (parsed.data.username !== jwtSub) {
        return reply.status(403).send({
          success: false,
          error: 'Usuário do body não corresponde ao token JWT',
        });
      }

      const bot = db.select().from(bots).where(eq(bots.id, id)).get();
      if (!bot) {
        return reply.status(404).send({ success: false, error: 'Bot não encontrado' });
      }

      // Verificar se bot já está em execução — retornar erro amigável via SSE
      if (isBotRunning(bot.id)) {
        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
        reply.raw.write(
          `event: error\ndata: ${JSON.stringify({ error: 'Bot já está em execução. Aguarde a conclusão antes de executar novamente.' })}\n\n`,
        );
        reply.raw.end();
        return;
      }

      const session = typeof user.session === 'string' ? user.session : '';

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
        const result = executeBot(bot, sendEvent, {
          session,
          triggeredBy: parsed.data.username,
          openportLogin: parsed.data.username,
          openportSenha: parsed.data.password,
        });
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
