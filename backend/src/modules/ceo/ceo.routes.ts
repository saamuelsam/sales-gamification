// backend/src/modules/ceo/ceo.routes.ts
import { Router } from 'express';
import { ceoController } from './ceo.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';
import { verifyCEOMiddleware } from '../../middleware/admin.middleware';

const router = Router();

/**
 * 🔐 Todas as rotas exigem autenticação e role CEO
 * Logs de auditoria são registrados automaticamente nos services
 */
router.use(verifyTokenMiddleware);
router.use(verifyCEOMiddleware);

// ========== GESTÃO DE CONSULTORES ==========

/**
 * GET /api/ceo/consultants
 * Lista todos os consultores com filtros opcionais
 * Query params: ?role=consultant&search=nome&active=true
 */
router.get('/consultants', (req, res) => ceoController.getAllConsultants(req, res));

/**
 * GET /api/ceo/consultants/:id
 * Detalhes completos de um consultor (dados, equipe, vendas)
 */
router.get('/consultants/:id', (req, res) => ceoController.getConsultantDetails(req, res));

/**
 * PUT /api/ceo/consultants/:id
 * Atualizar dados do consultor
 * Body: { name?, email?, role?, points?, is_active?, parent_id? }
 */
router.put('/consultants/:id', (req, res) => ceoController.updateConsultant(req, res));

/**
 * PATCH /api/ceo/consultants/:id/role
 * Mudar cargo do consultor
 * Body: { role: string }
 */
router.patch('/consultants/:id/role', (req, res) => ceoController.changeRole(req, res));

/**
 * PATCH /api/ceo/consultants/:id/points
 * Ajustar pontos do consultor (adicionar ou remover)
 * Body: { points: number, reason: string }
 */
router.patch('/consultants/:id/points', (req, res) => ceoController.adjustPoints(req, res));

/**
 * POST /api/ceo/consultants/:id/sales
 * Criar venda para um consultor
 * Body: { client_id, value, kilowatts, status?, description? }
 */
router.post('/consultants/:id/sales', (req, res) => ceoController.createSale(req, res));

/**
 * PATCH /api/ceo/consultants/:id/toggle-status
 * Ativar/Desativar consultor
 */
router.patch('/consultants/:id/toggle-status', (req, res) => ceoController.toggleStatus(req, res));

/**
 * PATCH /api/ceo/consultants/:id/transfer
 * Transferir consultor para outro patrocinador
 * Body: { newParentId: string }
 */
router.patch('/consultants/:id/transfer', (req, res) => ceoController.transferConsultant(req, res));

/**
 * POST /api/ceo/consultants/:id/reset-password
 * Resetar senha de um consultor
 * Body: { newPassword: string }
 */
router.post('/consultants/:id/reset-password', (req, res) => ceoController.resetPassword(req, res));

// ========== AUDITORIA ==========

/**
 * GET /api/ceo/activity-logs
 * Histórico de todas as ações realizadas pelo CEO
 * Query params: ?startDate=2024-01-01&endDate=2024-12-31&action=CEO_UPDATE_USER
 */
router.get('/activity-logs', (req, res) => ceoController.getActivityLogs(req, res));

export default router;
