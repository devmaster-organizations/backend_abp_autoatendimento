import express from 'express';
import { Prisma, UserRole } from '@prisma/client';
import { GetUsersController } from '../controllers/get-user/get-users';
import { PostgresGetUsers } from '../repositories/get-users/postgres-get-users';
import { prisma } from '../core/database/prisma';

const router = express.Router();

const parseRole = (value: unknown): UserRole | undefined => {
    if (typeof value === 'undefined' || value === null) {
        return undefined;
    }

    const normalized = String(value).trim().toUpperCase();

    if (normalized === UserRole.ADMIN || normalized === UserRole.SECRETARIA) {
        return normalized as UserRole;
    }

    return undefined;
};

router.get('/', async (_req, res) => {
    const postgresGetRepository = new PostgresGetUsers();
    const getUsersController = new GetUsersController(postgresGetRepository);
    const result = await getUsersController.handler();

    res.status(result.statusCode).json(result.body);
});

router.patch('/:id', async (req, res) => {
    const userId = String(req.params.id ?? '').trim();

    if (!userId) {
        return res.status(400).json({
            message: 'id de usuario invalido.',
            code: 'VALIDATION_ERROR',
        });
    }

    const updates: {
        name?: string;
        email?: string;
        role?: UserRole;
    } = {};

    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
        const name = String(req.body.name ?? '').trim();

        if (!name) {
            return res.status(400).json({
                message: 'name nao pode ser vazio.',
                code: 'VALIDATION_ERROR',
            });
        }

        updates.name = name;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'email')) {
        const email = String(req.body.email ?? '').trim().toLowerCase();

        if (!email) {
            return res.status(400).json({
                message: 'email nao pode ser vazio.',
                code: 'VALIDATION_ERROR',
            });
        }

        updates.email = email;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'role')) {
        const parsedRole = parseRole(req.body.role);

        if (!parsedRole) {
            return res.status(400).json({
                message: 'role invalido. Use ADMIN ou SECRETARIA.',
                code: 'VALIDATION_ERROR',
            });
        }

        updates.role = parsedRole;
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            message: 'Nenhum campo valido informado para atualizacao.',
            code: 'VALIDATION_ERROR',
        });
    }

    try {
        const updated = await prisma.user.update({
            where: { id: userId },
            data: updates,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                mustChangePassword: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return res.status(200).json(updated);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(409).json({
                message: 'Email ja cadastrado.',
                code: 'EMAIL_CONFLICT',
            });
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({
                message: 'Usuario nao encontrado.',
                code: 'NOT_FOUND',
            });
        }

        return res.status(500).json({
            message: 'Erro interno ao atualizar usuario.',
            code: 'INTERNAL_ERROR',
        });
    }
});

router.delete('/:id', async (req, res) => {
    const userId = String(req.params.id ?? '').trim();
    const requestUser = (req as typeof req & { user?: { sub?: string } }).user;

    if (!userId) {
        return res.status(400).json({
            message: 'id de usuario invalido.',
            code: 'VALIDATION_ERROR',
        });
    }

    if (requestUser?.sub === userId) {
        return res.status(400).json({
            message: 'Nao e permitido excluir o proprio usuario logado.',
            code: 'VALIDATION_ERROR',
        });
    }

    try {
        await prisma.user.delete({ where: { id: userId } });
        return res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({
                message: 'Usuario nao encontrado.',
                code: 'NOT_FOUND',
            });
        }

        return res.status(500).json({
            message: 'Erro interno ao excluir usuario.',
            code: 'INTERNAL_ERROR',
        });
    }
});

export default router;