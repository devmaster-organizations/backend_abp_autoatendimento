import { type NextFunction, type Request, type Response, Router } from 'express';
import getUsersRouter from './get-users';
import createNoticiasRouter from './create-noticias';
import postUserRouter from './create-users';
import healthRouter from './health';
import professorRouter from './professor';
import navigationLogsRouter from './navigation-logs';
import authRouter from './auth';
import { authMiddleware } from '../middlewares/auth';
import { prisma } from '../core/database/prisma';

const router = Router();

const bootstrapUserMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const usersCount = await prisma.user.count();

	// Allow creating the very first user without token.
	if (usersCount === 0) {
		return next();
	}

	return authMiddleware(req, res, next);
};

router.use('/', healthRouter);
router.use('/auth', authRouter);

router.use('/noticias', createNoticiasRouter);
router.use('/users', bootstrapUserMiddleware, postUserRouter);
router.use('/users', authMiddleware, getUsersRouter);
router.use('/professor', professorRouter);
router.use('/navigation-logs', navigationLogsRouter);
export default router;