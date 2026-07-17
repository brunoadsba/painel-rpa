import jwt from 'jsonwebtoken';

const raw = process.env.JWT_SECRET;
if (!raw) {
  throw new Error('JWT_SECRET não definido no ambiente');
}
const SECRET: string = raw;

export function signToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload;
}
