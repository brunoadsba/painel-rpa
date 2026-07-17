import type { FastifyReply, FastifyRequest } from 'fastify';
import type { JwtPayload } from 'jsonwebtoken';
import { verifyToken } from '../lib/jwt.js';

export interface AuthenticatedRequest extends FastifyRequest {
  user: JwtPayload;
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return reply.status(401).send({ success: false, error: 'Token ausente' });
  }
  try {
    const payload = verifyToken(header.slice(7));
    (request as AuthenticatedRequest).user = payload;
  } catch {
    return reply.status(401).send({ success: false, error: 'Token inválido' });
  }
}
