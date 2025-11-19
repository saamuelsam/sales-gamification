// backend/src/modules/financial/financial.routes.ts
import { Router } from 'express';
import { FinancialController } from './financial.controller';
import { CommissionPaymentController } from './commissionPayment.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';
import { checkFinancialPermission } from '../../middleware/checkFinancialPermission';

const router = Router();
const financialController = new FinancialController();
const commissionPaymentController = new CommissionPaymentController();

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

// ============================================
// 💰 ROTAS DE PAGAMENTO DE COMISSÕES
// ============================================

/**
 * GET /api/financial/commission-payments/pending
 * Listar todos os usuários com comissões pendentes
 */
router.get('/commission-payments/pending', (req, res) => 
  commissionPaymentController.getPendingCommissions(req, res)
);

/**
 * GET /api/financial/commission-payments/user/:userId/details
 * Buscar detalhes das comissões de um usuário específico
 */
router.get('/commission-payments/user/:userId/details', (req, res) => 
  commissionPaymentController.getUserCommissionDetails(req, res)
);

/**
 * POST /api/financial/commission-payments/create
 * Criar um novo pagamento de comissões
 */
router.post('/commission-payments/create', (req, res) => 
  commissionPaymentController.createPayment(req, res)
);

/**
 * PUT /api/financial/commission-payments/:paymentId/confirm
 * Confirmar pagamento realizado
 */
router.put('/commission-payments/:paymentId/confirm', (req, res) => 
  commissionPaymentController.confirmPayment(req, res)
);

/**
 * PUT /api/financial/commission-payments/:paymentId/cancel
 * Cancelar pagamento
 */
router.put('/commission-payments/:paymentId/cancel', (req, res) => 
  commissionPaymentController.cancelPayment(req, res)
);

/**
 * GET /api/financial/commission-payments/history
 * Histórico de pagamentos de comissões
 */
router.get('/commission-payments/history', (req, res) => 
  commissionPaymentController.getPaymentHistory(req, res)
);

export default router;
