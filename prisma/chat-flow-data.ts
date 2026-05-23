export type ChatFlowOptionSeed = {
  label: string;
  nextId: string;
};

export type ChatFlowNodeSeed = {
  id: string;
  botMessage: string;
  options: ChatFlowOptionSeed[];
};

export const chatFlowData: Record<string, ChatFlowNodeSeed> = {
  inicio: {
    id: 'inicio',
    botMessage: 'Ola! Qual sua duvida?',
    options: [
      { label: 'Curso', nextId: 'curso' },
      { label: 'Geral', nextId: 'geral' },
    ],
  },
  curso: {
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
  'curso-dsm': {
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
  'dsm-grade': {
    id: 'dsm-grade',
    botMessage:
      'A grade de DSM inclui programacao, banco de dados, engenharia de software, desenvolvimento web, mobile, cloud e projetos integradores.',
    options: [
      { label: 'Voltar para DSM', nextId: 'curso-dsm' },
      { label: 'Voltar para cursos', nextId: 'curso' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
  'dsm-duracao': {
    id: 'dsm-duracao',
    botMessage:
      'O curso de DSM tem duracao de 6 semestres, totalizando 3 anos.',
    options: [
      { label: 'Voltar para DSM', nextId: 'curso-dsm' },
      { label: 'Voltar para cursos', nextId: 'curso' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
  'curso-geo': {
    id: 'curso-geo',
    botMessage:
      'GEO e o curso de Geoprocessamento, voltado a mapas digitais, analise espacial, sensoriamento remoto e dados geograficos.',
    options: [
      { label: 'Areas de atuacao', nextId: 'geo-atuacao' },
      { label: 'Voltar para cursos', nextId: 'curso' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
  'geo-atuacao': {
    id: 'geo-atuacao',
    botMessage:
      'Profissionais de GEO podem atuar com cartografia, planejamento urbano, meio ambiente, transporte, agricultura e sistemas de informacao geografica.',
    options: [
      { label: 'Voltar para GEO', nextId: 'curso-geo' },
      { label: 'Voltar para cursos', nextId: 'curso' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
  'curso-mb': {
    id: 'curso-mb',
    botMessage:
      'MB e o curso de Meio Ambiente e Recursos Hidricos, com foco em sustentabilidade, gestao ambiental e preservacao dos recursos naturais.',
    options: [
      { label: 'Mercado de trabalho', nextId: 'mb-mercado' },
      { label: 'Voltar para cursos', nextId: 'curso' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
  'mb-mercado': {
    id: 'mb-mercado',
    botMessage:
      'A area permite atuar em empresas, orgaos publicos, consultorias ambientais, saneamento, licenciamento e projetos de conservacao.',
    options: [
      { label: 'Voltar para MB', nextId: 'curso-mb' },
      { label: 'Voltar para cursos', nextId: 'curso' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
  geral: {
    id: 'geral',
    botMessage: 'Sobre qual assunto geral voce quer saber?',
    options: [
      { label: 'Horario de atendimento', nextId: 'geral-horario' },
      { label: 'Secretaria academica', nextId: 'geral-secretaria' },
      { label: 'Localizacao', nextId: 'geral-localizacao' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
  'geral-horario': {
    id: 'geral-horario',
    botMessage:
      'O atendimento da unidade deve ser confirmado nos canais oficiais da Fatec Jacarei. Este prototipo usa informacoes simuladas.',
    options: [
      { label: 'Voltar para geral', nextId: 'geral' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
  'geral-secretaria': {
    id: 'geral-secretaria',
    botMessage:
      'A secretaria academica auxilia com matricula, documentos, rematricula, historico escolar e declaracoes.',
    options: [
      { label: 'Voltar para geral', nextId: 'geral' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
  'geral-localizacao': {
    id: 'geral-localizacao',
    botMessage:
      'A Fatec Jacarei fica em Jacarei, SP. Em uma versao futura, este item pode exibir mapa e rotas.',
    options: [
      { label: 'Voltar para geral', nextId: 'geral' },
      { label: 'Voltar para o inicio', nextId: 'inicio' },
    ],
  },
};
