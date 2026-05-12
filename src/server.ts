import { config } from 'dotenv';
import { postgres } from './core/database/postgres';
import { connectPrisma, disconnectPrisma } from './core/database/prisma';
import { createApp } from './app';

config();

const app = createApp();
const PORT = process.env.PORT || 3000;

const shutdown = async (signal: string) => {
  console.log(`${signal} received. Closing connections...`);
  await Promise.allSettled([postgres.disconnect(), disconnectPrisma()]);
  process.exit(0);
};

const startServer = async () => {
  try {
    await Promise.all([postgres.connect(), connectPrisma()]);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start application', error);
    await Promise.allSettled([postgres.disconnect(), disconnectPrisma()]);
    process.exit(1);
  }
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

void startServer();