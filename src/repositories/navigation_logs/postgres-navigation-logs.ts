import { prisma } from '../../core/database/prisma';

export interface NavigationNodeCreateInput {
  parentId: bigint | null;
  title: string;
  slug: string;
  prompt: string | null;
  answerSummary: string | null;
  evidenceExcerpt: string | null;
  evidenceSource: string | null;
  displayOrder: number;
  isActive: boolean;
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
        evidenceExcerpt: data.evidenceExcerpt,
        evidenceSource: data.evidenceSource,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
      },
    });
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
