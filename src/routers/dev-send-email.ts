import { Router } from 'express';
import { sendPasswordResetEmail } from '../core/notifications/password-reset-email';

const router = Router();

/**
 * POST /api/dev/send-email
 * Rota de teste para disparar um e-mail usando as credenciais SMTP configuradas no .env.
 * Disponível apenas fora de produção.
 *
 * Body: { "to": "destino@example.com" }
 */
router.post('/', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      message: 'Rota disponivel apenas em ambiente de desenvolvimento.',
      code: 'FORBIDDEN',
    });
  }

  const { to } = req.body as { to?: string };

  if (!to) {
    return res.status(400).json({
      message: '"to" é obrigatorio no body.',
      code: 'VALIDATION_ERROR',
    });
  }

  try {
    const result = await sendPasswordResetEmail({
      to,
      token: 'TOKEN-DE-TESTE-123456',
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    });

    return res.status(200).json({
      message: `E-mail de teste enviado para ${to}.`,
      delivery: result,
    });
  } catch (error) {
    console.error('[DEV_SEND_EMAIL_ERROR]', error);

    return res.status(500).json({
      message: 'Falha ao enviar e-mail.',
      code: 'EMAIL_SEND_ERROR',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
