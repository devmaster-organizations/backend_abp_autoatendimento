import { Prisma } from '@prisma/client';
import { Router } from 'express';
import {
  NavigationParentNotFoundError,
  PostgresNavigationLogsRepository,
} from '../repositories/navigation_logs/postgres-navigation-logs';
import { serializeBigInt } from '../utils/serialize';
import { authMiddleware } from '../middlewares/auth';
import { verifyToken } from '../core/security/jwt';

const router = Router();
const repository = new PostgresNavigationLogsRepository();

const NAVIGATION_NODE_MUTABLE_FIELDS = [
  'title',
  'slug',
  'prompt',
  'answerSummary',
  'responseType',
  'linkLabel',
  'linkUrl',
  'evidenceExcerpt',
  'evidenceSource',
  'displayOrder',
  'isActive',
] as const;

const NAVIGATION_NODE_IMMUTABLE_FIELDS = [
  'id',
  'parentId',
  'parent_id',
  'createdAt',
  'created_at',
] as const;

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

const parseOptionalString = (value: unknown): string | null | undefined => {
  if (typeof value === 'undefined') {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const raw = String(value).trim();

  return raw === '' || raw.toLowerCase() === 'null' ? null : raw;
};

const hasOwn = (obj: unknown, field: string): boolean =>
  typeof obj === 'object' && obj !== null && Object.prototype.hasOwnProperty.call(obj, field);

const collectImmutableFields = (payload: unknown): string[] =>
  NAVIGATION_NODE_IMMUTABLE_FIELDS.filter((field) => hasOwn(payload, field));

const getRequestIp = (req: Parameters<typeof authMiddleware>[0]): string => {
  const forwardedHeader = req.headers['x-forwarded-for'];

  if (typeof forwardedHeader === 'string') {
    const first = forwardedHeader.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }

  if (Array.isArray(forwardedHeader) && forwardedHeader.length > 0) {
    const first = forwardedHeader[0]?.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }

  return req.ip || 'unknown';
};

const getOptionalUserIdFromBearer = (req: Parameters<typeof authMiddleware>[0]): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    return payload.sub;
  } catch {
    return null;
  }
};

const parseDate = (value: unknown): Date | null | undefined => {
  if (typeof value === 'undefined') {
    return undefined;
  }

  if (value === null || String(value).trim() === '') {
    return null;
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildAnalyticsWindow = (query: Record<string, unknown>) => {
  const period = String(query.period ?? '').trim().toLowerCase();
  const from = parseDate(query.from);
  const to = parseDate(query.to);

  if (from === null || to === null) {
    return { error: 'Datas invalidas. Use formato ISO-8601 em from/to.' } as const;
  }

  if (period && (typeof from !== 'undefined' || typeof to !== 'undefined')) {
    return { error: 'Use period ou from/to. Nao combine os filtros.' } as const;
  }

  if (period && !['week', 'month'].includes(period)) {
    return { error: 'period invalido. Use week ou month.' } as const;
  }

  if (period) {
    const now = new Date();
    const start = new Date(now);

    if (period === 'week') {
      start.setDate(now.getDate() - 7);
    }

    if (period === 'month') {
      start.setMonth(now.getMonth() - 1);
    }

    return {
      value: {
        period,
        from: start,
        to: now,
      },
    } as const;
  }

  if (typeof from !== 'undefined' && typeof to !== 'undefined' && from > to) {
    return { error: 'Faixa de data invalida: from deve ser menor ou igual a to.' } as const;
  }

  return {
    value: {
      period: null,
      from: typeof from === 'undefined' ? undefined : from,
      to: typeof to === 'undefined' ? undefined : to,
    },
  } as const;
};

router.post('/', authMiddleware, async (req, res) => {
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

    const responseTypeRaw = String(req.body.responseType ?? 'TEXT').trim().toUpperCase();

    if (!['TEXT', 'LINK'].includes(responseTypeRaw)) {
      return res.status(400).json({
        message: 'responseType invalido. Use TEXT ou LINK.',
        code: 'VALIDATION_ERROR',
      });
    }

    const linkUrl = parseOptionalString(req.body.linkUrl);
    const linkLabel = parseOptionalString(req.body.linkLabel);

    if (responseTypeRaw === 'LINK' && (typeof linkUrl !== 'string' || linkUrl.length === 0)) {
      return res.status(400).json({
        message: 'linkUrl é obrigatorio quando responseType for LINK.',
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
      responseType: responseTypeRaw as 'TEXT' | 'LINK',
      linkLabel: typeof linkLabel === 'undefined' ? null : linkLabel,
      linkUrl: typeof linkUrl === 'undefined' ? null : linkUrl,
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

router.get('/analytics/navigations', authMiddleware, async (req, res) => {
  const page = Number.parseInt(String(req.query.page ?? '1'), 10);
  const pageSize = Number.parseInt(String(req.query.pageSize ?? '20'), 10);

  if (!Number.isInteger(page) || page <= 0) {
    return res.status(400).json({
      message: 'page invalido. Use inteiro positivo.',
      code: 'VALIDATION_ERROR',
    });
  }

  if (!Number.isInteger(pageSize) || pageSize <= 0 || pageSize > 100) {
    return res.status(400).json({
      message: 'pageSize invalido. Use inteiro entre 1 e 100.',
      code: 'VALIDATION_ERROR',
    });
  }

  const result = await repository.listNavigationJourneys({
    page,
    pageSize,
  });

  return res.status(200).json(serializeBigInt(result));
});

router.get('/analytics/node/:id/accesses', authMiddleware, async (req, res) => {
  const nodeId = parseOptionalBigint(req.params.id);

  if (typeof nodeId !== 'bigint') {
    return res.status(400).json({
      message: 'id invalido. Use numero inteiro.',
      code: 'VALIDATION_ERROR',
    });
  }

  const window = buildAnalyticsWindow(req.query as Record<string, unknown>);

  if ('error' in window) {
    return res.status(400).json({
      message: window.error,
      code: 'VALIDATION_ERROR',
    });
  }

  const accesses = await repository.countNodeAccesses(nodeId, {
    ...(window.value.from ? { from: window.value.from } : {}),
    ...(window.value.to ? { to: window.value.to } : {}),
  });

  return res.status(200).json({
    nodeId: nodeId.toString(),
    accesses,
    ...(window.value.period ? { period: window.value.period } : {}),
  });
});

router.get('/analytics/top-accessed', authMiddleware, async (req, res) => {
  const limit = Number.parseInt(String(req.query.limit ?? '4'), 10);
  const withinNodeId = parseOptionalBigint(req.query.withinNodeId);

  const window = buildAnalyticsWindow(req.query as Record<string, unknown>);

  if ('error' in window) {
    return res.status(400).json({
      message: window.error,
      code: 'VALIDATION_ERROR',
    });
  }

  if (!Number.isInteger(limit) || limit <= 0 || limit > 20) {
    return res.status(400).json({
      message: 'limit invalido. Use inteiro entre 1 e 20.',
      code: 'VALIDATION_ERROR',
    });
  }

  if (typeof req.query.withinNodeId !== 'undefined' && typeof withinNodeId !== 'bigint') {
    return res.status(400).json({
      message: 'withinNodeId invalido. Use numero inteiro.',
      code: 'VALIDATION_ERROR',
    });
  }

  const rows = await repository.topAccessedNodes({
    limit,
    ...(window.value.from ? { from: window.value.from } : {}),
    ...(window.value.to ? { to: window.value.to } : {}),
    ...(typeof withinNodeId === 'bigint' ? { withinNodeId } : {}),
  });

  return res.status(200).json(serializeBigInt({
    limit,
    ...(window.value.period ? { period: window.value.period } : {}),
    ...(typeof withinNodeId === 'bigint' ? { withinNodeId } : {}),
    data: rows,
  }));
});

router.patch('/:id', authMiddleware, async (req, res) => {
  const id = parseOptionalBigint(req.params.id);

  if (typeof id !== 'bigint') {
    return res.status(400).json({
      message: 'id invalido. Use numero inteiro.',
      code: 'VALIDATION_ERROR',
    });
  }

  const immutableFields = collectImmutableFields(req.body);

  if (immutableFields.length > 0) {
    return res.status(400).json({
      message: `Campos imutaveis nao podem ser alterados: ${immutableFields.join(', ')}.`,
      code: 'IMMUTABLE_FIELDS',
    });
  }

  const currentNode = await repository.getById(id);

  if (!currentNode) {
    return res.status(404).json({
      message: 'No de navegacao nao encontrado para o id informado.',
      code: 'NOT_FOUND',
    });
  }

  const updateData: Record<string, unknown> = {};

  if (hasOwn(req.body, 'title')) {
    const title = String(req.body.title ?? '').trim();

    if (!title) {
      return res.status(400).json({
        message: 'title nao pode ser vazio.',
        code: 'VALIDATION_ERROR',
      });
    }

    updateData.title = title;
  }

  if (hasOwn(req.body, 'slug')) {
    const slug = String(req.body.slug ?? '').trim();

    if (!slug) {
      return res.status(400).json({
        message: 'slug nao pode ser vazio.',
        code: 'VALIDATION_ERROR',
      });
    }

    updateData.slug = slug;
  }

  if (hasOwn(req.body, 'prompt')) {
    updateData.prompt = parseOptionalString(req.body.prompt) ?? null;
  }

  if (hasOwn(req.body, 'answerSummary')) {
    updateData.answerSummary = parseOptionalString(req.body.answerSummary) ?? null;
  }

  if (hasOwn(req.body, 'responseType')) {
    const responseTypeRaw = String(req.body.responseType ?? '').trim().toUpperCase();

    if (!['TEXT', 'LINK'].includes(responseTypeRaw)) {
      return res.status(400).json({
        message: 'responseType invalido. Use TEXT ou LINK.',
        code: 'VALIDATION_ERROR',
      });
    }

    updateData.responseType = responseTypeRaw;
  }

  if (hasOwn(req.body, 'linkLabel')) {
    updateData.linkLabel = parseOptionalString(req.body.linkLabel) ?? null;
  }

  if (hasOwn(req.body, 'linkUrl')) {
    updateData.linkUrl = parseOptionalString(req.body.linkUrl) ?? null;
  }

  if (hasOwn(req.body, 'evidenceExcerpt')) {
    updateData.evidenceExcerpt = parseOptionalString(req.body.evidenceExcerpt) ?? null;
  }

  if (hasOwn(req.body, 'evidenceSource')) {
    updateData.evidenceSource = parseOptionalString(req.body.evidenceSource) ?? null;
  }

  if (hasOwn(req.body, 'displayOrder')) {
    const displayOrder = Number.isInteger(req.body.displayOrder)
      ? req.body.displayOrder
      : Number.parseInt(String(req.body.displayOrder ?? ''), 10);

    if (Number.isNaN(displayOrder)) {
      return res.status(400).json({
        message: 'displayOrder invalido. Use numero inteiro.',
        code: 'VALIDATION_ERROR',
      });
    }

    updateData.displayOrder = displayOrder;
  }

  if (hasOwn(req.body, 'isActive')) {
    if (typeof req.body.isActive !== 'boolean') {
      return res.status(400).json({
        message: 'isActive invalido. Use boolean.',
        code: 'VALIDATION_ERROR',
      });
    }

    updateData.isActive = req.body.isActive;
  }

  const allowedFieldsSet = new Set<string>(NAVIGATION_NODE_MUTABLE_FIELDS);
  const unknownFields = Object.keys(req.body).filter(
    (field) => !allowedFieldsSet.has(field) && !NAVIGATION_NODE_IMMUTABLE_FIELDS.includes(field as never),
  );

  if (unknownFields.length > 0) {
    return res.status(400).json({
      message: `Campos nao permitidos para atualizacao: ${unknownFields.join(', ')}.`,
      code: 'VALIDATION_ERROR',
    });
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      message: 'Nenhum campo permitido foi informado para atualizacao.',
      code: 'VALIDATION_ERROR',
    });
  }

  const effectiveResponseType =
    typeof updateData.responseType === 'string' ? updateData.responseType : currentNode.responseType;
  const effectiveLinkUrl =
    Object.prototype.hasOwnProperty.call(updateData, 'linkUrl')
      ? updateData.linkUrl
      : currentNode.linkUrl;

  if (effectiveResponseType === 'LINK' && (typeof effectiveLinkUrl !== 'string' || effectiveLinkUrl.length === 0)) {
    return res.status(400).json({
      message: 'linkUrl é obrigatorio quando responseType for LINK.',
      code: 'VALIDATION_ERROR',
    });
  }

  try {
    const updated = await repository.updateById(id, updateData);
    return res.status(200).json(serializeBigInt(updated));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({
        message: 'Slug ja existe. Use um slug unico.',
        code: 'SLUG_CONFLICT',
      });
    }

    return res.status(500).json({
      message: 'Erro interno ao atualizar no de navegacao.',
      code: 'INTERNAL_ERROR',
    });
  }
});

router.get('/:slug', async (req, res) => {
  const node = await repository.getBySlug(req.params.slug);

  if (!node) {
    return res.status(404).json({
      message: 'No de navegacao nao encontrado para o slug informado.',
      code: 'NOT_FOUND',
    });
  }

  const selectedOptionLabel = parseOptionalString(req.query.optionLabel);
  const selectedOptionTarget = parseOptionalBigint(req.query.optionTargetId);

  if (typeof req.query.optionTargetId !== 'undefined' && typeof selectedOptionTarget === 'undefined') {
    return res.status(400).json({
      message: 'optionTargetId invalido para registro de acesso.',
      code: 'VALIDATION_ERROR',
    });
  }

  await repository.recordAccess({
    navigationNodeId: node.id,
    selectedOptionLabel: typeof selectedOptionLabel === 'undefined' ? null : selectedOptionLabel,
    selectedOptionTarget: typeof selectedOptionTarget === 'undefined' ? null : selectedOptionTarget,
  });

  await repository.registerNavigationJourney({
    userId: getOptionalUserIdFromBearer(req),
    ipAddress: getRequestIp(req),
    nodeId: node.id,
    nodeSlug: node.slug,
    selectedOptionLabel: typeof selectedOptionLabel === 'undefined' ? null : selectedOptionLabel,
    selectedOptionTarget: typeof selectedOptionTarget === 'undefined' ? null : selectedOptionTarget,
  });

  return res.status(200).json(serializeBigInt(node));
});

export default router;
