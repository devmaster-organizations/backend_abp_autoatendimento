import { Router } from 'express';
import { prisma } from '../core/database/prisma';
import { signToken } from '../core/security/jwt';
import { verifyPassword } from '../core/security/password';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({
      message: 'email e password sao obrigatorios.',
      code: 'VALIDATION_ERROR',
    });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({
      message: 'Credenciais invalidas.',
      code: 'INVALID_CREDENTIALS',
    });
  }

  const token = signToken({ sub: user.id, role: user.role });

  return res.status(200).json({ token, expiresIn: '8h' });
});

export default router;
