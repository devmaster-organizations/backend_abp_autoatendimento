import express from 'express';
import { GetUsersController } from '../controllers/get-user/get-users';
import { PostgresGetUsers } from '../repositories/get-users/postgres-get-users';

const router = express.Router();

router.get('/', async (_req, res) => {
    const postgresGetRepository = new PostgresGetUsers();
    const getUsersController = new GetUsersController(postgresGetRepository);
    const result = await getUsersController.handler();

    res.status(result.statusCode).json(result.body);
});

export default router;