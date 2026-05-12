import { UserRole } from '@prisma/client';
import type { IPostUsersRepository } from '../../controllers/create-users/protocols';
import { prisma } from '../../core/database/prisma';
import type { UserCreateData } from '../../models/users';

export class PostgresPostUsers implements IPostUsersRepository {
    async postUser(userData: UserCreateData) {
        const newUser = await prisma.user.create({
            data: {
                name: userData.name,
                email: userData.email,
                passwordHash: userData.passwordHash,
                role: userData.role ?? UserRole.SECRETARIA,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return newUser;
    }
}