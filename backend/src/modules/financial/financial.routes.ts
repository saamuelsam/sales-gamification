// backend/src/modules/financial/financial.routes.ts
import { Router } from 'express';
import { FinancialController } from './financial.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';
import { checkFinancialPermission } from '../../middleware/checkFinancialPermission';

const router = Router();
const financialController = new FinancialController();

// 🔐 Todas as rotas exigem autenticação + permissão financeira
router.use(verifyTokenMiddleware);
router.use(checkFinancialPermission);

/**
 * GET /api/financial/pending-sales
 * Listar vendas pendentes de aprovação
 */
router.get('/pending-sales', (req, res) => financialController.getPendingSales(req, res));

/**
 * POST /api/financial/approve/:saleId
 * Aprovar uma venda
 */
router.post('/approve/:saleId', (req, res) => financialController.approveSale(req, res));

/**
 * POST /api/financial/reject/:saleId
 * Rejeitar uma venda
 */
router.post('/reject/:saleId', (req, res) => financialController.rejectSale(req, res));

/**
 * GET /api/financial/stats
 * Estatísticas de aprovação
 */
router.get('/stats', (req, res) => financialController.getStats(req, res));

/**
 * GET /api/financial/history/:saleId
 * Histórico de aprovações de uma venda específica
 */
router.get('/history/:saleId', (req, res) => financialController.getSaleHistory(req, res));

export default router;
