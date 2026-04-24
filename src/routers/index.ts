import { Router } from 'express';
import getUsersRouter from './get-users';
import createNoticiasRouter from './create-noticias';
import postUserRouter from './create-users';
import healthRouter from './health';
import professorRouter from './professor';
import createNavategionLogsRouter from './navagetion_logs/create_navategion_logs';
import navigationLogsRouter from './navigation-logs';

const router = Router();

router.use('/', healthRouter);


router.use('/users', getUsersRouter);
router.use('/noticias', createNoticiasRouter);
router.use('/users', postUserRouter);
router.use('/professor', professorRouter);
router.use('/navigation-logs', navigationLogsRouter);
router.use('/navagation-logs', createNavategionLogsRouter);
export default router;