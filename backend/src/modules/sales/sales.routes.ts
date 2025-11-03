// backend/src/modules/sales/sales.routes.ts

import { Router } from 'express';
import { salesController } from './sales.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';
import { pool } from '../../config/database';

const router = Router();

// ✅ Middleware de autenticação aplicado a todas as rotas
router.use(verifyTokenMiddleware);

// ========== ROTAS DE DADOS AGREGADOS (SEM PARÂMETROS DE ID) ==========
// Estas devem vir ANTES de rotas com :id para evitar conflitos

router.get('/stats', (req, res) => salesController.getStats(req, res));
router.get('/chart-data', (req, res) => salesController.getChartData(req, res));

// ========== ✅ NOVA ROTA - LIMPEZA DE DADOS ==========
router.delete('/cleanup/all', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Não autenticado' });

    console.log('🗑️ Limpando dados do usuário:', userId);

    const client = await pool.connect();
    await client.query('BEGIN');
    
    // Deletar em cascata
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

// ========== ROTAS DE VENDA COM CLIENTE (ESPECÍFICA) ==========
// Esta deve vir antes de /:id para evitar conflito
router.get('/:id/with-client', (req, res) => salesController.getSaleWithClient(req, res));

// ========== ROTAS CRUD ==========

// Criar venda (POST)
router.post('/', (req, res) => salesController.createSale(req, res));

// Listar vendas (GET)
router.get('/', (req, res) => salesController.listSales(req, res));

// Atualizar status de venda (PATCH)
router.patch('/:id/status', (req, res) => salesController.updateStatus(req, res));

// Buscar venda por ID (GET) - Deve vir depois de rotas mais específicas
router.get('/:id', (req, res) => salesController.getSale(req, res));

// Atualizar venda (PUT)
router.put('/:id', (req, res) => salesController.updateSale(req, res));

// Deletar venda (DELETE)
router.delete('/:id', (req, res) => salesController.deleteSale(req, res));

export default router;
