import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl } from './settings';

declare global {
  var prismaClient: PrismaClient | undefined;
}

const prismaAdapter = new PrismaPg({
  connectionString: getDatabaseUrl(),
});

const createPrismaClient = () =>
  new PrismaClient({
    adapter: prismaAdapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

export const prisma = globalThis.prismaClient ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaClient = prisma;
}

export const connectPrisma = async () => {
  await prisma.$connect();
  console.log('Prisma connected');
};

export const disconnectPrisma = async () => {
  await prisma.$disconnect();
  console.log('Prisma disconnected');
};
