const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Backend ABP Autoatendimento API',
    version: '1.0.0',
    description: 'Documentacao das rotas principais do backend de autoatendimento.',
  },
  servers: [
    {
      url: '/api',
      description: 'API base path',
    },
  ],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'NavigationLogs' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          code: { type: 'string' },
          details: {},
        },
        required: ['message', 'code'],
      },
      LoginInput: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
        },
        required: ['email', 'password'],
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'JWT Bearer token' },
          expiresIn: { type: 'string', example: '8h' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              role: { type: 'string', enum: ['ADMIN', 'SECRETARIA'] },
              mustChangePassword: { type: 'boolean' },
            },
            required: ['id', 'name', 'email', 'role', 'mustChangePassword'],
          },
        },
        required: ['token', 'expiresIn', 'user'],
      },
      ForgotPasswordInput: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
        required: ['email'],
      },
      ForgotPasswordResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
        },
        required: ['message'],
      },
      ResetPasswordInput: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          newPassword: { type: 'string', minLength: 8 },
        },
        required: ['token', 'newPassword'],
      },
      ChangePasswordInput: {
        type: 'object',
        properties: {
          currentPassword: { type: 'string', minLength: 1 },
          newPassword: { type: 'string', minLength: 8 },
        },
        required: ['currentPassword', 'newPassword'],
      },
      MessageResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
        required: ['message'],
      },
      UserPublic: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['ADMIN', 'SECRETARIA'] },
          mustChangePassword: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'name', 'email', 'role', 'mustChangePassword', 'createdAt', 'updatedAt'],
      },
      CreateUserInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6, nullable: true },
          role: { type: 'string', enum: ['ADMIN', 'SECRETARIA'] },
        },
        required: ['name', 'email'],
      },
      UpdateUserInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['ADMIN', 'SECRETARIA'] },
        },
      },
      NavigationNode: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'BigInt serializado como string' },
          parentId: { type: 'string', nullable: true, description: 'BigInt serializado como string' },
          title: { type: 'string' },
          slug: { type: 'string' },
          prompt: { type: 'string', nullable: true },
          answerSummary: { type: 'string', nullable: true },
          responseType: { type: 'string', enum: ['TEXT', 'LINK'] },
          linkLabel: { type: 'string', nullable: true },
          linkUrl: { type: 'string', nullable: true },
          evidenceExcerpt: { type: 'string', nullable: true },
          evidenceSource: { type: 'string', nullable: true },
          displayOrder: { type: 'integer' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'title', 'slug', 'responseType', 'displayOrder', 'isActive', 'createdAt', 'updatedAt'],
      },
      NavigationNodeWithChildren: {
        allOf: [
          { $ref: '#/components/schemas/NavigationNode' },
          {
            type: 'object',
            properties: {
              children: {
                type: 'array',
                items: { $ref: '#/components/schemas/NavigationNode' },
              },
            },
          },
        ],
      },
      NavigationJourneyEntry: {
        type: 'object',
        properties: {
          nodeId: { type: 'string' },
          slug: { type: 'string' },
          accessedAt: { type: 'string', format: 'date-time' },
          optionLabel: { type: 'string', nullable: true },
          optionTargetId: { type: 'string', nullable: true },
        },
      },
      NavigationJourney: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          sessionKey: { type: 'string' },
          userId: { type: 'string', nullable: true },
          ipAddress: { type: 'string' },
          navigationFlow: {
            type: 'array',
            items: { $ref: '#/components/schemas/NavigationJourneyEntry' },
          },
          lastNodeId: { type: 'string', nullable: true },
          lastNodeSlug: { type: 'string', nullable: true },
          totalSteps: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      NavigationTopAccessedItem: {
        type: 'object',
        properties: {
          navigationNodeId: { type: 'string' },
          accesses: { type: 'integer' },
          node: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              slug: { type: 'string' },
            },
          },
        },
      },
      CreateNavigationNodeInput: {
        type: 'object',
        properties: {
          parentId: {
            oneOf: [{ type: 'string' }, { type: 'null' }],
            description: 'BigInt serializado como string ou null',
          },
          title: { type: 'string' },
          slug: { type: 'string' },
          prompt: { type: 'string' },
          answerSummary: { type: 'string' },
          evidenceExcerpt: { type: 'string' },
          evidenceSource: { type: 'string' },
          displayOrder: { type: 'integer', default: 0 },
          isActive: { type: 'boolean', default: true },
          responseType: { type: 'string', enum: ['TEXT', 'LINK'], default: 'TEXT' },
          linkLabel: { type: 'string' },
          linkUrl: { type: 'string' },
        },
        required: ['title', 'slug'],
      },
      UpdateNavigationNodeInput: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          slug: { type: 'string' },
          prompt: { type: 'string', nullable: true },
          answerSummary: { type: 'string', nullable: true },
          responseType: { type: 'string', enum: ['TEXT', 'LINK'] },
          linkLabel: { type: 'string', nullable: true },
          linkUrl: { type: 'string', nullable: true },
          evidenceExcerpt: { type: 'string', nullable: true },
          evidenceSource: { type: 'string', nullable: true },
          displayOrder: { type: 'integer' },
          isActive: { type: 'boolean' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Healthcheck da API',
        responses: {
          '200': {
            description: 'API operante',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Autentica usuario e retorna JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Autenticado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '400': {
            description: 'Payload invalido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '401': {
            description: 'Credenciais invalidas',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Gera token de recuperacao de senha',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ForgotPasswordInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Processo de recuperacao iniciado (token enviado por e-mail)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ForgotPasswordResponse' },
              },
            },
          },
          '500': {
            description: 'Falha ao enviar e-mail de recuperacao',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '400': {
            description: 'Payload invalido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Redefine senha com token de recuperacao',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ResetPasswordInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Senha redefinida',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
          '400': {
            description: 'Token invalido/expirado ou payload invalido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Troca senha autenticada (primeiro acesso ou manutencao)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChangePasswordInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Senha alterada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
          '400': {
            description: 'Payload invalido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '401': {
            description: 'Nao autenticado ou senha atual invalida',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/users': {
      post: {
        tags: ['Users'],
        summary: 'Cria usuario',
        security: [{ bearerAuth: [] }],
        description:
          'A primeira criacao de usuario (quando nao existe nenhum no banco) pode ser feita sem token. A partir do segundo usuario, JWT Bearer e obrigatorio.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateUserInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Usuario criado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserPublic' },
              },
            },
          },
          '400': {
            description: 'Payload invalido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '409': {
            description: 'Email ja cadastrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      get: {
        tags: ['Users'],
        summary: 'Lista usuarios',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de usuarios',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/UserPublic' },
                },
              },
            },
          },
        },
      },
    },
    '/users/{id}': {
      patch: {
        tags: ['Users'],
        summary: 'Atualiza dados do usuario',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Usuario atualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserPublic' },
              },
            },
          },
          '400': {
            description: 'Payload invalido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '404': {
            description: 'Usuario nao encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '409': {
            description: 'Email ja cadastrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Exclui usuario por id',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '204': {
            description: 'Usuario excluido',
          },
          '400': {
            description: 'Validacao',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '404': {
            description: 'Usuario nao encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/navigation-logs': {
      post: {
        tags: ['NavigationLogs'],
        summary: 'Cria no de navegacao',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateNavigationNodeInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'No criado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NavigationNode' },
              },
            },
          },
          '400': {
            description: 'Validacao',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '404': {
            description: 'Parent nao encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '409': {
            description: 'Slug duplicado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      get: {
        tags: ['NavigationLogs'],
        summary: 'Lista nos de navegacao',
        parameters: [
          {
            name: 'parentId',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'BigInt serializado como string. Use null para nos raiz.',
          },
          {
            name: 'onlyActive',
            in: 'query',
            required: false,
            schema: { type: 'boolean', default: true },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de nos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/NavigationNode' },
                },
              },
            },
          },
          '400': {
            description: 'Filtro invalido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/navigation-logs/{slug}': {
      get: {
        tags: ['NavigationLogs'],
        summary: 'Busca no de navegacao por slug',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'optionLabel',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Opção selecionada que levou até este nó.',
          },
          {
            name: 'optionTargetId',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'BigInt serializado como string do nó alvo da opção.',
          },
        ],
        responses: {
          '200': {
            description: 'No encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NavigationNodeWithChildren' },
              },
            },
          },
          '404': {
            description: 'Nao encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/navigation-logs/{id}': {
      patch: {
        tags: ['NavigationLogs'],
        summary: 'Atualiza parcialmente no de navegacao por id',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'BigInt serializado como string.',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateNavigationNodeInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'No atualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NavigationNode' },
              },
            },
          },
          '400': {
            description: 'Validacao',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '404': {
            description: 'No nao encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '409': {
            description: 'Slug duplicado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/navigation-logs/analytics/navigations': {
      get: {
        tags: ['NavigationLogs'],
        summary: 'Lista navegacoes registradas (JSONB) com paginacao',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'pageSize',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 20 },
          },
        ],
        responses: {
          '200': {
            description: 'Navegacoes paginadas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer' },
                    pageSize: { type: 'integer' },
                    total: { type: 'integer' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/NavigationJourney' },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validacao',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/navigation-logs/analytics/node/{id}/accesses': {
      get: {
        tags: ['NavigationLogs'],
        summary: 'Retorna quantas vezes o no foi acessado',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'period',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['week', 'month'] },
            description: 'Atalho de janela temporal. Nao combine com from/to.',
          },
          {
            name: 'from',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'date-time' },
            description: 'Inicio da janela temporal (ISO-8601).',
          },
          {
            name: 'to',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'date-time' },
            description: 'Fim da janela temporal (ISO-8601).',
          },
        ],
        responses: {
          '200': {
            description: 'Quantidade de acessos por no',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    nodeId: { type: 'string' },
                    accesses: { type: 'integer' },
                    period: { type: 'string', enum: ['week', 'month'], nullable: true },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validacao',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/navigation-logs/analytics/top-accessed': {
      get: {
        tags: ['NavigationLogs'],
        summary: 'Retorna os nos mais acessados',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 4 },
          },
          {
            name: 'withinNodeId',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Escopo para buscar os mais acessados dentro da subarvore deste no.',
          },
          {
            name: 'period',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['week', 'month'] },
            description: 'Atalho de janela temporal. Nao combine com from/to.',
          },
          {
            name: 'from',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'date-time' },
            description: 'Inicio da janela temporal (ISO-8601).',
          },
          {
            name: 'to',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'date-time' },
            description: 'Fim da janela temporal (ISO-8601).',
          },
        ],
        responses: {
          '200': {
            description: 'Top acessos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    limit: { type: 'integer' },
                    withinNodeId: { type: 'string', nullable: true },
                    period: { type: 'string', enum: ['week', 'month'], nullable: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/NavigationTopAccessedItem' },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validacao',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
} as const;

export default openApiDocument;
