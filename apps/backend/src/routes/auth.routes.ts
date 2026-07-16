import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { signToken } from '../lib/jwt.js';
import { authenticateOpenPort } from '../services/openport.js';

const authSchema = z.object({
  username: z.string().min(1, 'Usuário é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/openport', async (request, reply) => {
    const parsed = authSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: parsed.error.errors[0].message,
      });
    }

    try {
      const session = await authenticateOpenPort(parsed.data);
      const token = signToken({
        sub: parsed.data.username,
        session: session.token,
      });

      return reply.send({
        success: true,
        data: {
          token,
          expiresAt: session.expiresAt,
        },
      });
    } catch (err) {
      return reply.status(401).send({
        success: false,
        error: err instanceof Error ? err.message : 'Falha na autenticação',
      });
    }
  });
}
