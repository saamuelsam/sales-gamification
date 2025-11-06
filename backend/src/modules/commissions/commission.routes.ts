// backend/src/modules/commissions/commission.routes.ts
import { Router } from 'express';
import { commissionController } from './commission.controller';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// ✅ Minhas comissões de rede (EXISTE)
router.get('/network', verifyTokenMiddleware, (req, res, next) =>
  commissionController.getNetworkCommissions(req, res).catch(next)
);

// ✅ Resumo consolidado (EXISTE)
router.get('/summary', verifyTokenMiddleware, (req, res, next) =>
  commissionController.getSummary(req, res).catch(next)
);

// ✅ Marcar comissão como paga (EXISTE)
router.put('/:commissionId/mark-paid', verifyTokenMiddleware, (req, res, next) =>
  commissionController.markAsPaid(req, res).catch(next)
);

// ✅ Relatório (EXISTE)
router.get('/report', verifyTokenMiddleware, (req, res, next) =>
  commissionController.getReport(req, res).catch(next)
);

// ✅ Exportar CSV (EXISTE)
router.get('/export/csv', verifyTokenMiddleware, (req, res, next) =>
  commissionController.exportCSV(req, res).catch(next)
);

export default router;
