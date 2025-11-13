import { Router } from 'express';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';
import { verifyAdminMiddleware } from '../../middleware/admin.middleware';
import { adminController } from './admin.controller';
import { logUserAccess } from '../../utils/loginLogger';

const router = Router();

router.get('/dashboard', verifyTokenMiddleware, verifyAdminMiddleware, (req, res, next) =>
  adminController.getDashboard(req, res).catch(next)
);

router.get('/users', verifyTokenMiddleware, verifyAdminMiddleware, (req, res, next) =>
  adminController.getUsers(req, res).catch(next)
);

router.patch('/users/:id/status', verifyTokenMiddleware, verifyAdminMiddleware, (req, res, next) =>
  adminController.toggleUserStatus(req, res).catch(next)
);

router.patch('/users/:id/role', verifyTokenMiddleware, verifyAdminMiddleware, (req, res, next) =>
  adminController.updateUserRole(req, res).catch(next)
);

router.get('/teams', verifyTokenMiddleware, verifyAdminMiddleware, (req, res, next) =>
  adminController.getTeams(req, res).catch(next)
);

router.get('/commissions', verifyTokenMiddleware, verifyAdminMiddleware, (req, res, next) =>
  adminController.getAllCommissions(req, res).catch(next)
);

router.patch('/commissions/:id/paid', verifyTokenMiddleware, verifyAdminMiddleware, (req, res, next) =>
  adminController.markCommissionAsPaid(req, res).catch(next)
);

router.get('/commissions/export', verifyTokenMiddleware, verifyAdminMiddleware, (req, res, next) =>
  adminController.exportCommissionsCSV(req, res).catch(next)
);

router.get('/reports', verifyTokenMiddleware, verifyAdminMiddleware, (req, res, next) =>
  adminController.getReports(req, res).catch(next)
);

router.get('/reports/:type', verifyTokenMiddleware, verifyAdminMiddleware, (req, res, next) =>
  adminController.downloadReport(req, res).catch(next)
);

router.get('/config', verifyTokenMiddleware, verifyAdminMiddleware, (req, res, next) =>
  adminController.getConfig(req, res).catch(next)
);

router.patch('/config', verifyTokenMiddleware, verifyAdminMiddleware, (req, res, next) =>
  adminController.updateConfig(req, res).catch(next)
);

router.get('/notifications', verifyTokenMiddleware, verifyAdminMiddleware, (req, res, next) =>
  adminController.getNotifications(req, res).catch(next)
);

router.post('/notifications', verifyTokenMiddleware, verifyAdminMiddleware, (req, res, next) =>
  adminController.createNotification(req, res).catch(next)
);

router.delete('/notifications/:id', verifyTokenMiddleware, verifyAdminMiddleware, (req, res, next) =>
  adminController.deleteNotification(req, res).catch(next)
);

router.get('/logs', verifyTokenMiddleware, verifyAdminMiddleware, (req, res, next) =>
  adminController.getLogs(req, res).catch(next)
);

router.post('/logs', verifyTokenMiddleware, (req, res, next) =>
  adminController.createLog(req, res).catch(next)
);

router.get('/access-logs', verifyTokenMiddleware, verifyAdminMiddleware, (req, res, next) =>
  adminController.getAccessLogs(req, res).catch(next)
);

router.post('/logout', verifyTokenMiddleware, async (req, res) => {
  const userId = req.user?.userId || 'unknown';
  await logUserAccess(userId, 'logout', req.ip, req.headers['user-agent']);
  res.json({ success: true, message: 'Logout registrado com sucesso' });
});

export default router;
