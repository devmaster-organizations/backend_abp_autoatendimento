import {Router} from 'express';
import { Prisma } from '@prisma/client';
// import { IPostMaisUmController } from '../controllers/create-main-um/protocols';
import { CreateNavigationController } from '../../controllers/create-navagation-logs/create-navagetion-logs';
import { NavigationLogs } from '../../models/nagation-logs'
import { PostgresPostNavigationLogs } from '../../repositories/navigation_logs/create-navigation';

const router = Router();

const serializeBigInt = <T>(payload: T): T => {
    return JSON.parse(
        JSON.stringify(payload, (_key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        )
    ) as T;
};

router.post('/', async (req, res) => {
    try {
        const {data} = req.body;

        const navigation_logs = new NavigationLogs(
            data.id,
            data.parentId,
            data.title,
            data.slug,
            data.prompt,
            data.answerSummary,
            data.evidenceExcerpt,
            data.evidenceSource,
            data.displayOrder,
            data.isActive
        );
        const postgresPostRepository = new PostgresPostNavigationLogs();
        const createNavigationController = new CreateNavigationController(postgresPostRepository);
        const result = await createNavigationController.handler(navigation_logs);

        res.status(201).json({
            message: "Navigation log created successfully",
            data: serializeBigInt(result.body)
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(409).json({
                message: 'Slug already exists. Use a unique slug.',
                code: 'SLUG_CONFLICT'
            });
        }

        return res.status(500).json({
            message: 'Internal server error while creating navigation log.'
        });
    }
});

export default router;