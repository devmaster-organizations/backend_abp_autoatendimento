import { Router } from 'express';
import getUsersRouter from './get-users';
import createNoticiasRouter from './create-noticias';
import postUserRouter from './create-users';
import healthRouter from './health';

const router = Router();

router.use('/', healthRouter);


router.use('/users', getUsersRouter);
router.use('/noticias', createNoticiasRouter);
router.use('/users', postUserRouter);
export default router;