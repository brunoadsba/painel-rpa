import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { bots } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';

export async function botsRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const all = db.select().from(bots).all();
    return { success: true, data: all };
  });

  app.get<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const bot = db.select().from(bots).where(eq(bots.id, request.params.id)).get();
      if (!bot) {
        return reply.status(404).send({ success: false, error: 'Bot não encontrado' });
      }
      return { success: true, data: bot };
    },
  );
}
