import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { PostgresInquiriesRepository } from '../repositories/inquiries/postgres-inquiries';
import { sendInquiryEmail } from '../core/notifications/inquiry-email';

const router = Router();
const repository = new PostgresInquiriesRepository();

const mapInquiry = (
  item: {
    id: bigint;
    requesterName: string;
    requesterEmail: string;
    question: string;
    recipientEmail: string | null;
    ccEmail: string | null;
    emailMessageId: string | null;
    emailSentAt: Date | null;
    status: string;
    answeredAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    answeredBy: { id: string; name: string; email: string } | null;
  },
) => ({
  id: item.id.toString(),
  requesterName: item.requesterName,
  requesterEmail: item.requesterEmail,
  question: item.question,
  recipientEmail: item.recipientEmail,
  ccEmail: item.ccEmail,
  emailMessageId: item.emailMessageId,
  emailSentAt: item.emailSentAt,
  status: item.status,
  answeredAt: item.answeredAt,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  answeredBy: item.answeredBy,
});

router.post('/send', async (req, res) => {
  const { requesterName, requesterEmail, question, copyEmail } = req.body as {
    requesterName?: unknown;
    requesterEmail?: unknown;
    question?: unknown;
    copyEmail?: unknown;
  };

  const normalizedRequesterName = String(requesterName ?? '').trim();
  const normalizedRequesterEmail = String(requesterEmail ?? '').trim().toLowerCase();
  const normalizedQuestion = String(question ?? '').trim();
  const normalizedCopyEmail = String(copyEmail ?? '').trim().toLowerCase();

  if (!normalizedRequesterName || !normalizedRequesterEmail || !normalizedQuestion) {
    return res.status(400).json({
      message: 'requesterName, requesterEmail e question sao obrigatorios.',
      code: 'VALIDATION_ERROR',
    });
  }

  const activeConfig = await repository.getActiveEmailConfig();

  if (!activeConfig) {
    return res.status(400).json({
      message: 'Destino padrao de duvidas nao configurado. Configure em /api/inquiries/email-config.',
      code: 'INQUIRY_EMAIL_CONFIG_MISSING',
    });
  }

  const ccEmail = normalizedCopyEmail || activeConfig.ccEmail || normalizedRequesterEmail;

  try {
    const delivery = await sendInquiryEmail({
      requesterName: normalizedRequesterName,
      requesterEmail: normalizedRequesterEmail,
      question: normalizedQuestion,
      to: activeConfig.recipientEmail,
      cc: ccEmail,
    });

    const created = await repository.createInquiry({
      requesterName: normalizedRequesterName,
      requesterEmail: normalizedRequesterEmail,
      question: normalizedQuestion,
      recipientEmail: activeConfig.recipientEmail,
      ccEmail,
      emailMessageId: delivery?.messageId ?? null,
      emailSentAt: delivery ? new Date() : null,
    });

    return res.status(201).json({
      ...mapInquiry(created),
      delivery,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Falha ao enviar duvida por e-mail.',
      code: 'INQUIRY_EMAIL_SEND_ERROR',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

router.use(authMiddleware);

router.get('/', async (_req, res) => {
  const inquiries = await repository.listInquiries();
  return res.status(200).json(inquiries.map(mapInquiry));
});

router.get('/email-config', async (_req, res) => {
  const config = await repository.getActiveEmailConfig();

  if (!config) {
    return res.status(200).json({
      configured: false,
      recipientEmail: null,
      ccEmail: null,
    });
  }

  return res.status(200).json({
    configured: true,
    id: config.id.toString(),
    recipientEmail: config.recipientEmail,
    ccEmail: config.ccEmail,
    updatedAt: config.updatedAt,
  });
});

router.put('/email-config', async (req, res) => {
  const { recipientEmail, ccEmail } = req.body as {
    recipientEmail?: unknown;
    ccEmail?: unknown;
  };

  const normalizedRecipient = String(recipientEmail ?? '').trim().toLowerCase();
  const normalizedCc = String(ccEmail ?? '').trim().toLowerCase();

  if (!normalizedRecipient) {
    return res.status(400).json({
      message: 'recipientEmail e obrigatorio.',
      code: 'VALIDATION_ERROR',
    });
  }

  const requestUser = (req as typeof req & { user: { sub: string } }).user;
  const config = await repository.upsertEmailConfig({
    recipientEmail: normalizedRecipient,
    ccEmail: normalizedCc || null,
    userId: requestUser?.sub ?? null,
  });

  return res.status(200).json({
    id: config.id.toString(),
    recipientEmail: config.recipientEmail,
    ccEmail: config.ccEmail,
    isActive: config.isActive,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  });
});

router.patch('/:id/responded', async (req, res) => {
  const idRaw = String(req.params.id ?? '').trim();

  if (!idRaw || !/^\d+$/.test(idRaw)) {
    return res.status(400).json({
      message: 'id invalido. Use numero inteiro.',
      code: 'VALIDATION_ERROR',
    });
  }

  const { responded } = req.body as { responded?: unknown };

  if (typeof responded !== 'boolean') {
    return res.status(400).json({
      message: 'responded deve ser boolean.',
      code: 'VALIDATION_ERROR',
    });
  }

  const requestUser = (req as typeof req & { user: { sub: string } }).user;

  try {
    const updated = await repository.toggleResponded(BigInt(idRaw), responded, requestUser.sub);
    return res.status(200).json(mapInquiry(updated));
  } catch {
    return res.status(404).json({
      message: 'Pergunta nao encontrada.',
      code: 'NOT_FOUND',
    });
  }
});

export default router;
