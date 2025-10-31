import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { verifyTokenMiddleware as authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', notificationsController.list.bind(notificationsController));
router.get('/unread-count', notificationsController.getUnreadCount.bind(notificationsController));
router.put('/:id/read', notificationsController.markAsRead.bind(notificationsController));
router.put('/mark-all-read', notificationsController.markAllAsRead.bind(notificationsController));
router.delete('/:id', notificationsController.delete.bind(notificationsController));

export default router;
