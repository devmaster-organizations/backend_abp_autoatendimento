import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    navigationNode: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../src/core/database/prisma', () => ({
  prisma: mockPrisma,
  connectPrisma: vi.fn(),
  disconnectPrisma: vi.fn(),
}));

import { createApp } from '../src/app';

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
    mockPrisma.user.create.mockResolvedValue({
      id: 'u1',
      name: 'Ana',
      email: 'ana@email.com',
      role: 'SECRETARIA',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const app = createApp();
    const response = await request(app).post('/api/users').send({
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
    const app = createApp();
    const response = await request(app).post('/api/users').send({
      name: 'Ana',
    });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
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
    const response = await request(app).get('/api/users');

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
      evidenceExcerpt: null,
      evidenceSource: null,
      displayOrder: 0,
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const app = createApp();
    const response = await request(app).post('/api/navigation-logs').send({
      title: 'Inicio',
      slug: 'inicio',
    });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe('1');
    expect(response.body.slug).toBe('inicio');
  });

  it('POST /api/navigation-logs returns 400 for invalid parentId', async () => {
    const app = createApp();
    const response = await request(app).post('/api/navigation-logs').send({
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
});
