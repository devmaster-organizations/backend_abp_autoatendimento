import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.send('Api está no ar!');
});

export default router;