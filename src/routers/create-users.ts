import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { UserRole } from '@prisma/client';
import { PostgresPostUsers } from '../repositories/post-users/postgres-post-users';
import { CreateUsersController } from '../controllers/create-users/create-users';
import type { CreateUserInput } from '../controllers/create-users/protocols';
import { prisma } from '../core/database/prisma';

const generateTemporaryPassword = (): string => {
    const random = Math.random().toString(36).slice(-8).toUpperCase();
    return `FATEC-${random}`;
};

const parseRole = (roleValue: unknown): UserRole | undefined => {
    if (typeof roleValue === 'undefined' || roleValue === null) {
        return undefined;
    }

    const normalized = String(roleValue).trim().toUpperCase();

    if (normalized === UserRole.ADMIN || normalized === UserRole.SECRETARIA) {
        return normalized as UserRole;
    }

    return undefined;
};

const router = Router();

router.post('/', async (req, res) => {
    try {
    const { name, email, password, role } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                message: 'name e email sao obrigatorios.',
                code: 'VALIDATION_ERROR',
            });
        }

        const usersCount = await prisma.user.count();
        const isBootstrapCreation = usersCount === 0;

        if (isBootstrapCreation && !password) {
            return res.status(400).json({
                message: 'password e obrigatorio para criar o primeiro usuario.',
                code: 'VALIDATION_ERROR',
            });
        }

        const parsedRole = parseRole(role);

        if (typeof role !== 'undefined' && !parsedRole) {
            return res.status(400).json({
                message: 'role invalido. Use ADMIN ou SECRETARIA.',
                code: 'VALIDATION_ERROR',
            });
        }

        const temporaryPassword = isBootstrapCreation ? null : generateTemporaryPassword();
        const effectivePassword = isBootstrapCreation ? String(password) : temporaryPassword;

        const users: CreateUserInput = {
            name: String(name).trim(),
            email: String(email).trim().toLowerCase(),
            password: String(effectivePassword),
            ...(parsedRole ? { role: parsedRole } : {}),
            mustChangePassword: !isBootstrapCreation,
            passwordUpdatedAt: isBootstrapCreation ? new Date() : null,
        };

    const postgresPostRepository = new PostgresPostUsers();
    const createUsersController = new CreateUsersController(postgresPostRepository);
    const result = await createUsersController.handler(users);
    const responseBody = typeof result.body === 'string'
        ? { message: result.body }
        : result.body;

        return res.status(result.statusCode).json({
            ...responseBody,
            ...(temporaryPassword ? { temporaryPassword } : {}),
            mustChangePassword: !isBootstrapCreation,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(409).json({
                message: 'Email ja cadastrado.',
                code: 'EMAIL_CONFLICT',
            });
        }

        return res.status(500).json({
            message: 'Erro interno ao criar usuario.',
            code: 'INTERNAL_ERROR',
        });
    }
});

export default router;