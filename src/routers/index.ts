import { Router } from 'express';
import getUsersRouter from './get-users';

const router = Router();

router.get('/health', (req, res) => {
  res.send('Api está no ar!');
});

router.use('/', getUsersRouter);

export default router;