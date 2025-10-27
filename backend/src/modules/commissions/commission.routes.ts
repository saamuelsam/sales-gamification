// backend/src/modules/commissions/commission.routes.ts

import { Router } from 'express';
import { CommissionController } from './commission.controller';
import { verifyToken } from '@middleware/auth.middleware';
import { requireRole } from '@middleware/role.middleware';

const router = Router();
const controller = new CommissionController();

router.get('/user/:userId?', verifyToken, controller.getUserCommissions);
router.get('/summary/:userId?', verifyToken, controller.getSummary);
router.put('/:id/pay', verifyToken, requireRole(['admin']), controller.markAsPaid);
router.get('/report', verifyToken, requireRole(['admin']), controller.getReport);

export default router;
