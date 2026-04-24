import { Prisma } from '@prisma/client';
import { Router } from 'express';
import {
  NavigationParentNotFoundError,
  PostgresNavigationLogsRepository,
} from '../repositories/navigation_logs/postgres-navigation-logs';
import { serializeBigInt } from '../utils/serialize';

const router = Router();
const repository = new PostgresNavigationLogsRepository();

const parseOptionalBigint = (value: unknown): bigint | null | undefined => {
  if (typeof value === 'undefined') {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const raw = String(value).trim().toLowerCase();

  if (raw === 'null' || raw === '') {
    return null;
  }

  try {
    return BigInt(raw);
  } catch {
    return undefined;
  }
};

router.post('/', async (req, res) => {
  try {
    const hasParentId = Object.prototype.hasOwnProperty.call(req.body, 'parentId');
    const parentId = parseOptionalBigint(req.body.parentId);

    if (hasParentId && typeof parentId === 'undefined') {
      return res.status(400).json({
        message: 'parentId invalido. Use numero inteiro, null ou omita o campo.',
        code: 'VALIDATION_ERROR',
      });
    }

    const { title, slug } = req.body;

    if (!title || !slug) {
      return res.status(400).json({
        message: 'title e slug sao obrigatorios.',
        code: 'VALIDATION_ERROR',
      });
    }

    const displayOrder = Number.isInteger(req.body.displayOrder)
      ? req.body.displayOrder
      : Number.parseInt(String(req.body.displayOrder ?? ''), 10);

    const created = await repository.create({
      parentId: typeof parentId === 'undefined' ? null : parentId,
      title: String(title).trim(),
      slug: String(slug).trim(),
      prompt: req.body.prompt ? String(req.body.prompt) : null,
      answerSummary: req.body.answerSummary ? String(req.body.answerSummary) : null,
      evidenceExcerpt: req.body.evidenceExcerpt ? String(req.body.evidenceExcerpt) : null,
      evidenceSource: req.body.evidenceSource ? String(req.body.evidenceSource) : null,
      displayOrder: Number.isNaN(displayOrder) ? 0 : displayOrder,
      isActive: typeof req.body.isActive === 'boolean' ? req.body.isActive : true,
    });

    return res.status(201).json(serializeBigInt(created));
  } catch (error) {
    if (error instanceof NavigationParentNotFoundError) {
      return res.status(404).json({
        message: 'parentId nao encontrado.',
        code: 'PARENT_NOT_FOUND',
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({
        message: 'Slug ja existe. Use um slug unico.',
        code: 'SLUG_CONFLICT',
      });
    }

    return res.status(500).json({
      message: 'Erro interno ao criar no de navegacao.',
      code: 'INTERNAL_ERROR',
    });
  }
});

router.get('/', async (req, res) => {
  const parentId = parseOptionalBigint(req.query.parentId);

  if (typeof req.query.parentId !== 'undefined' && typeof parentId === 'undefined') {
    return res.status(400).json({
      message: 'parentId invalido para filtro.',
      code: 'VALIDATION_ERROR',
    });
  }

  const onlyActiveParam = String(req.query.onlyActive ?? 'true').toLowerCase();
  const onlyActive = onlyActiveParam !== 'false';

  const listInput = {
    onlyActive,
    ...(typeof parentId !== 'undefined' ? { parentId } : {}),
  };

  const nodes = await repository.list(listInput);

  return res.status(200).json(serializeBigInt(nodes));
});

router.get('/:slug', async (req, res) => {
  const node = await repository.getBySlug(req.params.slug);

  if (!node) {
    return res.status(404).json({
      message: 'No de navegacao nao encontrado para o slug informado.',
      code: 'NOT_FOUND',
    });
  }

  return res.status(200).json(serializeBigInt(node));
});

export default router;
