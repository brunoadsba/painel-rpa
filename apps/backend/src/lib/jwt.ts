import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export function signToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): Record<string, unknown> {
  return jwt.verify(token, SECRET) as Record<string, unknown>;
}
