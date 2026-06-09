import { UserRole } from '@prisma/client';
import { prisma } from '../core/database/prisma';
import { hashPassword, verifyPassword } from '../core/security/password';

const DEFAULT_ADMIN_EMAIL = 'admin@admin.com';
const DEFAULT_ADMIN_PASSWORD = 'admin';
const DEFAULT_ADMIN_NAME = 'Administrador';

export const ensureDefaultAdminUser = async () => {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: DEFAULT_ADMIN_EMAIL },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: DEFAULT_ADMIN_NAME,
        email: DEFAULT_ADMIN_EMAIL,
        passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
        role: UserRole.ADMIN,
        mustChangePassword: false,
        passwordUpdatedAt: new Date(),
      },
    });

    console.log('[BOOT] Usuario admin padrao criado: admin@admin.com');
    return;
  }

  const hasDefaultPassword = verifyPassword(DEFAULT_ADMIN_PASSWORD, existingAdmin.passwordHash);

  if (existingAdmin.role !== UserRole.ADMIN || !hasDefaultPassword || existingAdmin.mustChangePassword) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        name: existingAdmin.name?.trim() ? existingAdmin.name : DEFAULT_ADMIN_NAME,
        role: UserRole.ADMIN,
        passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
        mustChangePassword: false,
        passwordUpdatedAt: new Date(),
      },
    });

    console.log('[BOOT] Usuario admin padrao atualizado: admin@admin.com');
  }
};