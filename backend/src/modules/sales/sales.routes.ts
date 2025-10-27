import { Router } from 'express';
import { SalesController } from './sales.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const salesController = new SalesController();

router.use(verifyTokenMiddleware);

// Rotas específicas PRIMEIRO (antes das dinâmicas)
router.get('/stats', salesController.getStats);
router.get('/chart-data', salesController.getChartData);

// Rotas de listagem
router.post('/', salesController.createSale);
router.get('/', salesController.listSales);

// Rotas dinâmicas DEPOIS
router.get('/:id/client', salesController.getSaleWithClient);
router.get('/:id', salesController.getSale);
router.put('/:id', salesController.updateSale);
router.patch('/:id/status', salesController.updateStatus);
router.delete('/:id', salesController.deleteSale);

export default router;
