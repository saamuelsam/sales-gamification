// backend/src/modules/sales/sales.routes.ts
import { Router } from 'express';
import { SalesController } from './sales.controller';
import { verifyTokenMiddleware } from '@middleware/auth.middleware';

const router = Router();
const controller = new SalesController();

router.use(verifyTokenMiddleware);

// Rotas específicas primeiro
router.get('/stats', controller.getStats.bind(controller));
router.get('/chart-data', controller.getChartData.bind(controller));

// CRUD
router.post('/', controller.createSale.bind(controller));
router.get('/', controller.listSales.bind(controller));
router.get('/:id/client', controller.getSaleWithClient.bind(controller));
router.get('/:id', controller.getSale.bind(controller));
router.put('/:id', controller.updateSale.bind(controller));
router.patch('/:id/status', controller.updateStatus.bind(controller));
router.delete('/:id', controller.deleteSale.bind(controller));

export default router;
