// backend/src/modules/commissions/commission.routes.ts
import { Router } from 'express';
import { CommissionController } from './commission.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';
import { requireRoles } from '../../middleware/role.middleware';

const router = Router();
const controller = new CommissionController();

router.use(verifyTokenMiddleware);

router.get('/user/:userId?', controller.getUserCommissions.bind(controller));
router.get('/summary/:userId?', controller.getSummary.bind(controller));
router.put('/:id/pay', requireRoles('admin'), controller.markAsPaid.bind(controller));
router.get('/report', requireRoles('admin'), controller.getReport.bind(controller));

export default router;
