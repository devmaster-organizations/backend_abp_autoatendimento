import { chatFlowData } from './chat-flow-data';
import { disconnectPrisma, prisma } from '../src/core/database/prisma';

async function seedChatFlow() {
  const nodes = Object.values(chatFlowData);
  const nodeIds = new Set(nodes.map((node) => node.id));

  for (const node of nodes) {
    for (const option of node.options) {
      if (!nodeIds.has(option.nextId)) {
        throw new Error(
          `Fluxo invalido: no "${node.id}" aponta para nextId inexistente "${option.nextId}".`,
        );
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const node of nodes) {
      await tx.chatFlowNode.upsert({
        where: { id: node.id },
        create: {
          id: node.id,
          botMessage: node.botMessage,
        },
        update: {
          botMessage: node.botMessage,
        },
      });
    }

    // Recria as opcoes para refletir exatamente o hash atual do fluxo.
    await tx.chatFlowOption.deleteMany({});

    for (const node of nodes) {
      for (const [displayOrder, option] of node.options.entries()) {
        await tx.chatFlowOption.create({
          data: {
            label: option.label,
            fromNodeId: node.id,
            toNodeId: option.nextId,
            displayOrder,
          },
        });
      }
    }
  });
}

seedChatFlow()
  .then(async () => {
    await disconnectPrisma();
  })
  .catch(async (error) => {
    console.error('Erro ao popular chat_flow_nodes/chat_flow_options:', error);
    await disconnectPrisma();
    process.exit(1);
  });
