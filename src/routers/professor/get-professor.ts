import express from 'express';
import { GetProfessorController } from '../../controllers/professor/get-professor/get-professor';
// import { GetUsersController } from '../controllers/get-user/get-users'
// import { PostgresGetUsers } from '../repositories/get-users/postgres-get-users';

const router = express.Router();

router.get('/', async (req, res) => {
    // const postgresGetRepository = new PostgresGetUsers();
    const getProfessorController = new GetProfessorController();
    // const result = await getUsersController.handler();
    // res.json(result);
    res.json(getProfessorController.handler());
});

export default router;