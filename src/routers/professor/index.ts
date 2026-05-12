import { Router } from 'express';
import getProfessorRouter from './get-professor';

const router = Router();

router.use('/', getProfessorRouter);

export default router;
