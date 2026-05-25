import { Router } from 'express';
import { InquiryStatus } from '@prisma/client';
import { prisma } from '../core/database/prisma';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', async (_req, res) => {
  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      answeredBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return res.status(200).json(
    inquiries.map((item) => ({
      id: item.id.toString(),
      requesterName: item.requesterName,
      requesterEmail: item.requesterEmail,
      question: item.question,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      answeredBy: item.answeredBy,
    })),
  );
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
    const updated = await prisma.inquiry.update({
      where: { id: BigInt(idRaw) },
      data: {
        status: responded ? InquiryStatus.RESPONDIDA : InquiryStatus.ABERTA,
        answeredById: responded ? requestUser.sub : null,
      },
      include: {
        answeredBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({
      id: updated.id.toString(),
      requesterName: updated.requesterName,
      requesterEmail: updated.requesterEmail,
      question: updated.question,
      status: updated.status,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      answeredBy: updated.answeredBy,
    });
  } catch {
    return res.status(404).json({
      message: 'Pergunta nao encontrada.',
      code: 'NOT_FOUND',
    });
  }
});

export default router;
