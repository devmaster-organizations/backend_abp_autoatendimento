import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { PostgresPostUsers } from '../repositories/post-users/postgres-post-users';
import { CreateUsersController } from '../controllers/create-users/create-users';
import type { CreateUserInput } from '../controllers/create-users/protocols';

const router = Router();

router.post('/', async (req, res) => {
    try {
    const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'name, email e password sao obrigatorios.',
                code: 'VALIDATION_ERROR',
            });
        }

        const users: CreateUserInput = {
            name: String(name).trim(),
            email: String(email).trim().toLowerCase(),
            password: String(password),
        };

    const postgresPostRepository = new PostgresPostUsers();
    const createUsersController = new CreateUsersController(postgresPostRepository);
    const result = await createUsersController.handler(users);

        return res.status(result.statusCode).json(result.body);
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