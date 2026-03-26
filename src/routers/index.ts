import { Router } from 'express';
import getUsersRouter from './get-users';
import createNoticiasRouter from './create-noticias';
import healthRouter from './health';

const router = Router();

router.use('/', healthRouter);


router.use('/users', getUsersRouter);
router.use('/noticias', createNoticiasRouter);

export default router;