// backend/src/modules/dashboard/dashboard.routes.ts
import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const controller = new DashboardController();

router.use(verifyTokenMiddleware);

router.get('/personal', controller.getPersonal.bind(controller));
router.get('/team', controller.getTeam.bind(controller));
router.get('/complete', controller.getComplete.bind(controller));
router.get('/admin', controller.getAdmin.bind(controller));

export default router;
