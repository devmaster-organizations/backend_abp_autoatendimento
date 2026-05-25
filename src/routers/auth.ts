import { Router } from 'express';
import crypto from 'crypto';
import { UserSecurityTokenType } from '@prisma/client';
import { prisma } from '../core/database/prisma';
import { signToken } from '../core/security/jwt';
import { hashPassword, verifyPassword } from '../core/security/password';
import { authMiddleware } from '../middlewares/auth';
import { sendPasswordResetEmail } from '../core/notifications/password-reset-email';

const router = Router();

const hashRawToken = (rawToken: string): string =>
  crypto.createHash('sha256').update(rawToken).digest('hex');

const generateRawToken = (): string =>
  crypto.randomBytes(32).toString('hex');

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

  return res.status(200).json({
    token,
    expiresIn: '8h',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
  });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body as { email?: string };

  if (!email) {
    return res.status(400).json({
      message: 'email e obrigatorio.',
      code: 'VALIDATION_ERROR',
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    return res.status(200).json({
      message: 'Se o email existir, um token de recuperacao foi gerado.',
    });
  }

  const rawToken = generateRawToken();
  const tokenHash = hashRawToken(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await prisma.userSecurityToken.updateMany({
    where: {
      userId: user.id,
      type: UserSecurityTokenType.RESET,
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
    },
  });

  await prisma.userSecurityToken.create({
    data: {
      userId: user.id,
      type: UserSecurityTokenType.RESET,
      tokenHash,
      expiresAt,
    },
  });

  try {
    await sendPasswordResetEmail({
      to: normalizedEmail,
      token: rawToken,
      expiresAt,
    });
  } catch (error) {
    console.error('[EMAIL_SEND_ERROR]', error);

    return res.status(500).json({
      message: 'Falha ao enviar e-mail de recuperacao.',
      code: 'EMAIL_SEND_ERROR',
    });
  }

  return res.status(200).json({
    message: 'Se o e-mail existir, as instrucoes de recuperacao foram enviadas.',
    expiresAt,
  });
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body as { token?: string; newPassword?: string };

  if (!token || !newPassword) {
    return res.status(400).json({
      message: 'token e newPassword sao obrigatorios.',
      code: 'VALIDATION_ERROR',
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      message: 'newPassword deve ter pelo menos 8 caracteres.',
      code: 'VALIDATION_ERROR',
    });
  }

  const tokenHash = hashRawToken(token);
  const securityToken = await prisma.userSecurityToken.findFirst({
    where: {
      tokenHash,
      type: UserSecurityTokenType.RESET,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!securityToken) {
    return res.status(400).json({
      message: 'Token invalido ou expirado.',
      code: 'INVALID_TOKEN',
    });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: securityToken.userId },
      data: {
        passwordHash: hashPassword(newPassword),
        mustChangePassword: false,
        passwordUpdatedAt: new Date(),
      },
    }),
    prisma.userSecurityToken.update({
      where: { id: securityToken.id },
      data: {
        usedAt: new Date(),
      },
    }),
  ]);

  return res.status(200).json({ message: 'Senha atualizada com sucesso.' });
});

router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      message: 'currentPassword e newPassword sao obrigatorios.',
      code: 'VALIDATION_ERROR',
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      message: 'newPassword deve ter pelo menos 8 caracteres.',
      code: 'VALIDATION_ERROR',
    });
  }

  const requestUser = (req as typeof req & { user: { sub: string } }).user;

  const user = await prisma.user.findUnique({ where: { id: requestUser.sub } });

  if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
    return res.status(401).json({
      message: 'Senha atual invalida.',
      code: 'INVALID_CREDENTIALS',
    });
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashPassword(newPassword),
      mustChangePassword: false,
      passwordUpdatedAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      mustChangePassword: true,
    },
  });

  return res.status(200).json({
    message: 'Senha alterada com sucesso.',
    user: updatedUser,
  });
});

export default router;
