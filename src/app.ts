import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import openApiDocument from './docs/openapi';
import router from './routers';

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Lightweight request logger for local/dev and container debugging.
  app.use((req, res, next) => {
    const startedAt = Date.now();
    const requestId = Math.random().toString(36).slice(2, 10);

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      console.log(
        `[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms`,
      );
    });

    next();
  });

  app.get('/api/openapi.json', (_req, res) => {
    res.status(200).json(openApiDocument);
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use('/api', router);

  app.get('/', (_req, res) => {
    res.send('Bem-vindo à API de Autoatendimento!');
  });

  // Last middleware: catches unhandled route errors and keeps logs explicit.
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[HTTP_ERROR]', error);

    if (res.headersSent) {
      return;
    }

    res.status(500).json({
      message: 'Erro interno no servidor.',
      code: 'INTERNAL_ERROR',
    });
  });

  return app;
};
