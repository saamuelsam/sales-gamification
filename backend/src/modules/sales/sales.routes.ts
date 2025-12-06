// backend/src/modules/sales/sales.routes.ts
import { Router } from 'express';
import { salesController } from './sales.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';
import { verifyAdminMiddleware } from '../../middleware/admin.middleware';
import { checkFinancialPermission, preventSaleEdit } from '../../middleware/checkFinancialPermission';
import { updateClientController } from './updateClient.controller';
import { verifySaleOwnership } from '../../middleware/ownership.middleware';
import { 
  validate, 
  createSaleSchema, 
  updateSaleSchema, 
  updateSaleStatusSchema,
  validateUUID,
  sanitizeStrings
} from '../../middleware/validation.middleware';

const router = Router();

// ✅ Middleware de autenticação e sanitização aplicado a todas as rotas
router.use(verifyTokenMiddleware);
router.use(sanitizeStrings);

// ========== ROTAS DE DADOS AGREGADOS ==========
router.get('/stats', (req, res) => salesController.getStats(req, res));
router.get('/chart-data', (req, res) => salesController.getChartData(req, res));

// ========== ⚠️ LIMPEZA DE DADOS - RESTRITO APENAS PARA ADMINS ==========
// VULNERABILIDADE CORRIGIDA: Endpoint de cleanup agora requer permissão de admin
router.delete('/cleanup/all', verifyAdminMiddleware, async (req: any, res) => {
  try {
    const targetUserId = req.body.user_id || req.user?.userId;
    if (!targetUserId) return res.status(400).json({ error: 'user_id obrigatório' });

    console.log(`🗑️ [ADMIN] Limpando dados do usuário: ${targetUserId} (solicitado por: ${req.user?.userId})`);

    const { pool } = await import('@config/database');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM notifications WHERE user_id = $1', [targetUserId]);
      await client.query('DELETE FROM points WHERE user_id = $1', [targetUserId]);
      await client.query('DELETE FROM sales WHERE user_id = $1', [targetUserId]);
      await client.query('COMMIT');
      
      console.log(`✅ [ADMIN] Limpeza concluída para ${targetUserId}`);
      res.json({ success: true, message: 'Todos os dados foram deletados' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('❌ Erro na limpeza:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== CRUD DE VENDAS ==========

// Criar venda (com validação de inputs + rate limiting)
const { salesCreationLimiter } = require('../../middleware/security.middleware');
router.post('/', salesCreationLimiter, validate(createSaleSchema), (req, res) => salesController.createSale(req, res));

// Listar vendas (próprio usuário ou admin)
router.get('/', (req, res) => salesController.listSales(req, res));

// ✅ Buscar venda por ID (validação de ownership)
router.get('/:id', validateUUID('id'), verifySaleOwnership, (req, res) => salesController.getSale(req, res));

// ✅ Venda com dados do cliente (validação de ownership)
router.get('/:id/with-client', validateUUID('id'), verifySaleOwnership, (req, res) => salesController.getSaleWithClient(req, res));

// ✅ Atualizar STATUS da venda (validação de ownership + permissão financeira)
router.put('/:id/status', validateUUID('id'), validate(updateSaleStatusSchema), verifySaleOwnership, checkFinancialPermission, (req, res) => salesController.updateStatus(req, res));

// ✅ Atualizar CLIENTE da venda (validação de ownership)
router.put('/:id/client', validateUUID('id'), verifySaleOwnership, (req, res) => updateClientController.updateSaleClient(req, res));

// ✅ Atualizar dados da venda (validação de ownership + permissão financeira)
router.put('/:id', validateUUID('id'), validate(updateSaleSchema), verifySaleOwnership, checkFinancialPermission, preventSaleEdit, (req, res) => salesController.updateSale(req, res));

// ✅ Deletar venda (validação de ownership + rate limiting)
const { deleteLimiter } = require('../../middleware/security.middleware');
router.delete('/:id', deleteLimiter, validateUUID('id'), verifySaleOwnership, (req, res) => salesController.deleteSale(req, res));

export default router;
