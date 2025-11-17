// backend/src/modules/sales/sales.routes.ts
import { Router } from 'express';
import { salesController } from './sales.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';
import { checkFinancialPermission, preventSaleEdit } from '../../middleware/checkFinancialPermission';
import { updateClientController } from './updateClient.controller';
import { pool } from '@config/database';

const router = Router();

// ✅ Middleware de autenticação aplicado a todas as rotas
router.use(verifyTokenMiddleware);

// ========== ROTAS DE DADOS AGREGADOS ==========
router.get('/stats', (req, res) => salesController.getStats(req, res));
router.get('/chart-data', (req, res) => salesController.getChartData(req, res));

// ========== LIMPEZA DE DADOS ==========
router.delete('/cleanup/all', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    console.log('🗑️ Limpando dados do usuário:', userId);

    const client = await pool.connect();
    await client.query('BEGIN');
    await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM points WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM sales WHERE user_id = $1', [userId]);
    await client.query('COMMIT');
    client.release();

    console.log('✅ Limpeza concluída');
    res.json({ success: true, message: 'Todos os dados foram deletados' });
  } catch (error: any) {
    console.error('❌ Erro na limpeza:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== ROTAS DE VENDA COM CLIENTE ==========
router.get('/:id/with-client', (req, res) => salesController.getSaleWithClient(req, res));

// ========== CRUD DE VENDAS ==========

// Criar venda
router.post('/', (req, res) => salesController.createSale(req, res));

// Listar vendas
router.get('/', (req, res) => salesController.listSales(req, res));

// ✅ Atualizar STATUS da venda - APENAS FINANCEIRO/CEO (gera comissão automaticamente)
router.put('/:id/status', checkFinancialPermission, (req, res) => salesController.updateStatus(req, res));

// ✅ Atualizar CLIENTE da venda - CONSULTORES podem editar suas vendas
router.put('/:id/client', (req, res) => updateClientController.updateSaleClient(req, res));

// Buscar venda por ID
router.get('/:id', (req, res) => salesController.getSale(req, res));

// ✅ Atualizar dados da venda - BLOQUEADO PARA CONSULTORES
router.put('/:id', preventSaleEdit, (req, res) => salesController.updateSale(req, res));

// Deletar venda
router.delete('/:id', (req, res) => salesController.deleteSale(req, res));

export default router;
