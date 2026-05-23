import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl } from '../src/core/database/settings';

const prismaAdapter = new PrismaPg({
  connectionString: getDatabaseUrl(),
});

const prisma = new PrismaClient({
  adapter: prismaAdapter,
});

const chatFlowData = [
  {
    id: 'inicio',
    botMessage: 'Ola! Qual sua duvida?',
    options: [
      { label: 'Curso', nextId: 'curso' },
      { label: 'Geral', nextId: 'geral' },
    ],
  },
  {
    id: 'curso',
    botMessage: 'Nossos cursos sao:',
    options: [
      { label: 'DSM', nextId: 'curso-dsm' },
      { label: 'GEO', nextId: 'curso-geo' },
      { label: 'MB', nextId: 'curso-mb' },
      { label: 'Voltar para anterior', nextId: 'inicio' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
  {
    id: 'curso-dsm',
    botMessage:
      'DSM e o curso de Desenvolvimento de Software Multiplataforma. Ele forma profissionais para criar sistemas web, mobile e solucoes digitais.',
    options: [
      { label: 'Grade curricular', nextId: 'dsm-grade' },
      { label: 'Duracao do curso', nextId: 'dsm-duracao' },
      { label: 'Voltar para cursos', nextId: 'curso' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
  {
    id: 'dsm-grade',
    botMessage:
      'A grade de DSM inclui programacao, banco de dados, engenharia de software, desenvolvimento web, mobile, cloud e projetos integradores.',
    options: [
      { label: 'Voltar para DSM', nextId: 'curso-dsm' },
      { label: 'Voltar para cursos', nextId: 'curso' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
  {
    id: 'dsm-duracao',
    botMessage: 'O curso de DSM tem duracao de 6 semestres, totalizando 3 anos.',
    options: [
      { label: 'Voltar para DSM', nextId: 'curso-dsm' },
      { label: 'Voltar para cursos', nextId: 'curso' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
  {
    id: 'curso-geo',
    botMessage:
      'GEO e o curso de Geoprocessamento, voltado a mapas digitais, analise espacial, sensoriamento remoto e dados geograficos.',
    options: [
      { label: 'Areas de atuacao', nextId: 'geo-atuacao' },
      { label: 'Voltar para cursos', nextId: 'curso' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
  {
    id: 'geo-atuacao',
    botMessage:
      'Profissionais de GEO podem atuar com cartografia, planejamento urbano, meio ambiente, transporte, agricultura e sistemas de informacao geografica.',
    options: [
      { label: 'Voltar para GEO', nextId: 'curso-geo' },
      { label: 'Voltar para cursos', nextId: 'curso' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
  {
    id: 'curso-mb',
    botMessage:
      'MB e o curso de Meio Ambiente e Recursos Hidricos, com foco em sustentabilidade, gestao ambiental e preservacao dos recursos naturais.',
    options: [
      { label: 'Mercado de trabalho', nextId: 'mb-mercado' },
      { label: 'Voltar para cursos', nextId: 'curso' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
  {
    id: 'mb-mercado',
    botMessage:
      'A area permite atuar em empresas, orgaos publicos, consultorias ambientais, saneamento, licenciamento e projetos de conservacao.',
    options: [
      { label: 'Voltar para MB', nextId: 'curso-mb' },
      { label: 'Voltar para cursos', nextId: 'curso' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
  {
    id: 'geral',
    botMessage: 'Sobre qual assunto geral voce quer saber?',
    options: [
      { label: 'Horario de atendimento', nextId: 'geral-horario' },
      { label: 'Secretaria academica', nextId: 'geral-secretaria' },
      { label: 'Localizacao', nextId: 'geral-localizacao' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
  {
    id: 'geral-horario',
    botMessage:
      'O atendimento da unidade deve ser confirmado nos canais oficiais da Fatec Jacarei. Este prototipo usa informacoes simuladas.',
    options: [
      { label: 'Voltar para geral', nextId: 'geral' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
  {
    id: 'geral-secretaria',
    botMessage:
      'A secretaria academica auxilia com matricula, documentos, rematricula, historico escolar e declaracoes.',
    options: [
      { label: 'Voltar para geral', nextId: 'geral' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
  {
    id: 'geral-localizacao',
    botMessage:
      'A Fatec Jacarei fica em Jacarei, SP. Em uma versao futura, este item pode exibir mapa e rotas.',
    options: [
      { label: 'Voltar para geral', nextId: 'geral' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
];

async function seedChatFlow() {
  await prisma.$transaction(async (tx) => {
    // Clear existing data
    await tx.chatFlowOption.deleteMany({});
    await tx.chatFlowNode.deleteMany({});

    // Insert nodes
    for (const node of chatFlowData) {
      await tx.chatFlowNode.create({
        data: {
          id: node.id,
          botMessage: node.botMessage,
        },
      });
    }

    // Insert options
    for (const node of chatFlowData) {
      for (const [order, option] of node.options.entries()) {
        await tx.chatFlowOption.create({
          data: {
            label: option.label,
            fromNodeId: node.id,
            toNodeId: option.nextId,
            displayOrder: order,
          },
        });
      }
    }
  });

  console.log('✅ Chat flow seeded successfully');
}

seedChatFlow()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error('❌ Seed error:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
