import {Router} from 'express';
import { IPostMaisUmController } from '../controllers/create-main-um/protocols';
import { CreateMaisUmController } from '../controllers/create-main-um/get-controller-main-um';
import { MaisUm } from '../models/maisum';
import { PostgresPostMaisUm } from '../repositories/post-mais-um/postgres-post-main-um';

const router = Router();

router.post('/', async (req, res) => {
    const { descricao } = req.body;
    const users = new MaisUm(null, descricao);
    const postgresPostRepository = new PostgresPostMaisUm();
    const createMaisUmController = new CreateMaisUmController(postgresPostRepository);
    const result = await createMaisUmController.handler(users);
    res.status(200).json({message: "MaisUm created successfully", data: result.body});
});

export default router;