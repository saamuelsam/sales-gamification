"use strict";
// backend/src/modules/sales/sales.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sales_controller_1 = require("./sales.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const database_1 = require("../../config/database");
const router = (0, express_1.Router)();
// ✅ Middleware de autenticação aplicado a todas as rotas
router.use(auth_middleware_1.verifyTokenMiddleware);
// ========== ROTAS DE DADOS AGREGADOS (SEM PARÂMETROS DE ID) ==========
// Estas devem vir ANTES de rotas com :id para evitar conflitos
router.get('/stats', (req, res) => sales_controller_1.salesController.getStats(req, res));
router.get('/chart-data', (req, res) => sales_controller_1.salesController.getChartData(req, res));
// ========== ✅ NOVA ROTA - LIMPEZA DE DADOS ==========
router.delete('/cleanup/all', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Não autenticado' });
        console.log('🗑️ Limpando dados do usuário:', userId);
        const client = await database_1.pool.connect();
        await client.query('BEGIN');
        // Deletar em cascata
        await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM points WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM sales WHERE user_id = $1', [userId]);
        await client.query('COMMIT');
        client.release();
        console.log('✅ Limpeza concluída');
        res.json({ success: true, message: 'Todos os dados foram deletados' });
    }
    catch (error) {
        console.error('❌ Erro na limpeza:', error);
        res.status(500).json({ error: error.message });
    }
});
// ========== ROTAS DE VENDA COM CLIENTE (ESPECÍFICA) ==========
// Esta deve vir antes de /:id para evitar conflito
router.get('/:id/with-client', (req, res) => sales_controller_1.salesController.getSaleWithClient(req, res));
// ========== ROTAS CRUD ==========
// Criar venda (POST)
router.post('/', (req, res) => sales_controller_1.salesController.createSale(req, res));
// Listar vendas (GET)
router.get('/', (req, res) => sales_controller_1.salesController.listSales(req, res));
// Atualizar status de venda (PATCH)
router.patch('/:id/status', (req, res) => sales_controller_1.salesController.updateStatus(req, res));
// Buscar venda por ID (GET) - Deve vir depois de rotas mais específicas
router.get('/:id', (req, res) => sales_controller_1.salesController.getSale(req, res));
// Atualizar venda (PUT)
router.put('/:id', (req, res) => sales_controller_1.salesController.updateSale(req, res));
// Deletar venda (DELETE)
router.delete('/:id', (req, res) => sales_controller_1.salesController.deleteSale(req, res));
exports.default = router;
