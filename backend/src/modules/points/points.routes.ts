// backend/src/modules/points/points.routes.ts
import { Router } from 'express';
import { PointsController } from './points.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const controller = new PointsController();

router.use(verifyTokenMiddleware);

router.get('/history/:userId?', controller.getHistory.bind(controller));
router.get('/total/:userId?', controller.getTotal.bind(controller));
router.get('/ranking', controller.getRanking.bind(controller));
router.get('/progress/:userId?', controller.getProgress.bind(controller));

export default router;
