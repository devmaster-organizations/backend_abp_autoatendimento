import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../core/security/jwt';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token de autorizacao ausente.', code: 'UNAUTHORIZED' });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    (req as Request & { user: ReturnType<typeof verifyToken> }).user = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalido ou expirado.', code: 'INVALID_TOKEN' });
  }
};
