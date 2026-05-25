import { prisma } from '../../core/database/prisma';
import type { Prisma } from '@prisma/client';

export interface NavigationNodeCreateInput {
  parentId: bigint | null;
  title: string;
  slug: string;
  prompt: string | null;
  answerSummary: string | null;
  responseType: 'TEXT' | 'LINK';
  linkLabel: string | null;
  linkUrl: string | null;
  evidenceExcerpt: string | null;
  evidenceSource: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface NavigationNodeAccessLogCreateInput {
  navigationNodeId: bigint;
  selectedOptionLabel?: string | null;
  selectedOptionTarget?: bigint | null;
}

export interface NavigationNodeUpdateInput {
  title?: string;
  slug?: string;
  prompt?: string | null;
  answerSummary?: string | null;
  responseType?: 'TEXT' | 'LINK';
  linkLabel?: string | null;
  linkUrl?: string | null;
  evidenceExcerpt?: string | null;
  evidenceSource?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface RegisterNavigationJourneyInput {
  userId: string | null;
  ipAddress: string;
  nodeId: bigint;
  nodeSlug: string;
  selectedOptionLabel?: string | null;
  selectedOptionTarget?: bigint | null;
}

export interface ListNavigationJourneysInput {
  page: number;
  pageSize: number;
}

export interface NavigationAnalyticsWindowInput {
  from?: Date;
  to?: Date;
}

export interface TopAccessedNodesInput extends NavigationAnalyticsWindowInput {
  limit: number;
  withinNodeId?: bigint;
}

export interface ListNavigationNodesInput {
  parentId?: bigint | null;
  onlyActive: boolean;
}

export class NavigationParentNotFoundError extends Error {
  constructor() {
    super('parent_id_not_found');
  }
}

export class PostgresNavigationLogsRepository {
  private async getNodeSubtreeIds(rootNodeId: bigint): Promise<bigint[]> {
    const visited = new Set<string>([rootNodeId.toString()]);
    let frontier: bigint[] = [rootNodeId];

    while (frontier.length > 0) {
      const children = await prisma.navigationNode.findMany({
        where: {
          parentId: {
            in: frontier,
          },
        },
        select: {
          id: true,
        },
      });

      const nextFrontier: bigint[] = [];

      for (const child of children) {
        const key = child.id.toString();
        if (visited.has(key)) {
          continue;
        }

        visited.add(key);
        nextFrontier.push(child.id);
      }

      frontier = nextFrontier;
    }

    return [...visited].map((id) => BigInt(id));
  }

  async create(data: NavigationNodeCreateInput) {
    if (data.parentId !== null) {
      const parent = await prisma.navigationNode.findUnique({
        where: { id: data.parentId },
        select: { id: true },
      });

      if (!parent) {
        throw new NavigationParentNotFoundError();
      }
    }

    return prisma.navigationNode.create({
      data: {
        parentId: data.parentId,
        title: data.title,
        slug: data.slug,
        prompt: data.prompt,
        answerSummary: data.answerSummary,
        responseType: data.responseType,
        linkLabel: data.linkLabel,
        linkUrl: data.linkUrl,
        evidenceExcerpt: data.evidenceExcerpt,
        evidenceSource: data.evidenceSource,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
      },
    });
  }

  async recordAccess(data: NavigationNodeAccessLogCreateInput) {
    return prisma.navigationNodeAccessLog.create({
      data: {
        navigationNodeId: data.navigationNodeId,
        selectedOptionLabel: data.selectedOptionLabel ?? null,
        selectedOptionTarget: data.selectedOptionTarget ?? null,
      },
    });
  }

  async registerNavigationJourney(data: RegisterNavigationJourneyInput) {
    const sessionKey = `${data.userId ?? 'anon'}:${data.ipAddress}`;

    const currentJourney = await prisma.navigationJourney.findUnique({
      where: { sessionKey },
    });

    const entry: Prisma.JsonObject = {
      nodeId: data.nodeId.toString(),
      slug: data.nodeSlug,
      accessedAt: new Date().toISOString(),
      optionLabel: data.selectedOptionLabel ?? null,
      optionTargetId: data.selectedOptionTarget ? data.selectedOptionTarget.toString() : null,
    };

    if (!currentJourney) {
      return prisma.navigationJourney.create({
        data: {
          sessionKey,
          userId: data.userId,
          ipAddress: data.ipAddress,
          navigationFlow: [entry],
          lastNodeId: data.nodeId,
          lastNodeSlug: data.nodeSlug,
          totalSteps: 1,
        },
      });
    }

    const currentFlow = Array.isArray(currentJourney.navigationFlow)
      ? currentJourney.navigationFlow
      : [];

    return prisma.navigationJourney.update({
      where: { sessionKey },
      data: {
        navigationFlow: [...currentFlow, entry],
        lastNodeId: data.nodeId,
        lastNodeSlug: data.nodeSlug,
        totalSteps: currentJourney.totalSteps + 1,
      },
    });
  }

  async listNavigationJourneys(input: ListNavigationJourneysInput) {
    const skip = (input.page - 1) * input.pageSize;

    const [rows, total] = await Promise.all([
      prisma.navigationJourney.findMany({
        skip,
        take: input.pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.navigationJourney.count(),
    ]);

    return {
      page: input.page,
      pageSize: input.pageSize,
      total,
      data: rows,
    };
  }

  async countNodeAccesses(nodeId: bigint, window?: NavigationAnalyticsWindowInput) {
    const accessedAtWhere =
      window?.from || window?.to
        ? {
            ...(window?.from ? { gte: window.from } : {}),
            ...(window?.to ? { lte: window.to } : {}),
          }
        : undefined;

    return prisma.navigationNodeAccessLog.count({
      where: {
        navigationNodeId: nodeId,
        ...(accessedAtWhere ? { accessedAt: accessedAtWhere } : {}),
      },
    });
  }

  async topAccessedNodes(input: TopAccessedNodesInput) {
    const scopedIds = input.withinNodeId
      ? await this.getNodeSubtreeIds(input.withinNodeId)
      : null;

    const accessedAtWhere =
      input.from || input.to
        ? {
            ...(input.from ? { gte: input.from } : {}),
            ...(input.to ? { lte: input.to } : {}),
          }
        : undefined;

    const where = {
      ...(accessedAtWhere ? { accessedAt: accessedAtWhere } : {}),
      ...(scopedIds ? { navigationNodeId: { in: scopedIds } } : {}),
    };

    const grouped = await prisma.navigationNodeAccessLog.groupBy({
      by: ['navigationNodeId'],
      where,
      _count: {
        navigationNodeId: true,
      },
      orderBy: {
        _count: {
          navigationNodeId: 'desc',
        },
      },
      take: input.limit,
    });

    if (grouped.length === 0) {
      return [];
    }

    const ids = grouped.map((item) => item.navigationNodeId);
    const nodes = await prisma.navigationNode.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    const nodesById = new Map(nodes.map((node) => [node.id.toString(), node]));

    return grouped.map((item) => ({
      navigationNodeId: item.navigationNodeId,
      accesses: item._count.navigationNodeId,
      node: nodesById.get(item.navigationNodeId.toString()) ?? null,
    }));
  }

  async list(input: ListNavigationNodesInput) {
    const where = {
      ...(typeof input.parentId !== 'undefined' ? { parentId: input.parentId } : {}),
      ...(input.onlyActive ? { isActive: true } : {}),
    };

    return prisma.navigationNode.findMany({
      where,
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async getById(id: bigint) {
    return prisma.navigationNode.findUnique({
      where: { id },
    });
  }

  async updateById(id: bigint, data: NavigationNodeUpdateInput) {
    return prisma.navigationNode.update({
      where: { id },
      data,
    });
  }

  async getBySlug(slug: string) {
    return prisma.navigationNode.findUnique({
      where: { slug },
      include: {
        children: {
          where: {
            isActive: true,
          },
          orderBy: [
            { displayOrder: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });
  }
}
