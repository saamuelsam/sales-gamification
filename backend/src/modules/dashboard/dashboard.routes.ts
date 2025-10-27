import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const dashboardController = new DashboardController();

// Todas as rotas requerem autenticação
router.use(verifyTokenMiddleware);

router.get('/personal', dashboardController.getPersonal);
router.get('/team', dashboardController.getTeam);
router.get('/complete', dashboardController.getComplete);
router.get('/admin', dashboardController.getAdmin);

export default router;
