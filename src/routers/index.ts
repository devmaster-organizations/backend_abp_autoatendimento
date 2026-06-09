import { type NextFunction, type Request, type Response, Router } from 'express';
import getUsersRouter from './get-users';
import createNoticiasRouter from './create-noticias';
import postUserRouter from './create-users';
import healthRouter from './health';
import professorRouter from './professor';
import navigationLogsRouter from './navigation-logs';
import inquiriesRouter from './inquiries';
import authRouter from './auth';
import devSendEmailRouter from './dev-send-email';
import { authMiddleware } from '../middlewares/auth';
import { prisma } from '../core/database/prisma';
import { requireAdminMiddleware } from '../middlewares/role';

const router = Router();

const bootstrapUserMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const usersCount = await prisma.user.count();

	// Allow creating the very first user without token.
	if (usersCount === 0) {
		(req as Request & { allowBootstrapUser?: boolean }).allowBootstrapUser = true;
		return next();
	}

	authMiddleware(req, res, (authError?: unknown) => {
		if (authError) {
			return next(authError);
		}

		return requireAdminMiddleware(req, res, next);
	});
};

router.use('/', healthRouter);
router.use('/auth', authRouter);

router.use('/noticias', createNoticiasRouter);
router.use('/users', bootstrapUserMiddleware, postUserRouter);
router.use('/users', authMiddleware, requireAdminMiddleware, getUsersRouter);
router.use('/professor', professorRouter);
router.use('/navigation-logs', navigationLogsRouter);
router.use('/inquiries', inquiriesRouter);
router.use('/dev/send-email', devSendEmailRouter);
export default router;