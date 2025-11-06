import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { verifyTokenMiddleware as authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// ✅ GET - Listar notificações
router.get('/', (req, res) => notificationsController.list(req, res));

// ✅ GET - Contar não lidas
router.get('/unread-count', (req, res) => notificationsController.getUnreadCount(req, res));

// ✅ POST - CRIAR notificação (NOVO!)
router.post('/', (req, res) => notificationsController.create?.(req, res));

// ✅ PUT - Marcar como lida
router.put('/:id/read', (req, res) => notificationsController.markAsRead(req, res));

// ✅ PUT - Marcar todas como lidas
router.put('/mark-all-read', (req, res) => notificationsController.markAllAsRead(req, res));

// ✅ DELETE - Deletar notificação
router.delete('/:id', (req, res) => notificationsController.delete(req, res));

export default router;
