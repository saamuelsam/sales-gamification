import { Router } from 'express';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';
import { commissionController } from './commission.controller';

const router = Router();

/**
 * 🔹 Rotas de comissões
 */
router.get('/summary', verifyTokenMiddleware, (req, res, next) =>
  commissionController.getSummary(req, res).catch(next)
);

router.get('/personal', verifyTokenMiddleware, (req, res, next) =>
  commissionController.getPersonalCommissions(req, res).catch(next)
);

router.get('/network', verifyTokenMiddleware, (req, res, next) =>
  commissionController.getNetworkCommissions(req, res).catch(next)
);

router.get('/monthly', verifyTokenMiddleware, (req, res, next) =>
  commissionController.getMonthly(req, res).catch(next)
);

export default router;
