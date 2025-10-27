// backend/src/modules/points/points.routes.ts

import { Router } from 'express';
import { PointsController } from './points.controller';
import { verifyToken } from '@middleware/auth.middleware';

const router = Router();
const controller = new PointsController();

router.get('/history/:userId?', verifyToken, controller.getHistory);
router.get('/total/:userId?', verifyToken, controller.getTotal);
router.get('/ranking', verifyToken, controller.getRanking);
router.get('/progress/:userId?', verifyToken, controller.getProgress);

export default router;
