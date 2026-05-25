import type { NextFunction, Request, Response } from 'express';
import type { TokenPayload } from '../core/security/jwt';

const getRequestUser = (req: Request): TokenPayload | null =>
  ((req as Request & { user?: TokenPayload }).user ?? null);

export const requireAdminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const user = getRequestUser(req);

  if (!user) {
    res.status(401).json({ message: 'Usuario nao autenticado.', code: 'UNAUTHORIZED' });
    return;
  }

  if (user.role !== 'ADMIN') {
    res.status(403).json({ message: 'Acesso permitido apenas para administradores.', code: 'FORBIDDEN' });
    return;
  }

  next();
};
