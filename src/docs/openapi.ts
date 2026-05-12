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
        },
        required: ['token', 'expiresIn'],
      },
      UserPublic: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['ADMIN', 'SECRETARIA'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
      },
      CreateUserInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
        },
        required: ['name', 'email', 'password'],
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
          evidenceExcerpt: { type: 'string', nullable: true },
          evidenceSource: { type: 'string', nullable: true },
          displayOrder: { type: 'integer' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'title', 'slug', 'displayOrder', 'isActive', 'createdAt', 'updatedAt'],
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
        },
        required: ['title', 'slug'],
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
  },
} as const;

export default openApiDocument;
