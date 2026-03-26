import { Router } from 'express';
import { PostgresPostUsers } from '../repositories/post-users/postgres-post-users';
import { CreateUsersController } from '../controllers/create-users/create-users';
import { User } from '../models/users';

const router = Router();

router.post('/', async (req, res) => {
    const { name, email, password } = req.body;
    const users = new User(1, name, email, password);
    const postgresPostRepository = new PostgresPostUsers();
    const createUsersController = new CreateUsersController(postgresPostRepository);
    const result = await createUsersController.handler(users);
    res.status(result.statusCode).json(result.body);
});

export default router;