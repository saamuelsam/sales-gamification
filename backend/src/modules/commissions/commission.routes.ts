import { Router } from 'express';
import { verifyTokenMiddleware } from '../../middleware/auth.middleware';
import { commissionController } from './commission.controller';
import { verifyCommissionAccess } from '../../middleware/ownership.middleware';
import { sanitizeStrings } from '../../middleware/validation.middleware';

const router = Router();

// ✅ Middleware global de autenticação e sanitização
router.use(verifyTokenMiddleware);
router.use(sanitizeStrings);

/**
 * 🔹 Rotas de comissões (validação de acesso)
 * Usuários só podem ver suas próprias comissões, exceto admins/financeiro
 */
router.get('/summary', verifyCommissionAccess, (req, res, next) =>
  commissionController.getSummary(req, res).catch(next)
);

router.get('/personal', verifyCommissionAccess, (req, res, next) =>
  commissionController.getPersonalCommissions(req, res).catch(next)
);

router.get('/network', verifyCommissionAccess, (req, res, next) =>
  commissionController.getNetworkCommissions(req, res).catch(next)
);

router.get('/monthly', verifyCommissionAccess, (req, res, next) =>
  commissionController.getMonthly(req, res).catch(next)
);

export default router;
