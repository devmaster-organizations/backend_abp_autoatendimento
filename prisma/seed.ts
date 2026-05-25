import { navigationNodeData } from './navigation-node-data';
import { disconnectPrisma, prisma } from '../src/core/database/prisma';

async function seedNavigationNodes() {
  const nodes = navigationNodeData;
  const nodeKeys = new Set(nodes.map((node) => node.key));

  for (const node of nodes) {
    if (node.parentKey && !nodeKeys.has(node.parentKey)) {
      throw new Error(
        `Seed invalido: no "${node.key}" aponta para parentKey inexistente "${node.parentKey}".`,
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    const createdIdsByKey = new Map<string, bigint>();

    for (const node of nodes) {
      const parentId = node.parentKey ? createdIdsByKey.get(node.parentKey) ?? null : null;

      if (node.parentKey && parentId === null) {
        throw new Error(
          `Seed invalido: parentKey "${node.parentKey}" ainda nao foi processado antes do no "${node.key}".`,
        );
      }

      const createdNode = await tx.navigationNode.upsert({
        where: { slug: node.slug },
        create: {
          parentId,
          title: node.title,
          slug: node.slug,
          prompt: node.prompt,
          answerSummary: node.answerSummary,
          responseType: node.responseType,
          linkLabel: node.linkLabel,
          linkUrl: node.linkUrl,
          evidenceExcerpt: node.evidenceExcerpt,
          evidenceSource: node.evidenceSource,
          displayOrder: node.displayOrder,
          isActive: node.isActive,
        },
        update: {
          parentId,
          title: node.title,
          prompt: node.prompt,
          answerSummary: node.answerSummary,
          responseType: node.responseType,
          linkLabel: node.linkLabel,
          linkUrl: node.linkUrl,
          evidenceExcerpt: node.evidenceExcerpt,
          evidenceSource: node.evidenceSource,
          displayOrder: node.displayOrder,
          isActive: node.isActive,
        },
      });

      createdIdsByKey.set(node.key, createdNode.id);
    }
  });
}

seedNavigationNodes()
  .then(async () => {
    await disconnectPrisma();
  })
  .catch(async (error) => {
    console.error('Erro ao popular navigation_nodes:', error);
    await disconnectPrisma();
    process.exit(1);
  });
