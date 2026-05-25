import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    navigationNode: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    navigationNodeAccessLog: {
      create: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    navigationJourney: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('../src/core/database/prisma', () => ({
  prisma: mockPrisma,
  connectPrisma: vi.fn(),
  disconnectPrisma: vi.fn(),
}));

import { createApp } from '../src/app';
import { signToken } from '../src/core/security/jwt';

// token valido para testes (usa o mesmo JWT_SECRET padrao do middleware)
const testToken = signToken({ sub: 'test-user-id', role: 'ADMIN' });

describe('API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/health returns status and timestamp', async () => {
    const app = createApp();
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('GET /api/openapi.json returns OpenAPI document', async () => {
    const app = createApp();
    const response = await request(app).get('/api/openapi.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.paths['/users']).toBeDefined();
    expect(response.body.paths['/navigation-logs']).toBeDefined();
  });

  it('POST /api/users creates a user with public payload', async () => {
    mockPrisma.user.count.mockResolvedValue(1);
    mockPrisma.user.create.mockResolvedValue({
      id: 'u1',
      name: 'Ana',
      email: 'ana@email.com',
      role: 'SECRETARIA',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const app = createApp();
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        name: 'Ana',
        email: 'ana@email.com',
        password: '123456',
      });

    expect(response.status).toBe(201);
    expect(response.body.email).toBe('ana@email.com');
    expect(response.body.password).toBeUndefined();
    expect(response.body.passwordHash).toBeUndefined();
    expect(mockPrisma.user.create).toHaveBeenCalledOnce();
  });

  it('POST /api/users returns 400 when payload is invalid', async () => {
    mockPrisma.user.count.mockResolvedValue(1);
    const app = createApp();
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ name: 'Ana' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/users allows first user creation without token', async () => {
    mockPrisma.user.count.mockResolvedValue(0);
    mockPrisma.user.create.mockResolvedValue({
      id: 'u1',
      name: 'Admin',
      email: 'admin@email.com',
      role: 'ADMIN',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const app = createApp();
    const response = await request(app).post('/api/users').send({
      name: 'Admin',
      email: 'admin@email.com',
      password: '123456',
    });

    expect(response.status).toBe(201);
    expect(response.body.email).toBe('admin@email.com');
  });

  it('GET /api/users returns array', async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      {
        id: 'u1',
        name: 'Ana',
        email: 'ana@email.com',
        role: 'SECRETARIA',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    const app = createApp();
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0].email).toBe('ana@email.com');
  });

  it('POST /api/navigation-logs creates root node', async () => {
    mockPrisma.navigationNode.create.mockResolvedValue({
      id: BigInt(1),
      parentId: null,
      title: 'Inicio',
      slug: 'inicio',
      prompt: null,
      answerSummary: null,
      responseType: 'TEXT',
      linkLabel: null,
      linkUrl: null,
      evidenceExcerpt: null,
      evidenceSource: null,
      displayOrder: 0,
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const app = createApp();
    const response = await request(app)
      .post('/api/navigation-logs')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        title: 'Inicio',
        slug: 'inicio',
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe('1');
    expect(response.body.slug).toBe('inicio');
  });

  it('POST /api/navigation-logs returns 400 for invalid parentId', async () => {
    const app = createApp();
    const response = await request(app)
      .post('/api/navigation-logs')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        title: 'Inicio',
        slug: 'inicio',
        parentId: 'abc',
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/navigation-logs returns ordered list', async () => {
    mockPrisma.navigationNode.findMany.mockResolvedValue([
      {
        id: BigInt(1),
        parentId: null,
        title: 'Inicio',
        slug: 'inicio',
        prompt: null,
        answerSummary: null,
        responseType: 'TEXT',
        linkLabel: null,
        linkUrl: null,
        evidenceExcerpt: null,
        evidenceSource: null,
        displayOrder: 0,
        isActive: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    const app = createApp();
    const response = await request(app).get('/api/navigation-logs?onlyActive=true');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0].id).toBe('1');
  });

  it('GET /api/navigation-logs/:slug returns 404 when slug does not exist', async () => {
    mockPrisma.navigationNode.findUnique.mockResolvedValue(null);

    const app = createApp();
    const response = await request(app).get('/api/navigation-logs/inexistente');

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });

  it('GET /api/navigation-logs/:slug records access log', async () => {
    mockPrisma.navigationNode.findUnique.mockResolvedValue({
      id: BigInt(9),
      parentId: BigInt(1),
      title: 'Localização',
      slug: 'geral-localizacao',
      prompt: null,
      answerSummary: 'A Fatec Jacareí fica em Jacareí, SP.',
      responseType: 'LINK',
      linkLabel: 'Abrir mapa da unidade',
      linkUrl: 'https://www.google.com/maps/search/?api=1&query=Fatec+Jacare%C3%AD',
      evidenceExcerpt: null,
      evidenceSource: null,
      displayOrder: 2,
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      children: [],
    });
    mockPrisma.navigationNodeAccessLog.create.mockResolvedValue({
      id: BigInt(1),
      navigationNodeId: BigInt(9),
      selectedOptionLabel: 'Localização',
      selectedOptionTarget: BigInt(9),
      accessedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    mockPrisma.navigationJourney.findUnique.mockResolvedValue(null);
    mockPrisma.navigationJourney.create.mockResolvedValue({
      id: BigInt(1),
      sessionKey: 'anon:::ffff:127.0.0.1',
      userId: null,
      ipAddress: '::ffff:127.0.0.1',
      navigationFlow: [],
      lastNodeId: BigInt(9),
      lastNodeSlug: 'geral-localizacao',
      totalSteps: 1,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const app = createApp();
    const response = await request(app).get('/api/navigation-logs/geral-localizacao?optionLabel=Localização&optionTargetId=9');

    expect(response.status).toBe(200);
    expect(response.body.id).toBe('9');
    expect(mockPrisma.navigationNodeAccessLog.create).toHaveBeenCalledOnce();
    expect(mockPrisma.navigationNodeAccessLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          navigationNodeId: BigInt(9),
          selectedOptionLabel: 'Localização',
          selectedOptionTarget: BigInt(9),
        },
      }),
    );
    expect(mockPrisma.navigationJourney.create).toHaveBeenCalledOnce();
  });

  it('GET /api/navigation-logs/analytics/navigations returns paginated journeys', async () => {
    mockPrisma.navigationJourney.findMany.mockResolvedValue([
      {
        id: BigInt(1),
        sessionKey: 'anon:127.0.0.1',
        userId: null,
        ipAddress: '127.0.0.1',
        navigationFlow: [{ nodeId: '1', slug: 'inicio' }],
        lastNodeId: BigInt(1),
        lastNodeSlug: 'inicio',
        totalSteps: 1,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
    mockPrisma.navigationJourney.count.mockResolvedValue(1);

    const app = createApp();
    const response = await request(app)
      .get('/api/navigation-logs/analytics/navigations?page=1&pageSize=10')
      .set('Authorization', `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.data[0].id).toBe('1');
  });

  it('GET /api/navigation-logs/analytics/node/:id/accesses returns count', async () => {
    mockPrisma.navigationNodeAccessLog.count.mockResolvedValue(12);

    const app = createApp();
    const response = await request(app)
      .get('/api/navigation-logs/analytics/node/4/accesses')
      .set('Authorization', `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(response.body.nodeId).toBe('4');
    expect(response.body.accesses).toBe(12);
  });

  it('GET /api/navigation-logs/analytics/node/:id/accesses supports period filter', async () => {
    mockPrisma.navigationNodeAccessLog.count.mockResolvedValue(7);

    const app = createApp();
    const response = await request(app)
      .get('/api/navigation-logs/analytics/node/4/accesses?period=week')
      .set('Authorization', `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(response.body.nodeId).toBe('4');
    expect(response.body.accesses).toBe(7);
    expect(response.body.period).toBe('week');
  });

  it('GET /api/navigation-logs/analytics/top-accessed returns top 4', async () => {
    mockPrisma.navigationNodeAccessLog.groupBy.mockResolvedValue([
      { navigationNodeId: BigInt(4), _count: { navigationNodeId: 22 } },
      { navigationNodeId: BigInt(2), _count: { navigationNodeId: 10 } },
    ]);
    mockPrisma.navigationNode.findMany.mockResolvedValue([
      { id: BigInt(4), title: 'Node 4', slug: 'node-4' },
      { id: BigInt(2), title: 'Node 2', slug: 'node-2' },
    ]);

    const app = createApp();
    const response = await request(app)
      .get('/api/navigation-logs/analytics/top-accessed?limit=4')
      .set('Authorization', `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(response.body.limit).toBe(4);
    expect(response.body.data[0].navigationNodeId).toBe('4');
    expect(response.body.data[0].accesses).toBe(22);
  });

  it('GET /api/navigation-logs/analytics/top-accessed supports period and withinNodeId filters', async () => {
    mockPrisma.navigationNode.findMany
      .mockResolvedValueOnce([
        { id: BigInt(4) },
        { id: BigInt(40) },
      ] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([
        { id: BigInt(4), title: 'Node 4', slug: 'node-4' },
        { id: BigInt(40), title: 'Node 40', slug: 'node-40' },
      ] as never);

    mockPrisma.navigationNodeAccessLog.groupBy.mockResolvedValue([
      { navigationNodeId: BigInt(40), _count: { navigationNodeId: 15 } },
      { navigationNodeId: BigInt(4), _count: { navigationNodeId: 9 } },
    ]);

    const app = createApp();
    const response = await request(app)
      .get('/api/navigation-logs/analytics/top-accessed?limit=4&period=week&withinNodeId=4')
      .set('Authorization', `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(response.body.limit).toBe(4);
    expect(response.body.period).toBe('week');
    expect(response.body.withinNodeId).toBe('4');
    expect(response.body.data[0].navigationNodeId).toBe('40');
  });

  it('PATCH /api/navigation-logs/:id updates only allowed fields', async () => {
    mockPrisma.navigationNode.findUnique.mockResolvedValue({
      id: BigInt(1),
      parentId: null,
      title: 'Inicio',
      slug: 'inicio',
      prompt: null,
      answerSummary: null,
      responseType: 'TEXT',
      linkLabel: null,
      linkUrl: null,
      evidenceExcerpt: null,
      evidenceSource: null,
      displayOrder: 0,
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    mockPrisma.navigationNode.update.mockResolvedValue({
      id: BigInt(1),
      parentId: null,
      title: 'Inicio atualizado',
      slug: 'inicio',
      prompt: null,
      answerSummary: null,
      responseType: 'TEXT',
      linkLabel: null,
      linkUrl: null,
      evidenceExcerpt: null,
      evidenceSource: null,
      displayOrder: 3,
      isActive: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    const app = createApp();
    const response = await request(app)
      .patch('/api/navigation-logs/1')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        title: 'Inicio atualizado',
        displayOrder: 3,
        isActive: false,
      });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe('1');
    expect(response.body.title).toBe('Inicio atualizado');
    expect(mockPrisma.navigationNode.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: BigInt(1) },
        data: {
          title: 'Inicio atualizado',
          displayOrder: 3,
          isActive: false,
        },
      }),
    );
  });

  it('PATCH /api/navigation-logs/:id rejects immutable fields', async () => {
    const app = createApp();
    const response = await request(app)
      .patch('/api/navigation-logs/1')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        parentId: '99',
        title: 'Novo título',
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('IMMUTABLE_FIELDS');
    expect(mockPrisma.navigationNode.update).not.toHaveBeenCalled();
  });
});
