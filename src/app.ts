import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import openApiDocument from './docs/openapi';
import router from './routers';

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/openapi.json', (_req, res) => {
    res.status(200).json(openApiDocument);
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use('/api', router);

  app.get('/', (_req, res) => {
    res.send('Bem-vindo à API de Autoatendimento!');
  });

  return app;
};
