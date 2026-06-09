import { config } from 'dotenv';
import { postgres } from './core/database/postgres';
import { connectPrisma, disconnectPrisma } from './core/database/prisma';
import { createApp } from './app';
import { ensureDefaultAdminUser } from './bootstrap/ensure-default-admin';

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
    console.log(`[BOOT] Starting API (NODE_ENV=${process.env.NODE_ENV ?? 'undefined'})`);
    await Promise.all([postgres.connect(), connectPrisma()]);
    await ensureDefaultAdminUser();

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

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED_REJECTION]', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT_EXCEPTION]', error);
});

void startServer();