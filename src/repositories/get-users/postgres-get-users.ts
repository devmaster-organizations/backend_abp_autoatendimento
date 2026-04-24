import type { IGetUsersRepository } from '../../controllers/get-user/protocols';
import { prisma } from '../../core/database/prisma';

export class PostgresGetUsers implements IGetUsersRepository {
    async getUsers() {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return users;
    }
}