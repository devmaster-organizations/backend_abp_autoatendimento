import express from 'express';

const router = express.Router();

router.get('/users', async (req, res) => {
    const { GetUsersController } = await import('../controllers/get-user/get-users');
    const controller = new GetUsersController();
    const result = await controller.handler();
    res.json(result);
});

export default router;